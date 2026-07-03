-- ════════════════════════════════════════════════════════════════════════
-- Upgrade: splits the old combined `send-reminders` Edge Function/cron into
-- two independently-scheduled ones — `send-daily-reminder` and
-- `send-follow-up-reminder`. Run this once against a project that already
-- executed the earlier versions of push_notifications.sql / follow_up_
-- reminders.sql (i.e. already has a `send-reminders` cron job).
--
-- After running this:
--   1. Deploy the two new functions:
--        npx supabase functions deploy send-daily-reminder --no-verify-jwt
--        npx supabase functions deploy send-follow-up-reminder --no-verify-jwt
--   2. Delete the old one so it can't run against a stale deployment:
--        npx supabase functions delete send-reminders
--
-- ⚠️  Replace <PROJECT_REF> and <SERVICE_ROLE_KEY> below before running.
-- ════════════════════════════════════════════════════════════════════════

select cron.unschedule('send-reminders')
  where exists (select 1 from cron.job where jobname = 'send-reminders');

select cron.unschedule('send-daily-reminder')
  where exists (select 1 from cron.job where jobname = 'send-daily-reminder');

select cron.schedule(
  'send-daily-reminder',
  '*/15 * * * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-daily-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

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
