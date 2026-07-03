-- ════════════════════════════════════════════════════════════════════════
-- Follow-up reminders: a second, independently-scheduled push reminder that
-- encourages the user to reach out to the people (or themselves) they've
-- prayed for and log the answer on the prayer. Delivered by its own
-- send-follow-up-reminder Edge Function + cron, separate from the daily
-- reminder's — run this after supabase/push_notifications.sql, then deploy
-- send-follow-up-reminder.
-- ════════════════════════════════════════════════════════════════════════

alter table public.push_subscriptions
  add column if not exists follow_up_enabled boolean not null default false,
  add column if not exists follow_up_days int not null default 7,
  add column if not exists last_follow_up_sent_at timestamptz;

-- Scheduled job — runs every 15 minutes and invokes the send-follow-up-reminder
-- Edge Function. Requires the pg_cron and pg_net extensions (already enabled
-- by push_notifications.sql).
-- ⚠️  Replace <PROJECT_REF> and <SERVICE_ROLE_KEY> below before running.
select cron.unschedule('send-follow-up-reminder')
  where exists (select 1 from cron.job where jobname = 'send-follow-up-reminder');

select cron.schedule(
  'send-follow-up-reminder',
  '*/15 * * * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-follow-up-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body    := '{}'::jsonb
  );
  $$
);
