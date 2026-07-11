-- ════════════════════════════════════════════════════════════════════════
-- Push notifications: subscriptions table + scheduled reminder job
-- Run this in the Supabase SQL editor. Prerequisite for the cron block at the
-- bottom: run supabase/_cron_secrets.sql once (stores project_url +
-- notify_fn_secret in Vault; the cron reads them at run time).
-- ════════════════════════════════════════════════════════════════════════

-- 1. Web Push subscriptions (one row per device/browser). reminder_time, lang
--    and tz_offset are the source of truth the scheduler reads (settings are
--    otherwise localStorage-only on the client).
create table if not exists public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  endpoint      text not null unique,
  p256dh        text not null,
  auth          text not null,
  reminder_time text not null default '07:00',   -- local "HH:MM"
  tz_offset     int  not null default 0,         -- minutes to add to UTC for local time
  lang          text not null default 'en',
  enabled       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);
create index if not exists push_subscriptions_enabled_idx on public.push_subscriptions(enabled) where enabled;

alter table public.push_subscriptions enable row level security;

-- Users manage only their own subscriptions. The Edge Function uses the
-- service-role key, which bypasses RLS, so it can read every row.
drop policy if exists "own push subs" on public.push_subscriptions;
create policy "own push subs" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Scheduled job — runs every 15 minutes and invokes the send-daily-reminder
--    Edge Function, which decides which subscriptions are due in their local
--    timezone. Requires the pg_cron and pg_net extensions. The follow-up
--    reminder has its own, independently-scheduled function/cron — see
--    supabase/follow_up_reminders.sql.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any previous schedule with the same name, then (re)create it.
-- ⚠️  Prerequisite: run supabase/_cron_secrets.sql once (stores project_url +
--     notify_fn_secret in Vault). The cron body below reads them at run time —
--     no placeholders to substitute here.
select cron.unschedule('send-daily-reminder')
  where exists (select 1 from cron.job where jobname = 'send-daily-reminder');

select cron.schedule(
  'send-daily-reminder',
  '*/15 * * * *',
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
