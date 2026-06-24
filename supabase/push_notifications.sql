-- ════════════════════════════════════════════════════════════════════════
-- Push notifications: subscriptions table + scheduled reminder job
-- Run this in the Supabase SQL editor. Replace the two placeholders at the
-- bottom (<PROJECT_REF> and <SERVICE_ROLE_KEY>) before running the cron block.
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

-- 2. Scheduled job — runs every 15 minutes and invokes the send-reminders
--    Edge Function, which decides which subscriptions are due in their local
--    timezone. Requires the pg_cron and pg_net extensions.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any previous schedule with the same name, then (re)create it.
-- ⚠️  Replace <PROJECT_REF> and <SERVICE_ROLE_KEY> below before running.
select cron.unschedule('send-reminders')
  where exists (select 1 from cron.job where jobname = 'send-reminders');

select cron.schedule(
  'send-reminders',
  '*/15 * * * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body    := '{}'::jsonb
  );
  $$
);
