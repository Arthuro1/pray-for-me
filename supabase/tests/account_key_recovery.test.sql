-- Recovery authorization, atomic challenge/proof lifecycle and compatibility.
-- Run with `supabase test db` against a local, migrated Supabase database.
begin;
select plan(39);

select ok(not exists (
  select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in ('account_key_recovery_methods', 'account_recovery_credentials',
    'account_recovery_challenges', 'account_recovery_rate_limits') and not c.relrowsecurity
), 'all recovery tables have RLS');
select ok(not has_table_privilege('anon', 'public.account_key_recovery_methods', 'SELECT'), 'anonymous cannot read wrappers');
select ok(not has_table_privilege('authenticated', 'public.account_key_recovery_methods', 'INSERT,UPDATE,DELETE'), 'clients cannot mutate recovery records');
select ok(not has_table_privilege('authenticated', 'public.account_recovery_credentials', 'SELECT,INSERT,UPDATE,DELETE'), 'credential verifier state is server only');
select ok(not has_table_privilege('authenticated', 'public.account_recovery_challenges', 'SELECT,INSERT,UPDATE,DELETE'), 'challenge and proof state is server only');
select ok(not has_table_privilege('authenticated', 'public.account_recovery_rate_limits', 'SELECT,INSERT,UPDATE,DELETE'), 'durable rate limits are server only');
select ok(not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('check_recovery_rate_limit', 'create_recovery_method',
    'create_recovery_challenge', 'consume_recovery_challenge', 'register_recovery_credential',
    'complete_recovery_assertion', 'commit_recovery_method', 'read_recovery_method', 'verify_recovery_method', 'revoke_recovery_method')
  and (has_function_privilege('anon', p.oid, 'EXECUTE') or has_function_privilege('authenticated', p.oid, 'EXECUTE'))
), 'only the authenticated backend can call recovery mutation RPCs');
select ok(has_function_privilege('authenticated', 'public.compare_and_swap_vault_record(jsonb,jsonb)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.compare_and_swap_vault_record(jsonb,jsonb)', 'EXECUTE'), 'vault CAS is authenticated only');

insert into auth.users(id, email, aud, role) values
  ('e1111111-1111-4111-8111-111111111111', 'recovery-a@example.invalid', 'authenticated', 'authenticated'),
  ('e2222222-2222-4222-8222-222222222222', 'recovery-b@example.invalid', 'authenticated', 'authenticated');
insert into public.account_key_recovery_methods(id, user_id, method_type, wrapper, revision) values
  ('e3333333-3333-4333-8333-333333333333', 'e1111111-1111-4111-8111-111111111111', 'emergency-code', '{"ciphertext":"test-only"}', 1),
  ('e4444444-4444-4444-8444-444444444444', 'e2222222-2222-4222-8222-222222222222', 'emergency-code', '{"ciphertext":"other-account"}', 1);

set local request.jwt.claims = '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated"}';
set local role authenticated;
select is((select count(*)::integer from public.account_key_recovery_methods), 1, 'owner sees only their own wrapper');
select is((select count(*)::integer from public.account_key_recovery_methods where id = 'e4444444-4444-4444-8444-444444444444'), 0, 'foreign method ID reveals no wrapper');
select throws_ok($$select public.create_recovery_method('e2222222-2222-4222-8222-222222222222', gen_random_uuid(), 'passkey', null, '')$$,
  '42501', null, 'authenticated clients cannot impersonate the backend to create a foreign method');
select ok(public.compare_and_swap_vault_record(null, '{"revision":1,"synthetic":true}'), 'CAS creates only owner legacy wrapper');
select ok(not public.compare_and_swap_vault_record(null, '{"revision":2}'), 'CAS does not overwrite a concurrently created row');
select ok(not public.compare_and_swap_vault_record('{"revision":0}', '{"revision":2}'), 'stale expected legacy record is rejected');
select ok(public.compare_and_swap_vault_record('{"revision":1,"synthetic":true}', '{"revision":2,"synthetic":true}'), 'exact-record CAS replaces the matching record');
set local request.jwt.claims = '{"sub":"e2222222-2222-4222-8222-222222222222","role":"authenticated"}';
select ok(not public.compare_and_swap_vault_record('{"revision":2,"synthetic":true}', '{"revision":99}'), 'second account cannot CAS the first account record');
reset role;

