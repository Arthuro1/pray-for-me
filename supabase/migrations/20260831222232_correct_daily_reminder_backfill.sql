-- The idempotency-column backfill deliberately suppresses an immediate flood
-- for reminders whose local time already passed on deployment day. If a user
-- is just past local midnight and their reminder is still ahead, however, that
-- day must remain eligible.
with subscription_clock as (
  select
    id,
    now() + coalesce(tz_offset, 0) * interval '1 minute' as local_now
  from public.push_subscriptions
)
update public.push_subscriptions p
set last_daily_sent_on = null
from subscription_clock c
where c.id = p.id
  and p.enabled
  and p.last_daily_sent_on = c.local_now::date
  and p.reminder_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  and to_char(c.local_now, 'HH24:MI') < p.reminder_time;
