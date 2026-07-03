// Supabase Edge Function: send-follow-up-reminder
// Invoked every ~15 min by its own pg_cron job. Finds subscriptions whose
// local time has just reached their reminder_time and whose follow_up_days
// interval has elapsed, then sends a Web Push encouraging the user to reach
// out to whoever they've prayed for and log the answer. Independent of, and
// runs alongside, send-daily-reminder (split so each reminder type has its
// own cron schedule and can be deployed/toggled on its own).
//
// Deploy:  supabase functions deploy send-follow-up-reminder --no-verify-jwt
// Secrets: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
import {
  FOLLOWUP_MSG,
  buildFollowUpNames,
  followUpDue,
  isWithinReminderWindow,
  initReminderEnv,
  sendPush,
  json,
} from '../_shared/reminders.ts';

Deno.serve(async () => {
  try {
    const init = initReminderEnv();
    if ('error' in init) return init.error;
    const { supabase } = init;

    const now = new Date();
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

    const { data: subs, error } = await supabase.from('push_subscriptions').select('*').eq('follow_up_enabled', true);
    if (error) return json({ error: error.message }, 500);

    let sent = 0;
    for (const sub of subs || []) {
      // No cadence anchor yet (row predates the client stamping one on
      // enable): start counting now instead of firing immediately, so the
      // first follow-up lands one full follow_up_days after enabling.
      if (!sub.last_follow_up_sent_at) {
        await supabase.from('push_subscriptions').update({ last_follow_up_sent_at: now.toISOString() }).eq('endpoint', sub.endpoint);
        continue;
      }
      // The follow-up has its own delivery time (default 07:00), independent
      // of the daily reminder's.
      if (!isWithinReminderWindow(sub, utcMinutes, sub.follow_up_time || '07:00')) continue;
      if (!followUpDue(sub.last_follow_up_sent_at, sub.follow_up_days, now)) continue;

      const { data: prayers } = await supabase
        .from('prayers')
        .select('person_name, for_other')
        .eq('user_id', sub.user_id)
        .eq('status', 'active');
      if (!prayers || prayers.length === 0) continue;

      const fm = FOLLOWUP_MSG[sub.lang] || FOLLOWUP_MSG.en;
      const names = buildFollowUpNames(prayers as any[], fm.self);
      const payload = JSON.stringify({
        title: fm.title,
        body: names ? fm.body.replace('{names}', names) : fm.body0,
        url: '/',
        tag: 'follow-up',
      });

      const result = await sendPush(sub, payload);
      if (result.gone) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      } else if (result.sent) {
        await supabase.from('push_subscriptions').update({ last_follow_up_sent_at: now.toISOString() }).eq('endpoint', sub.endpoint);
        sent++;
      }
    }

    return json({ sent });
  } catch (e) {
    // Any unexpected failure → readable message instead of a blank 500.
    return json({ error: 'unhandled', message: String((e as Error)?.message || e) }, 500);
  }
});
