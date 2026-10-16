// Supabase Edge Function: send-event-notifications
//
// Delivers durable notification rows (created by the DB triggers in
// supabase/notifications.sql) as privacy-safe Web Push messages. Reuses the
// project's existing VAPID config, web-push client and push_subscriptions
// schema (via _shared/reminders.ts).
//
// Invocation modes (all authenticated as an internal/server operation — deploy
// with --no-verify-jwt and call with the service-role bearer):
//   • Single:  { "notificationId": "<uuid>" }            ← direct call
//              { "record": { "id": "<uuid>" } }          ← Supabase DB Webhook
//   • Batch:   {}  (or { "limit": 20 })                  ← retry cron backstop
//
// Each batch run (every 5 minutes) first queues the reminders for group prayer
// meetings starting within the next 15 minutes (_shared/meetingTime.ts decides
// with the shared schedule engine; queue_group_meeting_reminder fans out one
// deduped 'prayer_meeting' notification per member), then delivers as usual.
// It also delivers release announcements ('app_news', queue_app_news()) from
// their own queue, to the members for whom it is now daytime (10:00–20:00).
//
// Idempotency + concurrency: rows are claimed via SECURITY DEFINER RPCs that flip
// pending/failed → processing with FOR UPDATE SKIP LOCKED, so the webhook and the
// retry cron can never double-send the same notification.
//
// Deploy:  supabase functions deploy send-event-notifications --no-verify-jwt
// Secrets: (already set for the reminder functions)
//   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
import { initReminderEnv, requireInternalAuth, sendPush, json } from '../_shared/reminders.ts';
import { eventPayload, digestPayload } from '../_shared/eventNotify.ts';
import { remindersDue, type MeetingTiming } from '../_shared/meetingTime.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

type Notification = {
  id: string;
  recipient_id: string;
  type: string;
  group_id: string | null;
  metadata: Record<string, unknown>;
};

// Release announcements sent per run, on top of the usual batch. They come
// from their own queue, so they never delay an ordinary notification.
const APP_NEWS_BATCH = 100;

type Pref = { in_app: boolean; push: boolean; mode: string; quiet_start: string | null; quiet_end: string | null; tz: string | null };

// Local "HH:MM" for the recipient in their IANA timezone (DST-correct). Falls
// back to UTC when no/invalid timezone is stored.
function localHM(tz: string | null): { h: number; m: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz || 'UTC', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date());
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
    return { h: h === 24 ? 0 : h, m };
  } catch {
    const now = new Date();
    return { h: now.getUTCHours(), m: now.getUTCMinutes() };
  }
}

// True when `now` (in the recipient's tz) is inside the quiet-hours window.
// Supports windows that wrap past midnight (e.g. 22:00 → 07:00).
function inQuietHours(pref: Pref): boolean {
  if (!pref.quiet_start || !pref.quiet_end) return false;
  const { h, m } = localHM(pref.tz);
  const cur = h * 60 + m;
  const [sh, sm] = pref.quiet_start.split(':').map(Number);
  const [eh, em] = pref.quiet_end.split(':').map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  if (start === end) return false;
  return start < end ? (cur >= start && cur < end) : (cur >= start || cur < end);
}

async function resolvePref(supabase: SupabaseClient, n: Notification): Promise<Pref> {
  const { data } = await supabase.rpc('resolve_notification_pref', {
    p_user: n.recipient_id, p_type: n.type, p_group: n.group_id,
  });
  const row = Array.isArray(data) ? data[0] : data;
  return row || { in_app: true, push: true, mode: 'immediate', quiet_start: null, quiet_end: null, tz: null };
}

