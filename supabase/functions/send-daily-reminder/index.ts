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
  isWithinReminderWindow,
  initReminderEnv,
  sendPush,
  json,
} from '../_shared/reminders.ts';
import { dailyPayload, normalizeDetail } from '../_shared/notify.ts';
import { prayersForDay } from '../_shared/planner.ts';

const pad = (n: number) => String(n).padStart(2, '0');
// Local calendar day key ("YYYY-MM-DD") for a subscription — the same key the
// app's planner uses, so scheduled/recurring prayers are counted identically.
function localDayKey(now: Date, tzOffsetMin: number): string {
  const d = new Date(now.getTime() + tzOffsetMin * 60000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

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

      // Only a due-prayer COUNT is ever computed — never titles or any prayer
      // content — and it is used only when the account opted into the 'count'
      // detail level. The default 'generic' payload ignores it entirely.
      const detail = normalizeDetail(sub.notification_detail);
      let count = 0;
      if (detail !== 'generic') {
        const todayKey = localDayKey(now, sub.tz_offset || 0);
        const { data: prayers } = await supabase
          .from('prayers')
          .select('id, status, created_at, week_days, schedule, schedule_overrides, prayer_categories(category_id)')
          .eq('user_id', sub.user_id)
          .eq('status', 'active');
        const { data: cats } = await supabase.from('categories').select('id, week_days, rotation').eq('user_id', sub.user_id);
        count = prayersForDay((prayers as any[]) || [], (cats as any[]) || [], todayKey).length;
      }

      const payload = dailyPayload(sub.lang, detail, count);

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
