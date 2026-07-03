-- ════════════════════════════════════════════════════════════════════════
-- Account-level user settings — one row per user.
-- Run this in the Supabase SQL editor (safe to re-run; upgrades in place).
--
-- Language, appearance, AI consent and reminder preferences used to live only
-- in each browser's localStorage (plus a per-device push_subscriptions row),
-- so every browser drifted independently: different language, different
-- daily-verse language, different theme, different reminder toggles/times.
-- This table is the account-wide source of truth the client syncs on load and
-- on every settings change.
--
-- The notification-permission flag stays device-local (it is a per-device
-- browser fact, not a preference). The vault master key is NOT here either —
-- it syncs separately as a passphrase-wrapped blob in vault_keys
-- (supabase/e2ee_migration.sql), preserving zero-knowledge.
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.user_settings (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  language               text,
  theme                  text,                               -- 'light' | 'dark'
  daily_reminder_enabled boolean not null default false,
  daily_reminder_time    text    not null default '07:00',   -- local "HH:MM"
  follow_up_enabled      boolean not null default false,
  follow_up_days         int     not null default 7,
  follow_up_time         text    not null default '07:00',   -- local "HH:MM"
  ai_consent_prayer      boolean not null default false,     -- AI on prayer title + last update
  ai_consent_home        boolean not null default false,     -- AI on today's category names
  updated_at             timestamptz not null default now()
);

-- Upgrade path for projects that ran the first version of this file
-- (language + reminder prefs only).
alter table public.user_settings add column if not exists theme text;
alter table public.user_settings add column if not exists ai_consent_prayer boolean not null default false;
alter table public.user_settings add column if not exists ai_consent_home boolean not null default false;
alter table public.user_settings add column if not exists follow_up_time text not null default '07:00';

alter table public.user_settings enable row level security;

drop policy if exists "own settings" on public.user_settings;
create policy "own settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
