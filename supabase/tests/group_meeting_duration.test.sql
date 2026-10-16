-- A group prayer meeting's length: from a short gathering to a night of prayer
-- (15 minutes to 12 hours), the same bounds the meeting form enforces.
begin;
select plan(4);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values ('77777777-7777-4777-8777-777777777777', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'vigil@example.test', 'x', now(), now(), now())
on conflict (id) do nothing;

insert into public.groups (id, name, invite_code, created_by)
values ('88888888-8888-4888-8888-888888888888', 'Nuit de prière', 'VIGIL1', '77777777-7777-4777-8777-777777777777');

select lives_ok($$
  insert into public.group_meetings
    (id, group_id, created_by, schedule, start_time, timezone, duration_minutes, encrypted_payload, encryption_version, key_version)
  values (
    'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', '88888888-8888-4888-8888-888888888888', '77777777-7777-4777-8777-777777777777',
    '{"type":"once","date":"2026-12-31"}', '21:00', 'Africa/Douala', 480,
    '{"v":2,"iv":"aXY=","ct":"Y3Q="}', 2, 1
  )
$$, 'a night of prayer, 21:00 to 05:00, is kept');

select lives_ok($$
  insert into public.group_meetings
    (id, group_id, created_by, schedule, start_time, timezone, duration_minutes, encrypted_payload, encryption_version, key_version)
  values (
    'a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2', '88888888-8888-4888-8888-888888888888', '77777777-7777-4777-8777-777777777777',
    '{"type":"once","date":"2027-01-01"}', '18:00', 'Africa/Douala', 720,
    '{"v":2,"iv":"aXY=","ct":"Y3Q="}', 2, 1
  )
$$, 'twelve hours is the longest');

select throws_ok($$
  insert into public.group_meetings
    (id, group_id, created_by, schedule, start_time, timezone, duration_minutes, encrypted_payload, encryption_version, key_version)
  values (
    'a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3', '88888888-8888-4888-8888-888888888888', '77777777-7777-4777-8777-777777777777',
    '{"type":"once","date":"2027-01-02"}', '18:00', 'Africa/Douala', 721,
    '{"v":2,"iv":"aXY=","ct":"Y3Q="}', 2, 1
  )
$$, '23514', null, 'longer than twelve hours is refused');

select throws_ok($$
  insert into public.group_meetings
    (id, group_id, created_by, schedule, start_time, timezone, duration_minutes, encrypted_payload, encryption_version, key_version)
  values (
    'a4a4a4a4-a4a4-4a4a-8a4a-a4a4a4a4a4a4', '88888888-8888-4888-8888-888888888888', '77777777-7777-4777-8777-777777777777',
    '{"type":"once","date":"2027-01-03"}', '18:00', 'Africa/Douala', 14,
    '{"v":2,"iv":"aXY=","ct":"Y3Q="}', 2, 1
  )
$$, '23514', null, 'shorter than fifteen minutes is refused');

select * from finish();
rollback;
