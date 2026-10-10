-- Enforce "past time means tomorrow" in the database as well as the client.
-- This keeps older deployed clients compatible with the retryable scheduler:
-- a brand-new/re-enabled subscription with 07:00 selected at 18:00 must not be
-- treated as a missed 07:00 delivery and pushed immediately.
create or replace function public.prepare_daily_reminder_activation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_activation_change boolean := tg_op = 'INSERT';
  v_local_now timestamp := (now() at time zone 'UTC')
    + coalesce(new.tz_offset, 0) * interval '1 minute';
begin
  if tg_op = 'UPDATE' then
    v_activation_change :=
      (not coalesce(old.enabled, false) and new.enabled)
      or new.reminder_time is distinct from old.reminder_time;
  end if;

  if new.enabled
     and v_activation_change
     and new.reminder_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
     and to_char(v_local_now, 'HH24:MI') >= new.reminder_time
     and new.last_daily_sent_on is distinct from v_local_now::date
  then
    new.last_daily_sent_on := v_local_now::date;
  end if;

  return new;
end;
$$;

drop trigger if exists prepare_daily_reminder_activation on public.push_subscriptions;
create trigger prepare_daily_reminder_activation
before insert or update of enabled, reminder_time on public.push_subscriptions
for each row execute function public.prepare_daily_reminder_activation();

revoke all on function public.prepare_daily_reminder_activation() from public, anon, authenticated;