select throws_ok($$select public.verify_recovery_method('e1111111-1111-4111-8111-111111111111', 'e3333333-3333-4333-8333-333333333333', 1, null)$$,
  '40001', 'recovery readback required', 'emergency write acknowledgement cannot activate without independent readback');
select lives_ok($$select public.read_recovery_method('e1111111-1111-4111-8111-111111111111', 'e3333333-3333-4333-8333-333333333333')$$, 'owner reads staged emergency wrapper independently');
select lives_ok($$select public.verify_recovery_method('e1111111-1111-4111-8111-111111111111', 'e3333333-3333-4333-8333-333333333333', 1, null)$$, 'client-reported emergency verification activates readback revision');
select is((select revision from public.account_key_recovery_methods where id = 'e3333333-3333-4333-8333-333333333333'), 2, 'activation increments method revision atomically');
select throws_ok($$select public.revoke_recovery_method('e1111111-1111-4111-8111-111111111111', 'e3333333-3333-4333-8333-333333333333', 1)$$,
  '40001', 'recovery revision conflict', 'stale revocation cannot overwrite a concurrent activation');
select lives_ok($$select public.revoke_recovery_method('e1111111-1111-4111-8111-111111111111', 'e3333333-3333-4333-8333-333333333333', 2)$$, 'current revision revokes the method');
select throws_ok($$select public.read_recovery_method('e1111111-1111-4111-8111-111111111111', 'e3333333-3333-4333-8333-333333333333')$$,
  'P0002', 'recovery method unavailable', 'revoked recovery wrapper is unavailable');

-- Server-verified registration fixture: no private keys or PRF secrets.
select public.create_recovery_method('e1111111-1111-4111-8111-111111111111', 'e9999999-9999-4999-8999-999999999999', 'passkey', null, 'Cancelled registration');
select lives_ok($$select public.read_recovery_method('e1111111-1111-4111-8111-111111111111', 'e9999999-9999-4999-8999-999999999999')$$,
  'pending registration without a wrapper remains readable for removal');
select ok((select wrapper is null and readback_at is null and readback_revision is null from public.account_key_recovery_methods where id = 'e9999999-9999-4999-8999-999999999999'),
  'metadata-only read never records an encrypted-wrapper readback proof');
select lives_ok($$select public.revoke_recovery_method('e1111111-1111-4111-8111-111111111111', 'e9999999-9999-4999-8999-999999999999', 0)$$,
  'cancelled registration can be revoked without consuming recovery slots forever');
select public.create_recovery_method('e1111111-1111-4111-8111-111111111111', 'e5555555-5555-4555-8555-555555555555', 'passkey', null, 'Synthetic passkey');
insert into public.account_recovery_challenges(id, user_id, method_id, operation, challenge, origin, rp_id, expected_revision) values
  ('e6666666-6666-4666-8666-666666666666', 'e1111111-1111-4111-8111-111111111111', 'e5555555-5555-4555-8555-555555555555', 'register', repeat('a',43), 'https://qetoret.com', 'qetoret.com', 0);
select ok((public.consume_recovery_challenge('e2222222-2222-4222-8222-222222222222', 'e6666666-6666-4666-8666-666666666666', 'e5555555-5555-4555-8555-555555555555', 'register')).id is null, 'foreign account cannot consume challenge');
select ok((public.consume_recovery_challenge('e1111111-1111-4111-8111-111111111111', 'e6666666-6666-4666-8666-666666666666', 'e5555555-5555-4555-8555-555555555555', 'register')).id is not null, 'correct owner consumes challenge');
select ok((public.consume_recovery_challenge('e1111111-1111-4111-8111-111111111111', 'e6666666-6666-4666-8666-666666666666', 'e5555555-5555-4555-8555-555555555555', 'register')).id is null, 'challenge cannot be consumed twice');
select public.register_recovery_credential('e1111111-1111-4111-8111-111111111111', 'e5555555-5555-4555-8555-555555555555', 'e6666666-6666-4666-8666-666666666666',
  'synthetic-credential', 'synthetic-public-key', 0, array['internal'], 'multiDevice', true, 'qetoret.com');
