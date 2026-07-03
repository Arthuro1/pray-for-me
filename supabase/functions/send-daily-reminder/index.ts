// Supabase Edge Function: send-daily-reminder
// Invoked every ~15 min by its own pg_cron job. Finds subscriptions whose
// local time has just reached their reminder_time and sends a localized
// "you have N prayer subjects today" Web Push. Independent of, and runs
// alongside, send-follow-up-reminder (split so each reminder type has its
// own cron schedule and can be deployed/toggled on its own).
//
// Deploy:  supabase functions deploy send-daily-reminder --no-verify-jwt
// Secrets: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
import {
  MSG,
  buildTitleSuffix,
  prayerDueToday,
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

    const { data: subs, error } = await supabase.from('push_subscriptions').select('*').eq('enabled', true);
    if (error) return json({ error: error.message }, 500);

    let sent = 0;
    for (const sub of subs || []) {
      if (!isWithinReminderWindow(sub, utcMinutes)) continue;

      const localDow = new Date(now.getTime() + (sub.tz_offset || 0) * 60000).getUTCDay();
      const { data: prayers } = await supabase
        .from('prayers')
        .select('title, week_days, prayer_categories(category_id)')
        .eq('user_id', sub.user_id)
        .eq('status', 'active');
      const { data: cats } = await supabase.from('categories').select('id, week_days').eq('user_id', sub.user_id);
      const todayCatIds = new Set((cats || []).filter((c: any) => (c.week_days || []).includes(localDow)).map((c: any) => c.id));
      const duePrayers = (prayers || []).filter((p: any) => prayerDueToday(p, localDow, todayCatIds));

      const m = MSG[sub.lang] || MSG.en;
      const payload = JSON.stringify({
        title: m.title,
        body: duePrayers.length > 0
          ? m.body.replace('{count}', String(duePrayers.length)).replace('{titles}', buildTitleSuffix(duePrayers))
          : m.body0,
        url: '/',
        tag: 'daily-reminder',
      });

      const result = await sendPush(sub, payload);
      if (result.gone) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      } else if (result.sent) {
        sent++;
      }
    }

    return json({ sent });
  } catch (e) {
    // Any unexpected failure → readable message instead of a blank 500.
    return json({ error: 'unhandled', message: String((e as Error)?.message || e) }, 500);
  }
});
