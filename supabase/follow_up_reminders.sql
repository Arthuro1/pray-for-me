-- ════════════════════════════════════════════════════════════════════════
-- Follow-up reminders: a second, independently-scheduled push reminder that
-- encourages the user to reach out to the people (or themselves) they've
-- prayed for and log the answer on the prayer. Delivered by the same
-- send-reminders Edge Function/cron as the daily reminder — run this after
-- supabase/push_notifications.sql, then redeploy send-reminders.
-- ════════════════════════════════════════════════════════════════════════

alter table public.push_subscriptions
  add column if not exists follow_up_enabled boolean not null default false,
  add column if not exists follow_up_days int not null default 7,
  add column if not exists last_follow_up_sent_at timestamptz;