// Delivers one claimed (already 'processing') notification and records the
// outcome. Returns the terminal status for the batch summary.
async function deliver(supabase: SupabaseClient, n: Notification): Promise<string> {
  // A meeting reminder held back (quiet hours, a retry) is useless once the
  // meeting has begun: the in-app row stays, the push is dropped.
  if (meetingStarted(n)) {
    await supabase.rpc('finish_notification_delivery', { p_id: n.id, p_status: 'skipped', p_error: 'expired', p_increment: false });
    return 'skipped';
  }

  const pref = await resolvePref(supabase, n);

  // Push disabled for this type → nothing to send (the in-app row still stands).
  if (!pref.push || pref.mode === 'off') {
    await supabase.rpc('finish_notification_delivery', { p_id: n.id, p_status: 'skipped', p_error: 'push_disabled', p_increment: false });
    return 'skipped';
  }

  // Digest mode → don't push now: mark it 'skipped'/'digest' so the digest cron
  // (mode { digest: true } below) folds it into one summary. The in-app row is
  // already visible in the inbox immediately.
  if (pref.mode === 'digest') {
    await supabase.rpc('finish_notification_delivery', { p_id: n.id, p_status: 'skipped', p_error: 'digest', p_increment: false });
    return 'digest';
  }

  // Quiet hours → DELAY (not drop): revert to 'pending' without spending an
  // attempt, so the retry cron re-tries once the window closes.
  if (inQuietHours(pref)) {
    await supabase.rpc('finish_notification_delivery', { p_id: n.id, p_status: 'pending', p_error: 'quiet_hours', p_increment: false });
    return 'delayed';
  }

  // Deliver to EVERY live device the recipient has subscribed. `enabled` is the
  // daily-reminder flag (send-daily-reminder gates on it) — it must NOT gate
  // event push, or notifications would only reach users who also happen to have
  // the daily reminder switched on. The account-level master switch for events
  // is notification_preferences.push_enabled, already enforced as pref.push above.
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, lang')
    .eq('user_id', n.recipient_id);

  if (!subs || subs.length === 0) {
    await supabase.rpc('finish_notification_delivery', { p_id: n.id, p_status: 'skipped', p_error: 'no_subscriptions', p_increment: false });
    return 'skipped';
  }

  let anySent = false;
  let anyTransientFail = false;
  for (const sub of subs) {
    const payload = eventPayload(n.type, sub.lang || 'en', n.metadata || {}, n.id);
    const result = await sendPush(sub, payload);
    if (result.sent) {
      anySent = true;
    } else if (result.gone) {
      // Permanent (404/410/401/403) → drop the dead subscription.
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    } else {
      anyTransientFail = true;
    }
  }

  if (anySent) {
    await supabase.rpc('finish_notification_delivery', { p_id: n.id, p_status: 'sent', p_error: null, p_increment: true });
    return 'sent';
  }
  if (anyTransientFail) {
    // Retryable — increment attempts; the retry cron picks it up again (< 5).
    await supabase.rpc('finish_notification_delivery', { p_id: n.id, p_status: 'failed', p_error: 'transient', p_increment: true });
    return 'failed';
  }
  // Every device was dead and removed — nothing left to deliver to.
  await supabase.rpc('finish_notification_delivery', { p_id: n.id, p_status: 'skipped', p_error: 'all_gone', p_increment: false });
  return 'skipped';
}

function meetingStarted(n: Notification, now = Date.now()): boolean {
  if (n.type !== 'prayer_meeting') return false;
  const startsAt = Date.parse(String(n.metadata?.starts_at || ''));
  return Number.isFinite(startsAt) && startsAt <= now;
}

// Queue a reminder for every group meeting that starts within the reminder
// window, returning how many members were reminded. Only timing columns are
// read — a meeting's details are ciphertext the server cannot open.
// Failure-soft: a bad row never blocks delivery.
async function queueMeetingReminders(supabase: SupabaseClient, now = new Date()): Promise<number> {
  const { data: meetings, error } = await supabase
    .from('group_meetings')
    .select('id, schedule, start_time, timezone');
  if (error || !meetings) return 0;
  let queued = 0;
  for (const meeting of meetings as MeetingTiming[]) {
    try {
      for (const { key, startsAt } of remindersDue(meeting, now)) {
        const { data: members, error: rpcError } = await supabase.rpc('queue_group_meeting_reminder', {
          p_meeting: meeting.id, p_occurrence: key, p_starts_at: startsAt.toISOString(),
        });
        if (!rpcError) queued += Number(members) || 0;
      }
    } catch {
      // An unreadable schedule or timezone: skip this meeting only.
    }
  }
  return queued;
}

