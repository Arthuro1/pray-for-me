-- ════════════════════════════════════════════════════════════════════════
-- Follow-up reminder time + cadence anchor.
--
-- 1) The follow-up push gets its own delivery time (default 07:00) instead
--    of riding on the daily reminder's reminder_time.
-- 2) Cadence semantics change alongside: a row with no last_follow_up_sent_at
--    is no longer sent immediately — the client stamps the anchor when the
--    user enables follow-ups (and the scheduler stamps legacy rows on first
--    sight), so the first follow-up arrives one full follow_up_days later
--    and the "next reminder" shown in Settings tracks the chosen frequency.
--
-- Run this in the Supabase SQL editor (safe to re-run), then redeploy:
--   supabase functions deploy send-follow-up-reminder --no-verify-jwt
-- ════════════════════════════════════════════════════════════════════════

alter table public.push_subscriptions
  add column if not exists follow_up_time text not null default '07:00';  -- local "HH:MM"

alter table public.user_settings
  add column if not exists follow_up_time text not null default '07:00';  -- local "HH:MM"
