-- Avatar authorization, exercised rather than inspected.
--
-- security_schema.test.sql asserts that the right policies and predicates
-- EXIST. This file acts as four different signed-in people against real rows
-- and checks what each of them is actually allowed to see and change — which is
-- the only way to know the rule holds and not merely that it was written down.
--
--   me        — owns a profile photo and administers a group
--   friend    — an accepted friendship with `me`, in no group with them
--   mate      — no friendship, but a member of the same group
--   stranger  — no relationship of any kind
--   invitee   — invited to the group, not yet a member
begin;
select plan(20);


-- ── Fixtures ────────────────────────────────────────────────────────────────
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       who || '@example.test', 'x', now(), now(), now()
from (values
  ('11111111-1111-4111-8111-111111111111'::uuid, 'me'),
  ('22222222-2222-4222-8222-222222222222'::uuid, 'friend'),
  ('33333333-3333-4333-8333-333333333333'::uuid, 'mate'),
  ('44444444-4444-4444-8444-444444444444'::uuid, 'stranger'),
  ('55555555-5555-4555-8555-555555555555'::uuid, 'invitee')
) as u(id, who)
on conflict (id) do nothing;

-- The signup trigger may already have written these.
insert into public.profiles (id, full_name) values
  ('11111111-1111-4111-8111-111111111111', 'Me'),
  ('22222222-2222-4222-8222-222222222222', 'Friend'),
  ('33333333-3333-4333-8333-333333333333', 'Mate'),
  ('44444444-4444-4444-8444-444444444444', 'Stranger'),
  ('55555555-5555-4555-8555-555555555555', 'Invitee')
on conflict (id) do nothing;

insert into public.friendships (user_id, friend_id)
values ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');

insert into public.groups (id, name, invite_code, created_by)
values ('99999999-9999-4999-8999-999999999999', 'Famille', 'ABC123', '11111111-1111-4111-8111-111111111111');

insert into public.group_members (group_id, user_id, role) values
  ('99999999-9999-4999-8999-999999999999', '11111111-1111-4111-8111-111111111111', 'admin'),
  ('99999999-9999-4999-8999-999999999999', '33333333-3333-4333-8333-333333333333', 'member');

insert into public.group_invitations (group_id, invited_user_id, invited_by)
values ('99999999-9999-4999-8999-999999999999', '55555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111');

-- ── Who may see a profile photo ─────────────────────────────────────────────
select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select ok(public.can_view_profile_avatar('11111111-1111-4111-8111-111111111111'), 'a person can see their own avatar');

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select ok(public.can_view_profile_avatar('11111111-1111-4111-8111-111111111111'), 'an accepted friend can see it');

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select ok(public.can_view_profile_avatar('11111111-1111-4111-8111-111111111111'), 'a member of a shared group can see it');

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
select ok(not public.can_view_profile_avatar('11111111-1111-4111-8111-111111111111'), 'a stranger cannot');
select ok(not public.can_view_profile_avatar(null), 'and neither can a malformed request');

-- ── Who may change a group photo ────────────────────────────────────────────
select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select ok(public.can_edit_group_avatar('99999999-9999-4999-8999-999999999999'), 'an admin may change the group photo');

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select ok(not public.can_edit_group_avatar('99999999-9999-4999-8999-999999999999'), 'an ordinary member may not');
select ok(public.can_view_group_avatar('99999999-9999-4999-8999-999999999999'), 'but may see it');

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}', true);
select ok(public.can_view_group_avatar('99999999-9999-4999-8999-999999999999'), 'a pending invitee sees the group it was invited to');
select ok(not public.can_edit_group_avatar('99999999-9999-4999-8999-999999999999'), 'but cannot change it');

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
select ok(not public.can_view_group_avatar('99999999-9999-4999-8999-999999999999'), 'a non-member cannot see a private group photo');
select ok(not public.can_edit_group_avatar('99999999-9999-4999-8999-999999999999'), 'nor change it');

-- ── The storage objects themselves ──────────────────────────────────────────
select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
insert into storage.objects (bucket_id, name, owner_id)
values ('avatars', 'profiles/11111111-1111-4111-8111-111111111111/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp', '11111111-1111-4111-8111-111111111111'),
       ('avatars', 'groups/99999999-9999-4999-8999-999999999999/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.webp', '11111111-1111-4111-8111-111111111111');

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select is(
  (select count(*) from storage.objects where bucket_id = 'avatars' and name like 'profiles/%')::int,
  1,
  'a friend can reach the object well enough to have a URL signed'
);

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
select is(
  (select count(*) from storage.objects where bucket_id = 'avatars')::int,
  0,
  'a stranger cannot enumerate a single avatar object, profile or group'
);

-- A stranger writing into someone else's folder is refused by the policy, not
-- merely hidden by the UI.
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('avatars', 'profiles/11111111-1111-4111-8111-111111111111/cccccccccccccccccccccccccccccccc.webp',
            '44444444-4444-4444-8444-444444444444')$$,
  '42501',
  null,
  'nobody can upload into another person''s avatar folder'
);

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('avatars', 'groups/99999999-9999-4999-8999-999999999999/dddddddddddddddddddddddddddddddd.webp',
            '33333333-3333-4333-8333-333333333333')$$,
  '42501',
  null,
  'an ordinary member cannot replace the group photo'
);

select is(
  (select count(*) from storage.objects
   where bucket_id = 'avatars'
     and name = 'groups/99999999-9999-4999-8999-999999999999/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.webp')::int,
  1,
  'though that member can still see the group photo they are allowed to see'
);

-- ── A folder cannot grow without bound ──────────────────────────────────────
-- Normal use leaves one object per folder; the ceiling only ever stops a client
-- uploading avatars it never references.
select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
insert into storage.objects (bucket_id, name, owner_id)
select 'avatars',
       'profiles/22222222-2222-4222-8222-222222222222/' || lpad(to_hex(g), 32, '0') || '.webp',
       '22222222-2222-4222-8222-222222222222'
from generate_series(1, 20) g;

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('avatars', 'profiles/22222222-2222-4222-8222-222222222222/ffffffffffffffffffffffffffffffff.webp',
            '22222222-2222-4222-8222-222222222222')$$,
  '42501',
  null,
  'a full avatar folder refuses one more object'
);

-- ── The row cannot borrow somebody else's picture ───────────────────────────
select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
select throws_ok(
  $$update public.profiles
       set avatar_type = 'photo',
           avatar_photo_path = 'profiles/22222222-2222-4222-8222-222222222222/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp'
     where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514',
  null,
  'a profile cannot point its avatar at another user''s object, even from inside the database'
);

select lives_ok(
  $$update public.profiles
       set avatar_type = 'photo',
           avatar_photo_path = 'profiles/11111111-1111-4111-8111-111111111111/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp'
     where id = '11111111-1111-4111-8111-111111111111'$$,
  'but it can point at its own'
);

select * from finish();
rollback;
