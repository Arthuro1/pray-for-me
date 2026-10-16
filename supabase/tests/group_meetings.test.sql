-- Group prayer meetings, exercised as the people who use them.
--
--   admin     — administers the group
--   host      — a plain member who schedules the meeting
--   member    — another plain member
--   stranger  — in no group
--
-- What must hold: members read their group's meetings and nobody else does;
-- any member may schedule one; only its scheduler or an admin may change or end
-- it; nothing but ciphertext and timing is ever stored; reminders fan out once
-- per member per occurrence and only the server may queue them.
begin;
select plan(19);

-- ── Fixtures ────────────────────────────────────────────────────────────────
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       who || '@example.test', 'x', now(), now(), now()
from (values
  ('11111111-1111-4111-8111-111111111111'::uuid, 'admin'),
  ('33333333-3333-4333-8333-333333333333'::uuid, 'host'),
  ('66666666-6666-4666-8666-666666666666'::uuid, 'member'),
  ('44444444-4444-4444-8444-444444444444'::uuid, 'stranger')
) as u(id, who)
on conflict (id) do nothing;

insert into public.groups (id, name, invite_code, created_by)
values ('99999999-9999-4999-8999-999999999999', 'Groupe du mardi', 'MTG123', '11111111-1111-4111-8111-111111111111');

insert into public.group_members (group_id, user_id, role) values
  ('99999999-9999-4999-8999-999999999999', '11111111-1111-4111-8111-111111111111', 'admin'),
  ('99999999-9999-4999-8999-999999999999', '33333333-3333-4333-8333-333333333333', 'member'),
  ('99999999-9999-4999-8999-999999999999', '66666666-6666-4666-8666-666666666666', 'member');

-- ── The surface ─────────────────────────────────────────────────────────────
select ok(
  not has_table_privilege('anon', 'public.group_meetings', 'SELECT,INSERT,UPDATE,DELETE'),
  'anon cannot touch meetings'
);
select ok(
  not has_column_privilege('authenticated', 'public.group_meetings', 'group_id', 'UPDATE')
  and not has_column_privilege('authenticated', 'public.group_meetings', 'created_by', 'UPDATE')
  and has_column_privilege('authenticated', 'public.group_meetings', 'schedule', 'UPDATE'),
  'a meeting can be moved, never re-homed or re-authored'
);
select ok(
  not has_function_privilege('authenticated', 'public.queue_group_meeting_reminder(uuid,date,timestamptz)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.queue_group_meeting_reminder(uuid,date,timestamptz)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.queue_group_meeting_reminder(uuid,date,timestamptz)', 'EXECUTE'),
  'only the server queues reminders'
);

-- ── A member schedules a meeting for the group ──────────────────────────────
select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);

select lives_ok($$
  insert into public.group_meetings
    (id, group_id, created_by, schedule, start_time, timezone, duration_minutes, encrypted_payload, encryption_version, key_version)
  values (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '99999999-9999-4999-8999-999999999999', '33333333-3333-4333-8333-333333333333',
    '{"type":"recurring","freq":"weekly","weekDays":[2],"startDate":"2026-10-20"}', '20:00', 'Europe/Paris', 60,
    '{"v":2,"iv":"aXY=","ct":"Y3Q="}', 2, 1
  )
$$, 'a member schedules a weekly meeting');

select throws_ok($$
  insert into public.group_meetings
    (id, group_id, created_by, schedule, start_time, timezone, encrypted_payload, encryption_version, key_version)
  values (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '99999999-9999-4999-8999-999999999999', '33333333-3333-4333-8333-333333333333',
    '{"type":"once","date":"2026-11-01"}', '19:30', 'Europe/Paris',
    '{"link":"https://zoom.us/j/123"}', 2, 1
  )
$$, '23514', null, 'a call link in the clear is refused');

select throws_ok($$
  insert into public.group_meetings
    (id, group_id, created_by, schedule, start_time, timezone, encrypted_payload, encryption_version, key_version)
  values (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc', '99999999-9999-4999-8999-999999999999', '33333333-3333-4333-8333-333333333333',
    '{"type":"once","date":"2026-11-01"}', '19:30', 'Mars/Olympus',
    '{"v":2,"iv":"aXY=","ct":"Y3Q="}', 2, 1
  )
$$, '22023', null, 'an unknown timezone is refused');

select throws_ok($$
  insert into public.group_meetings
    (id, group_id, created_by, schedule, start_time, timezone, encrypted_payload, encryption_version, key_version)
  values (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd', '99999999-9999-4999-8999-999999999999', '33333333-3333-4333-8333-333333333333',
    '{"type":"recurring","freq":"hourly","startDate":"2026-10-20"}', '19:30', 'Europe/Paris',
    '{"v":2,"iv":"aXY=","ct":"Y3Q="}', 2, 1
  )
$$, '23514', null, 'a rhythm the engine does not know is refused');

-- ── Who sees it ─────────────────────────────────────────────────────────────
select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated"}', true);
select is((select count(*)::integer from public.group_meetings), 1, 'another member sees the meeting');

select is(
  (with moved as (update public.group_meetings set start_time = '06:00' returning 1) select count(*)::integer from moved),
  0, 'a member who did not schedule it cannot move it'
);
select is(
  (with ended as (delete from public.group_meetings returning 1) select count(*)::integer from ended),
  0, 'nor end it'
);

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
select is((select count(*)::integer from public.group_meetings), 0, 'a stranger sees nothing');
select throws_ok($$
  insert into public.group_meetings
    (id, group_id, created_by, schedule, start_time, timezone, encrypted_payload, encryption_version, key_version)
  values (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '99999999-9999-4999-8999-999999999999', '44444444-4444-4444-8444-444444444444',
    '{"type":"once","date":"2026-11-01"}', '19:30', 'Europe/Paris',
    '{"v":2,"iv":"aXY=","ct":"Y3Q="}', 2, 1
  )
$$, '42501', null, 'and cannot schedule one for a group they are not in');

-- ── The scheduler moves it; nobody re-homes it ──────────────────────────────
select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select is(
  (with moved as (update public.group_meetings set start_time = '20:30' returning 1) select count(*)::integer from moved),
  1, 'the scheduler moves the meeting'
);
select throws_ok(
  $$ update public.group_meetings set group_id = gen_random_uuid() $$,
  '42501', null, 'but cannot move it to another group'
);

-- ── Reminders ───────────────────────────────────────────────────────────────
select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
delete from public.notifications where type = 'prayer_meeting';

select is(
  public.queue_group_meeting_reminder('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2026-10-20', '2026-10-20 18:30+00'),
  3, 'each of the three members is considered'
);
select is(
  (select count(*)::integer from public.notifications
    where type = 'prayer_meeting' and entity_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  3, 'one reminder per member'
);
select public.queue_group_meeting_reminder('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2026-10-20', '2026-10-20 18:30+00');
select is(
  (select count(*)::integer from public.notifications
    where type = 'prayer_meeting' and entity_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  3, 'asking again for the same occurrence adds nothing'
);
select is(
  (select metadata - 'starts_at' from public.notifications
    where type = 'prayer_meeting' and recipient_id = '66666666-6666-4666-8666-666666666666'),
  '{"group_id":"99999999-9999-4999-8999-999999999999","meeting_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}'::jsonb,
  'a reminder carries identifiers and the start time, nothing else'
);

-- ── An admin may end what a member scheduled ────────────────────────────────
select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select is(
  (with ended as (delete from public.group_meetings returning 1) select count(*)::integer from ended),
  1, 'a group admin ends the meeting'
);

select * from finish();
rollback;
