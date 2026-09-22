-- Plan share links, exercised as the people who actually use them.
--
--   sharer    — "Arthur Meteng", shares a plan
--   friend    — accepted friend of the sharer, joins through the link
--   stranger  — no relationship, joins through the link
--   blocked   — blocked by the sharer
--   fallback  — signed up without a name, so full_name is the email local part
begin;
select plan(25);

-- ── Fixtures ────────────────────────────────────────────────────────────────
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       email, 'x', now(), now(), now()
from (values
  ('a1111111-1111-4111-8111-111111111111'::uuid, 'arthur@example.test'),
  ('a2222222-2222-4222-8222-222222222222'::uuid, 'friend@example.test'),
  ('a3333333-3333-4333-8333-333333333333'::uuid, 'stranger@example.test'),
  ('a4444444-4444-4444-8444-444444444444'::uuid, 'blocked@example.test'),
  ('a5555555-5555-4555-8555-555555555555'::uuid, 'jdoe1984@example.test')
) as u(id, email)
on conflict (id) do nothing;

-- The signup trigger may already have written these; pin the names under test.
insert into public.profiles (id, full_name) values
  ('a1111111-1111-4111-8111-111111111111', 'Arthur Meteng'),
  ('a2222222-2222-4222-8222-222222222222', 'Marie Curie'),
  ('a3333333-3333-4333-8333-333333333333', 'Paul Stranger'),
  ('a4444444-4444-4444-8444-444444444444', 'Blocked Person'),
  ('a5555555-5555-4555-8555-555555555555', 'jdoe1984')
on conflict (id) do update set full_name = excluded.full_name;

insert into public.friendships (user_id, friend_id)
values ('a1111111-1111-4111-8111-111111111111', 'a2222222-2222-4222-8222-222222222222');

insert into public.user_blocks (blocker_id, blocked_id)
values ('a1111111-1111-4111-8111-111111111111', 'a4444444-4444-4444-8444-444444444444');

-- Tokens are carried between the role switches below in transaction-local
-- settings, which every role can read.

-- ── Direct table access is closed ───────────────────────────────────────────
select ok(
  not has_table_privilege('anon', 'public.plan_share_links', 'SELECT,INSERT,UPDATE,DELETE')
  and not has_table_privilege('authenticated', 'public.plan_share_links', 'SELECT,INSERT,UPDATE,DELETE')
  and not has_table_privilege('authenticated', 'public.plan_share_joins', 'SELECT,INSERT,UPDATE,DELETE'),
  'share links and joins are RPC-only'
);
select ok(
  has_function_privilege('anon', 'public.resolve_plan_share_link(text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.create_plan_share_link(text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.record_plan_share_join(text,text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.plan_share_status(text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.plan_share_first_name(uuid)', 'EXECUTE'),
  'only the lookup is reachable without an account; the helpers by nobody'
);

-- ── The sharer mints one stable link ────────────────────────────────────────
select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select set_config('test.token', public.create_plan_share_link('altar7'), true);
select set_config('test.second', public.create_plan_share_link('altar7'), true);

select ok(current_setting('test.token') ~ '^[A-Za-z0-9_-]{22}$', 'a link token is 22 URL-safe characters');
select is(current_setting('test.second'), current_setting('test.token'), 'asking again returns the same link');
select throws_ok($$ select public.create_plan_share_link('bad id!') $$, '22023', null, 'a malformed plan id is refused');
select is((select active_token from public.plan_share_status('altar7')), current_setting('test.token'), 'status reports the live link');
select is((select join_count from public.plan_share_status('altar7')), 0, 'nobody has joined yet');

-- ── An anonymous visitor sees the plan and a first name only ────────────────
select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
select is((select plan_id from public.resolve_plan_share_link(current_setting('test.token'))), 'altar7', 'the link names its plan');
select is((select inviter_first_name from public.resolve_plan_share_link(current_setting('test.token'))), 'Arthur', 'and the sharer by first name only');
select ok((select inviter_id is null from public.resolve_plan_share_link(current_setting('test.token'))), 'never the sharer''s account id');
select is((select count(*)::integer from public.resolve_plan_share_link('nope-nope-nope-nope-00')), 0, 'an unknown token resolves to nothing');

-- ── Signed-in visitors join ─────────────────────────────────────────────────
select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"a2222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select is((select inviter_id from public.resolve_plan_share_link(current_setting('test.token'))), 'a1111111-1111-4111-8111-111111111111'::uuid,
          'a signed-in visitor gets the id to send a friend request');
select ok(public.record_plan_share_join(current_setting('test.token'), 'altar7'), 'the friend''s join is recorded');
select ok(not public.record_plan_share_join(current_setting('test.token'), 'altar7'), 'joining twice is a no-op');
select ok(not public.record_plan_share_join(current_setting('test.token'), 'fast3'), 'a token only counts for its own plan');

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"a3333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select ok(public.record_plan_share_join(current_setting('test.token'), 'altar7'), 'a stranger''s join is recorded too');

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"a4444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
select ok((select inviter_first_name is null and inviter_id is null and not active
           from public.resolve_plan_share_link(current_setting('test.token'))), 'a blocked visitor sees the plan without the sharer');
select ok(not public.record_plan_share_join(current_setting('test.token'), 'altar7'), 'and is not counted');

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select ok(not public.record_plan_share_join(current_setting('test.token'), 'altar7'), 'the sharer never counts as their own join');
select is((select join_count from public.plan_share_status('altar7')), 2, 'the sharer sees two joins');
select is((select friend_names from public.plan_share_status('altar7')), array['Marie Curie'], 'and only the friend by name');

-- ── Stop sharing ────────────────────────────────────────────────────────────
select public.stop_plan_share_link('altar7');
select ok((select active_token is null and stopped from public.plan_share_status('altar7')), 'a stopped link is reported as stopped');

select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
select ok((select plan_id = 'altar7' and inviter_first_name is null and not active
           from public.resolve_plan_share_link(current_setting('test.token'))), 'the old link still shows the plan, without the name');

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select set_config('test.rotated', public.create_plan_share_link('altar7'), true);
select ok(current_setting('test.rotated') is distinct from current_setting('test.token'), 'sharing again mints a new token, never the stopped one');

-- ── A name that is only the email local part is never shown ─────────────────
select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"a5555555-5555-4555-8555-555555555555","role":"authenticated"}', true);
select set_config('test.second', public.create_plan_share_link('fast3'), true);
select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
select ok((select inviter_first_name is null and active from public.resolve_plan_share_link(current_setting('test.second'))),
          'a signup-fallback name stays private');

select * from finish();
rollback;
