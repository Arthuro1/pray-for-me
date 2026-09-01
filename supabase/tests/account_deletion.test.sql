-- Transactional regression test for public.delete_account(). All fixtures and
-- deletions are rolled back, so this is safe against a linked test/production
-- database when run by an administrator.
begin;

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

set local request.jwt.claims = '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}';
set local role authenticated;
select public.delete_account();
reset role;

do $$
begin
  assert not exists (
    select 1 from auth.users where id = 'd1111111-1111-4111-8111-111111111111'
  ), 'the caller auth row should be deleted';

  assert exists (
    select 1 from public.groups
    where id = 'd3333333-3333-4333-8333-333333333333' and created_by is null
  ), 'a group with other members should survive with an anonymised creator';

  assert not exists (
    select 1 from public.groups where id = 'd4444444-4444-4444-8444-444444444444'
  ), 'a group with no remaining members should be deleted';

  assert not exists (
    select 1 from public.community_prayers where user_id = 'd1111111-1111-4111-8111-111111111111'
  ) and not exists (
    select 1 from public.community_updates where user_id = 'd1111111-1111-4111-8111-111111111111'
  ) and not exists (
    select 1 from public.testimonies where user_id = 'd1111111-1111-4111-8111-111111111111'
  ), 'authored community content should be erased';

  assert exists (
    select 1 from public.group_invitations
    where id = 'd9999999-9999-4999-8999-999999999999' and invited_by is null
  ), 'shared invitations should survive without identifying the deleted inviter';

  assert exists (
    select 1 from public.group_key_versions
    where group_id = 'd3333333-3333-4333-8333-333333333333' and created_by is null
  ), 'group key history should survive without identifying the deleted creator';

  assert not exists (
    select 1 from public.feedback where user_id = 'd1111111-1111-4111-8111-111111111111'
  ), 'feedback tied to the account should be erased';
end;
$$;

rollback;
