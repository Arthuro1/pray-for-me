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
-- ⚠️  Prerequisite: run supabase/_cron_secrets.sql once (stores project_url +
--     notify_fn_secret in Vault). The cron bodies read them at run time.
-- ════════════════════════════════════════════════════════════════════════

select cron.unschedule('send-reminders')
  where exists (select 1 from cron.job where jobname = 'send-reminders');

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

select cron.unschedule('send-follow-up-reminder')
  where exists (select 1 from cron.job where jobname = 'send-follow-up-reminder');

select cron.schedule(
  'send-follow-up-reminder',
  '*/15 * * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/send-follow-up-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'notify_fn_secret')
    ),
    body    := '{}'::jsonb
  );
  $$
);
