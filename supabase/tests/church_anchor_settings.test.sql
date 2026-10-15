-- The encrypted church anchor and the Sunday opt-in on user_settings, exercised
-- as the account that owns the row and as another signed-in account.
begin;
select plan(7);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       email, 'x', now(), now(), now()
from (values
  ('c1111111-1111-4111-8111-111111111111'::uuid, 'owner@example.test'),
  ('c2222222-2222-4222-8222-222222222222'::uuid, 'other@example.test')
) as u(id, email)
on conflict (id) do nothing;

select has_column('public', 'user_settings', 'private_payload', 'user_settings has private_payload');
select col_default_is('public', 'user_settings', 'sunday_prep_enabled', 'false', 'Sunday preparation is off by default');

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', '{"sub":"c1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select lives_ok(
  $$ insert into public.user_settings (user_id, private_payload, sunday_prep_enabled)
     values ('c1111111-1111-4111-8111-111111111111', '{"v":2,"iv":"aaaa","ct":"bbbb"}', true) $$,
  'the owner can store an encrypted payload and opt in'
);

select is(
  (select sunday_prep_enabled from public.user_settings where user_id = 'c1111111-1111-4111-8111-111111111111'),
  true,
  'the owner reads back the opt-in'
);

select set_config('request.jwt.claims', '{"sub":"c2222222-2222-4222-8222-222222222222","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.user_settings where user_id = 'c1111111-1111-4111-8111-111111111111'),
  0,
  'another account cannot see the row'
);

select throws_ok(
  $$ insert into public.user_settings (user_id, private_payload)
     values ('c1111111-1111-4111-8111-111111111111', '{"v":2,"iv":"x","ct":"y"}')
     on conflict (user_id) do update set private_payload = excluded.private_payload $$,
  '42501',
  null,
  'another account cannot overwrite the encrypted payload'
);

select set_config('request.jwt.claims', '{"sub":"c1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select is(
  (select private_payload->>'ct' from public.user_settings where user_id = 'c1111111-1111-4111-8111-111111111111'),
  'bbbb',
  'the payload is unchanged'
);

select * from finish();
rollback;
