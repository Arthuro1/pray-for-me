-- Transactional regression test for the database-side activation guard. The
-- computed offset pins the synthetic device's local clock to 12:00 regardless
-- of when/where this test runs.
begin;

insert into auth.users (id, email, aud, role)
values ('e1111111-1111-4111-8111-111111111111', 'reminder-test@example.invalid', 'authenticated', 'authenticated');

insert into public.push_subscriptions (
  id, user_id, endpoint, p256dh, auth, reminder_time, tz_offset, enabled
)
values
  (
    'e2222222-2222-4222-8222-222222222222',
    'e1111111-1111-4111-8111-111111111111',
    'https://push.invalid/past', 'key', 'auth', '11:59',
    720 - (extract(hour from now() at time zone 'UTC')::int * 60
           + extract(minute from now() at time zone 'UTC')::int),
    true
  ),
  (
    'e3333333-3333-4333-8333-333333333333',
    'e1111111-1111-4111-8111-111111111111',
    'https://push.invalid/future', 'key', 'auth', '12:01',
    720 - (extract(hour from now() at time zone 'UTC')::int * 60
           + extract(minute from now() at time zone 'UTC')::int),
    true
  );

do $$
begin
  assert exists (
    select 1 from public.push_subscriptions
    where id = 'e2222222-2222-4222-8222-222222222222'
      and last_daily_sent_on = (now() at time zone 'UTC')::date
  ), 'enabling at a past local time should start tomorrow';

  assert exists (
    select 1 from public.push_subscriptions
    where id = 'e3333333-3333-4333-8333-333333333333'
      and last_daily_sent_on is null
  ), 'enabling before a future local time should remain eligible today';
end;
$$;

rollback;
