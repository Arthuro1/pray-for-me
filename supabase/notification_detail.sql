-- ════════════════════════════════════════════════════════════════════════
-- Notification detail level (privacy).
--
-- Push notifications carry NO prayer content by default. `notification_detail`
-- is a per-account opt-in that the send-daily-reminder function reads:
--   'generic' (default) → "Time to pray." — no count, no titles, no names
--   'count'             → "You have N prayer subject(s) today." (number only)
--   'titles'            → reserved; currently treated exactly like 'count'
--                         (titles are NEVER placed in a payload — see notify.ts)
--
-- Stored on user_settings (account-level source of truth, mirrored to every
-- device row in push_subscriptions so the schedulers can read it per-send).
--
-- Run this in the Supabase SQL editor (safe to re-run), then redeploy:
--   supabase functions deploy send-daily-reminder --no-verify-jwt
-- ════════════════════════════════════════════════════════════════════════

alter table public.push_subscriptions
  add column if not exists notification_detail text not null default 'generic';

alter table public.user_settings
  add column if not exists notification_detail text not null default 'generic';
