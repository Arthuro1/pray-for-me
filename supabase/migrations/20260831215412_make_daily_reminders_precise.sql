-- Track one successful daily delivery per subscription and local calendar day.
-- This makes a one-minute scheduler safe (no duplicate pushes) and lets a
-- transient failure retry on the next minute instead of losing the reminder.
alter table public.push_subscriptions
  add column if not exists last_daily_sent_on date;

-- Avoid a one-off flood when this is first deployed: existing enabled devices
-- begin fresh on their next local calendar day.
update public.push_subscriptions
set last_daily_sent_on = (now() + coalesce(tz_offset, 0) * interval '1 minute')::date
where enabled
  and last_daily_sent_on is null;

-- The old */15 cadence made a 22:40 reminder arrive at 22:45 (and could be
-- almost fifteen minutes late). Poll every minute; the Edge Function performs
-- per-local-day idempotency via last_daily_sent_on.
select cron.unschedule('send-daily-reminder')
where exists (select 1 from cron.job where jobname = 'send-daily-reminder');

select cron.schedule(
  'send-daily-reminder',
  '* * * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/send-daily-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'notify_fn_secret')
    ),
    body    := '{}'::jsonb
  );
  $$
);
