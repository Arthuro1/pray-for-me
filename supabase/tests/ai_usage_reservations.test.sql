-- Content-free quota receipts: bounded reservations and exactly-once refunds.
begin;
select plan(29);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       email, 'x', now(), now(), now()
from (values
  ('a9111111-1111-4111-8111-111111111111'::uuid, 'ai-quota-owner@example.test'),
  ('a9222222-2222-4222-8222-222222222222'::uuid, 'ai-quota-other@example.test')
) as u(id, email)
on conflict (id) do nothing;

-- Tests run in a rolled-back transaction; isolate the global counter for today.
delete from public.ai_daily_usage
where usage_date in ((now() at time zone 'UTC')::date, (now() at time zone 'UTC')::date - 1);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.ai_usage_reservations'::regclass),
  'reservation receipts have row-level security'
);
select ok(
  not has_table_privilege('anon', 'public.ai_usage_reservations', 'SELECT,INSERT,UPDATE,DELETE')
  and not has_table_privilege('authenticated', 'public.ai_usage_reservations', 'SELECT,INSERT,UPDATE,DELETE'),
  'neither anonymous nor signed-in users can enumerate or mutate receipts'
);
select ok(
  has_function_privilege('authenticated', 'public.release_ai_usage_reservation(uuid)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.release_ai_usage_reservation(uuid)', 'EXECUTE'),
  'only signed-in users can invoke the self-scoped refund RPC'
);
select is(
  (select count(*)::integer from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('check_ai_usage_quota', 'release_ai_usage_reservation')
     and p.prosecdef and coalesce(p.proconfig, '{}'::text[]) && array['search_path=""']),
  2,
  'both quota RPCs pin an empty search path'
);

select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select throws_ok($$ select public.check_ai_usage_quota(1, 10) $$, '42501', null, 'a reservation requires an authenticated identity');
select throws_ok($$ select public.release_ai_usage_reservation(gen_random_uuid()) $$, '42501', null, 'a refund requires an authenticated identity');

select set_config('request.jwt.claims', '{"sub":"a9111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select throws_ok($$ select public.check_ai_usage_quota(null, 10) $$, '22023', null, 'null quota bounds cannot bypass limits');
select set_config('test.ai_quota', public.check_ai_usage_quota(1, 10)::text, true);
select ok((current_setting('test.ai_quota')::jsonb ->> 'allowed')::boolean, 'the first reservation is allowed');
select ok(
  (current_setting('test.ai_quota')::jsonb ->> 'reservation_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
  'an allowed reservation includes an opaque UUID receipt'
);
select is(public.check_ai_usage_quota(1, 10) ->> 'reason', 'user_daily', 'the user cap rejects the next request');
select ok(
  not (public.check_ai_usage_quota(1, 10) ? 'reservation_id'),
  'an exhausted quota never issues a refundable receipt'
);
select ok(not public.release_ai_usage_reservation(gen_random_uuid()), 'an unknown receipt refunds nothing');
select ok(not public.release_ai_usage_reservation(null), 'a null receipt refunds nothing');

select set_config('request.jwt.claims', '{"sub":"a9222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select ok(
  not public.release_ai_usage_reservation((current_setting('test.ai_quota')::jsonb ->> 'reservation_id')::uuid),
  'even knowing a receipt cannot refund another user'
);
reset role;
select is(
  (select request_count from public.ai_daily_usage where scope = 'user' and subject = 'a9111111-1111-4111-8111-111111111111'
   and usage_date = (now() at time zone 'UTC')::date),
  1,
  'denied and unauthorized calls leave the owner counter unchanged'
);
select is(
  (select request_count from public.ai_daily_usage where scope = 'global' and subject = '*'
   and usage_date = (now() at time zone 'UTC')::date),
  1,
  'denied and unauthorized calls leave the global counter unchanged'
);

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"a9111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select ok(
  public.release_ai_usage_reservation((current_setting('test.ai_quota')::jsonb ->> 'reservation_id')::uuid),
  'the owner can release a rejected request'
);
select ok(
  not public.release_ai_usage_reservation((current_setting('test.ai_quota')::jsonb ->> 'reservation_id')::uuid),
  'replaying a refund does not refund twice'
);
reset role;
select is(
  (select request_count from public.ai_daily_usage where scope = 'user' and subject = 'a9111111-1111-4111-8111-111111111111'
   and usage_date = (now() at time zone 'UTC')::date),
  0,
  'refund releases exactly one user reservation'
);
select is(
  (select request_count from public.ai_daily_usage where scope = 'global' and subject = '*'
   and usage_date = (now() at time zone 'UTC')::date),
  0,
  'refund releases exactly one global reservation'
);

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"a9111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select ok((public.check_ai_usage_quota(1, 10) ->> 'allowed')::boolean, 'refunding lets the owner retry within the original cap');
select set_config('request.jwt.claims', '{"sub":"a9222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select is(public.check_ai_usage_quota(10, 1) ->> 'reason', 'global_daily', 'the global cap still applies across users');
reset role;
select is((select count(*)::integer from public.ai_usage_reservations where user_id in (
  'a9111111-1111-4111-8111-111111111111', 'a9222222-2222-4222-8222-222222222222'
)), 2, 'only allowed requests create receipts');

-- A request can be rejected after midnight. Refund the day it reserved, not the
-- day the refund arrives; today's successful use must still count.
insert into public.ai_usage_reservations(id, user_id, usage_date)
values ('a9333333-3333-4333-8333-333333333333', 'a9111111-1111-4111-8111-111111111111', (now() at time zone 'UTC')::date - 1);
insert into public.ai_daily_usage(scope, subject, usage_date, request_count) values
  ('user', 'a9111111-1111-4111-8111-111111111111', (now() at time zone 'UTC')::date - 1, 1),
  ('global', '*', (now() at time zone 'UTC')::date - 1, 1);
select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"a9111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select ok(public.release_ai_usage_reservation('a9333333-3333-4333-8333-333333333333'), 'an earlier UTC day can be refunded');
reset role;
select is(
  (select sum(request_count)::integer from public.ai_daily_usage where usage_date = (now() at time zone 'UTC')::date - 1),
  0,
  'a late refund releases the original day user and global counters'
);
select is(
  (select sum(request_count)::integer from public.ai_daily_usage where usage_date = (now() at time zone 'UTC')::date),
  2,
  'a late refund leaves today user and global usage intact'
);
select ok(
  (select released_at is not null from public.ai_usage_reservations where id = 'a9333333-3333-4333-8333-333333333333'),
  'the receipt records that its one refund has been used'
);
select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"a9111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select is(public.check_ai_usage_quota(1, 10) ->> 'reason', 'user_daily', 'yesterday refund cannot bypass today user cap');
select ok(not public.release_ai_usage_reservation('a9333333-3333-4333-8333-333333333333'), 'replaying an earlier day refund is also a no-op');

select * from finish();
rollback;
