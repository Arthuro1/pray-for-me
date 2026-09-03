-- Transactional pgTAP regression test for public.delete_account().
-- Run against the local test database; all fixtures are rolled back.
begin;
select plan(14);

insert into auth.users (id, email, aud, role)
values
  ('d1111111-1111-4111-8111-111111111111', 'delete-test-a@example.invalid', 'authenticated', 'authenticated'),
  ('d2222222-2222-4222-8222-222222222222', 'delete-test-b@example.invalid', 'authenticated', 'authenticated');

insert into public.groups (id, name, invite_code, created_by)
values
  ('d3333333-3333-4333-8333-333333333333', 'Deletion shared test', 'DELTESTSHARED', 'd1111111-1111-4111-8111-111111111111'),
  ('d4444444-4444-4444-8444-444444444444', 'Deletion empty test', 'DELTESTEMPTY', 'd1111111-1111-4111-8111-111111111111');

insert into public.group_members (group_id, user_id, role)
values
  ('d3333333-3333-4333-8333-333333333333', 'd1111111-1111-4111-8111-111111111111', 'admin'),
  ('d3333333-3333-4333-8333-333333333333', 'd2222222-2222-4222-8222-222222222222', 'member'),
  ('d4444444-4444-4444-8444-444444444444', 'd1111111-1111-4111-8111-111111111111', 'admin');

insert into public.group_key_versions (group_id, version, created_by)
values ('d3333333-3333-4333-8333-333333333333', 1, 'd1111111-1111-4111-8111-111111111111');

insert into public.community_prayers (id, group_id, user_id, author_name, title)
values
  ('d5555555-5555-4555-8555-555555555555', 'd3333333-3333-4333-8333-333333333333', 'd1111111-1111-4111-8111-111111111111', 'Delete me', 'ciphertext'),
  ('d6666666-6666-4666-8666-666666666666', 'd3333333-3333-4333-8333-333333333333', 'd2222222-2222-4222-8222-222222222222', 'Keep me', 'ciphertext');

insert into public.community_updates (id, community_prayer_id, user_id, author_name, text)
values ('d7777777-7777-4777-8777-777777777777', 'd6666666-6666-4666-8666-666666666666', 'd1111111-1111-4111-8111-111111111111', 'Delete me', 'ciphertext');

insert into public.testimonies (id, group_id, user_id, author_name, content)
values ('d8888888-8888-4888-8888-888888888888', 'd3333333-3333-4333-8333-333333333333', 'd1111111-1111-4111-8111-111111111111', 'Delete me', 'ciphertext');

insert into public.group_invitations (id, group_id, invited_user_id, invited_by)
values ('d9999999-9999-4999-8999-999999999999', 'd3333333-3333-4333-8333-333333333333', 'd2222222-2222-4222-8222-222222222222', 'd1111111-1111-4111-8111-111111111111');

insert into public.feedback (id, user_id, name, email, message)
values ('daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'd1111111-1111-4111-8111-111111111111', 'Delete me', 'delete@example.invalid', 'delete me');

insert into public.translations (user_id, lang, original_text, translated_text)
values
  ('d1111111-1111-4111-8111-111111111111', 'fr', 'Delete me', 'Supprimez-moi'),
  ('d2222222-2222-4222-8222-222222222222', 'fr', 'Keep me', 'Gardez-moi');

select ok(
  not has_function_privilege('anon', 'public.delete_account()', 'EXECUTE'),
  'anonymous callers cannot invoke account deletion'
);

set local request.jwt.claims = '{"role":"authenticated"}';
set local role authenticated;
select throws_ok(
  'select public.delete_account()', '42501', 'not authenticated',
  'account deletion requires an authenticated user ID'
);

set local request.jwt.claims = '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok('select public.delete_account()', 'the caller can delete their account');
reset role;

select ok(
  not exists (
    select 1 from auth.users where id = 'd1111111-1111-4111-8111-111111111111'
  ), 'the caller auth row should be deleted'
);

select ok(
  exists (
    select 1 from auth.users where id = 'd2222222-2222-4222-8222-222222222222'
  ), 'the other member account should survive'
);

select ok(
  exists (
    select 1 from public.groups
    where id = 'd3333333-3333-4333-8333-333333333333' and created_by is null
  ), 'a group with other members should survive with an anonymised creator'
);

select ok(
  not exists (
    select 1 from public.groups where id = 'd4444444-4444-4444-8444-444444444444'
  ), 'a group with no remaining members should be deleted'
);

select ok(
  not exists (
    select 1 from public.community_prayers where user_id = 'd1111111-1111-4111-8111-111111111111'
  ) and not exists (
    select 1 from public.community_updates where user_id = 'd1111111-1111-4111-8111-111111111111'
  ) and not exists (
    select 1 from public.testimonies where user_id = 'd1111111-1111-4111-8111-111111111111'
  ), 'authored community content should be erased'
);

select ok(
  exists (
    select 1 from public.community_prayers
    where id = 'd6666666-6666-4666-8666-666666666666'
      and user_id = 'd2222222-2222-4222-8222-222222222222'
  ), 'the other member community prayer should survive'
);

select ok(
  exists (
    select 1 from public.group_invitations
    where id = 'd9999999-9999-4999-8999-999999999999' and invited_by is null
  ), 'shared invitations should survive without identifying the deleted inviter'
);

select ok(
  exists (
    select 1 from public.group_key_versions
    where group_id = 'd3333333-3333-4333-8333-333333333333' and created_by is null
  ), 'group key history should survive without identifying the deleted creator'
);

select ok(
  not exists (
    select 1 from public.feedback where user_id = 'd1111111-1111-4111-8111-111111111111'
  ), 'feedback tied to the account should be erased'
);

select ok(
  not exists (
    select 1 from public.translations where user_id = 'd1111111-1111-4111-8111-111111111111'
  ), 'personal cached translations should be erased'
);

select ok(
  exists (
    select 1 from public.translations
    where user_id = 'd2222222-2222-4222-8222-222222222222' and translated_text = 'Gardez-moi'
  ), 'the other member cached translations should survive'
);

select * from finish();
rollback;
