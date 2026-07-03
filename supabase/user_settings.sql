-- ════════════════════════════════════════════════════════════════════════
-- Account-level user settings — one row per user.
-- Run this in the Supabase SQL editor.
--
-- Language and reminder preferences used to live only in each browser's
-- localStorage (plus a per-device push_subscriptions row), so every browser
-- drifted independently: different language, different daily-verse language,
-- different reminder toggles/times. This table is the account-wide source of
-- truth the client syncs on load and on every settings change.
--
-- Theme and the notification-permission flag stay device-local on purpose
-- (dark mode is a per-device choice; permission is a per-device fact).
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.user_settings (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  language               text,
  daily_reminder_enabled boolean not null default false,
  daily_reminder_time    text    not null default '07:00',  -- local "HH:MM"
  follow_up_enabled      boolean not null default false,
  follow_up_days         int     not null default 7,
  updated_at             timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "own settings" on public.user_settings;
create policy "own settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
