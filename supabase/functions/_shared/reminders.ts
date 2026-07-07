// Shared helpers for the independently-scheduled send-daily-reminder and
// send-follow-up-reminder Edge Functions (split from the original combined
// send-reminders function so each reminder type has its own cron/deploy).
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

export const WINDOW_MIN = 15; // must match each cron's interval

// Notification copy + payload builders live in ./notify.ts (pure, no npm
// imports) so they are unit-testable from Vitest and shared by both reminder
// functions. By design those builders carry NO prayer content by default —
// no titles, descriptions, or person names (see acceptance criterion #9).

// True once `days` have elapsed since the cadence anchor (last follow-up
// push, or the enable-time stamp the client writes). A missing anchor is
// never "due now" — the scheduler stamps it on first sight instead — so the
// first follow-up always arrives one full cadence after enabling.
export function followUpDue(lastSentAt: string | null, days: number | null, now: Date): boolean {
  if (!lastSentAt) return false;
  const elapsedMs = now.getTime() - new Date(lastSentAt).getTime();
  return elapsedMs >= (days || 7) * 86400000;
}

// True when `sub`'s local clock has just reached `time` (within the cron's
// polling window). Defaults to the daily reminder_time; the follow-up
// scheduler passes the subscription's own follow_up_time instead.
export function isWithinReminderWindow(
  sub: { tz_offset?: number; reminder_time?: string },
  utcMinutes: number,
  time: string | undefined = sub.reminder_time,
): boolean {
  const local = (((utcMinutes + (sub.tz_offset || 0)) % 1440) + 1440) % 1440;
  const [rh, rm] = String(time || '07:00').split(':').map(Number);
  const diff = local - (rh * 60 + rm);
  return diff >= 0 && diff < WINDOW_MIN;
}

export const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

// Reads/validates the env this function needs and returns a ready Supabase
// client, or a Response to return immediately when something's missing —
// surfaces a clear reason instead of a blank 500.
export function initReminderEnv(): { supabase: SupabaseClient } | { error: Response } {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');

  const missing = ([
    ['SUPABASE_URL', url],
    ['SUPABASE_SERVICE_ROLE_KEY', serviceKey],
    ['VAPID_PUBLIC_KEY', vapidPublic],
    ['VAPID_PRIVATE_KEY', vapidPrivate],
  ] as [string, string | undefined][]).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) return { error: json({ error: 'missing_env', missing }, 500) };

  try {
    webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@pray4me.app', vapidPublic!, vapidPrivate!);
  } catch (e) {
    return { error: json({ error: 'invalid_vapid_keys', message: String((e as Error)?.message || e) }, 500) };
  }

  return { supabase: createClient(url!, serviceKey!) };
}

// Sends one Web Push message. `gone` is true when the subscription is
// expired/invalid (404/410) or permanently rejected by the push service
// (401/403 — e.g. bound to a since-rotated VAPID key) and should be deleted
// by the caller so the client is forced to create a fresh one.
export async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: string,
): Promise<{ sent: boolean; gone: boolean }> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload,
    );
    return { sent: true, gone: false };
  } catch (e: any) {
    // Logged so silent delivery failures (auth/VAPID mismatch, etc.) are
    // visible in the function's logs instead of just never sending.
    console.error('push send failed', e?.statusCode, e?.body || e?.message || e);
    const gone = [401, 403, 404, 410].includes(e?.statusCode);
    return { sent: false, gone };
  }
}