// Digest run: for each recipient with pending digest notifications, send ONE
// summary push (respecting quiet hours) instead of the individual pushes that
// were deferred by deliver(). Claiming stamps digested_at so rows are never
// summarized twice, and a recipient still in quiet hours is left for the next run.
async function runDigest(supabase: SupabaseClient, limit: number) {
  const summary = { digested: 0, users: 0, skipped: 0 };
  const { data: recips } = await supabase.rpc('pending_digest_recipients', { p_limit: limit });
  for (const { recipient_id } of (recips || [])) {
    // Quiet hours are account-level → resolve on the '_account' pseudo-type.
    const pref = await resolvePref(supabase, { id: '', recipient_id, type: '_account', group_id: null, metadata: {} });
    if (inQuietHours(pref)) { summary.skipped++; continue; }

    const { data: claimed } = await supabase.rpc('claim_user_digest', { p_recipient: recipient_id });
    if (!claimed || claimed.length === 0) continue;

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, lang')
      .eq('user_id', recipient_id);

    summary.users++;
    summary.digested += claimed.length;
    for (const sub of subs || []) {
      const payload = digestPayload(sub.lang || 'en', claimed.length);
      const result = await sendPush(sub, payload);
      if (result.gone) await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    }
  }
  return summary;
}

Deno.serve(async (req) => {
  try {
    // Only an internal/server caller may drive delivery — see requireInternalAuth
    // in _shared/reminders.ts for why (--no-verify-jwt deploy, shared-secret gate).
    const unauthorized = requireInternalAuth(req);
    if (unauthorized) return unauthorized;

    const init = initReminderEnv();
    if ('error' in init) return init.error;
    const { supabase } = init;

    const body: { digest?: boolean; limit?: number; notificationId?: string; record?: { id?: string }; id?: string } =
      await req.json().catch(() => ({}));

    // Digest run (hourly cron): batch each user's deferred pushes into a summary.
    if (body?.digest) {
      const summary = await runDigest(supabase, Number.isFinite(body?.limit) ? body.limit : 200);
      return json(summary);
    }

    const singleId: string | null = body?.notificationId || body?.record?.id || body?.id || null;

    let claimed: Notification[] = [];
    let meetingReminders = 0;
    if (singleId) {
      const { data } = await supabase.rpc('claim_notification', { p_id: singleId });
      claimed = data || [];
    } else {
      meetingReminders = await queueMeetingReminders(supabase);
      // Room for this run's meeting reminders on top of the usual batch, so a
      // large group is reminded before its meeting rather than five minutes later.
      const limit = (Number.isFinite(body?.limit) ? body.limit : 20) + Math.min(meetingReminders, 500);
      const { data } = await supabase.rpc('claim_notifications_for_delivery', { p_limit: limit });
      const { data: news } = await supabase.rpc('claim_app_news_for_delivery', { p_limit: APP_NEWS_BATCH });
      claimed = [...(data || []), ...(news || [])];
    }

    const summary: Record<string, number> = { sent: 0, skipped: 0, failed: 0, delayed: 0 };
    for (const n of claimed) {
      const status = await deliver(supabase, n as Notification);
      summary[status] = (summary[status] || 0) + 1;
    }

    return json({ claimed: claimed.length, meetingReminders, ...summary });
  } catch (e) {
    return json({ error: 'unhandled', message: String((e as Error)?.message || e) }, 500);
  }
});