select throws_ok($$select public.commit_recovery_method('e1111111-1111-4111-8111-111111111111', 'e5555555-5555-4555-8555-555555555555', 0, 'e6666666-6666-4666-8666-666666666666', '{"ciphertext":"synthetic"}')$$,
  '40001', 'invalid recovery proof', 'registration proof alone cannot publish an encrypted wrapper');
insert into public.account_recovery_challenges(id, user_id, method_id, operation, challenge, origin, rp_id, expected_revision, credential_id, consumed_at) values
  ('e7777777-7777-4777-8777-777777777777', 'e1111111-1111-4111-8111-111111111111', 'e5555555-5555-4555-8555-555555555555', 'enroll', repeat('b',43), 'https://qetoret.com', 'qetoret.com', 0, 'synthetic-credential', now());
select lives_ok($$select public.complete_recovery_assertion('e1111111-1111-4111-8111-111111111111', 'e5555555-5555-4555-8555-555555555555', 'e7777777-7777-4777-8777-777777777777', 0, 0, 0)$$,
  'zero-counter authenticators use a credential revision CAS');
select throws_ok($$select public.complete_recovery_assertion('e1111111-1111-4111-8111-111111111111', 'e5555555-5555-4555-8555-555555555555', 'e7777777-7777-4777-8777-777777777777', 0, 0, 0)$$,
  '40001', 'recovery counter conflict', 'parallel zero-counter completion cannot reuse a credential revision');
select lives_ok($$select public.commit_recovery_method('e1111111-1111-4111-8111-111111111111', 'e5555555-5555-4555-8555-555555555555', 0, 'e7777777-7777-4777-8777-777777777777', '{"ciphertext":"synthetic"}')$$,
  'verified enrollment assertion publishes a pending wrapper');
select is((select status from public.account_key_recovery_methods where id = 'e5555555-5555-4555-8555-555555555555'), 'pending', 'publishing never claims recoverability before independent assertion');
select throws_ok($$select public.verify_recovery_method('e1111111-1111-4111-8111-111111111111', 'e5555555-5555-4555-8555-555555555555', 1, 'e7777777-7777-4777-8777-777777777777')$$,
  '40001', 'invalid recovery proof', 'enrollment proof cannot activate staged wrapper');

insert into public.account_recovery_challenges(id, user_id, method_id, operation, challenge, origin, rp_id, expected_revision, credential_id, expires_at) values
  ('e8888888-8888-4888-8888-888888888888', 'e1111111-1111-4111-8111-111111111111', 'e5555555-5555-4555-8555-555555555555', 'verify', repeat('c',43), 'https://qetoret.com', 'qetoret.com', 1, 'synthetic-credential', now() - interval '1 second');
select ok((public.consume_recovery_challenge('e1111111-1111-4111-8111-111111111111', 'e8888888-8888-4888-8888-888888888888', 'e5555555-5555-4555-8555-555555555555', 'assert')).id is null, 'expired assertion challenge cannot be consumed');
select is((select count(*)::integer from generate_series(1,30) n where public.check_recovery_rate_limit('e1111111-1111-4111-8111-111111111111')), 30, 'durable rate limiter allows bounded initial requests');
select ok(not public.check_recovery_rate_limit('e1111111-1111-4111-8111-111111111111'), 'durable limiter blocks the next request across instances');

delete from auth.users where id = 'e1111111-1111-4111-8111-111111111111';
select ok(not exists(select 1 from public.account_key_recovery_methods where user_id = 'e1111111-1111-4111-8111-111111111111')
  and not exists(select 1 from public.account_recovery_credentials where user_id = 'e1111111-1111-4111-8111-111111111111')
  and not exists(select 1 from public.account_recovery_challenges where user_id = 'e1111111-1111-4111-8111-111111111111')
  and not exists(select 1 from public.account_recovery_rate_limits where user_id = 'e1111111-1111-4111-8111-111111111111'), 'account deletion cascades all recovery records and verifier state');

select * from finish();
rollback;
