begin;
select plan(15);
insert into auth.users (id, email, aud, role) values
  ('e1111111-1111-4111-8111-111111111111', 'report-a@example.invalid', 'authenticated', 'authenticated'),
  ('e2222222-2222-4222-8222-222222222222', 'report-b@example.invalid', 'authenticated', 'authenticated');

select ok(not has_table_privilege('anon', 'public.feedback', 'INSERT'), 'signed-out callers cannot insert feedback');
set local request.jwt.claims = '{"role":"authenticated"}';
set local role authenticated;
select throws_ok(
  $$insert into public.feedback(user_id, message) values (null, 'missing subject synthetic')$$,
  '42501', 'new row violates row-level security policy "Feedback inserts belong to caller" for table "feedback"',
  'authenticated role without a user ID cannot insert even anonymous feedback'
);

set local request.jwt.claims = '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok(
  $$insert into public.feedback(id, user_id, type, message) values ('e3333333-3333-4333-8333-333333333333', 'e1111111-1111-4111-8111-111111111111', 'bug', '[AI output report] synthetic')$$,
  'owned AI report accepted'
);
select lives_ok(
  $$insert into public.feedback(id, user_id, name, email, message) values ('e4444444-4444-4444-8444-444444444444', null, null, null, 'anonymous synthetic')$$,
  'anonymous general feedback accepted'
);
select throws_ok($$insert into public.feedback(user_id, message) values ('e2222222-2222-4222-8222-222222222222', 'forged owner')$$, '42501', 'new row violates row-level security policy "Feedback inserts belong to caller" for table "feedback"', 'other account ownership rejected');
select throws_ok($$insert into public.feedback(user_id, name, email, message) values (null, 'Forged', 'forged@example.invalid', 'forged identity')$$, '42501', 'new row violates row-level security policy "Feedback inserts belong to caller" for table "feedback"', 'anonymous claimed identity rejected');
select is((select count(*) from public.feedback), 0::bigint, 'ordinary clients cannot read the report queue');
select results_eq(
  $$update public.feedback set message = 'tampered synthetic' where id = 'e3333333-3333-4333-8333-333333333333' returning id$$,
  array[]::uuid[],
  'ordinary clients cannot update their own submitted report'
);
select results_eq(
  $$delete from public.feedback where id = 'e3333333-3333-4333-8333-333333333333' returning id$$,
  array[]::uuid[],
  'ordinary clients cannot delete their own submitted report directly'
);

-- Verify the invisible row survived both mutation attempts before exercising
-- account deletion, which intentionally erases owned reports through its RPC.
reset role;
select ok(
  exists (
    select 1 from public.feedback
    where id = 'e3333333-3333-4333-8333-333333333333'
      and message = '[AI output report] synthetic'
  ),
  'rejected mutations leave the submitted report unchanged'
);

set local request.jwt.claims = '{"sub":"e2222222-2222-4222-8222-222222222222","role":"authenticated"}';
set local role authenticated;
select lives_ok(
  $$insert into public.feedback(id, user_id, type, message) values ('e5555555-5555-4555-8555-555555555555', 'e2222222-2222-4222-8222-222222222222', 'bug', '[AI output report] other account synthetic')$$,
  'another account can submit its own AI report'
);

set local request.jwt.claims = '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok('select public.delete_account()', 'report owner can delete their account');
reset role;
select ok(
  not exists (
    select 1 from public.feedback where id = 'e3333333-3333-4333-8333-333333333333'
  ),
  'account deletion erases the owned AI report rather than unlinking it'
);
select ok(
  exists (
    select 1 from public.feedback
    where id = 'e5555555-5555-4555-8555-555555555555'
      and user_id = 'e2222222-2222-4222-8222-222222222222'
      and message = '[AI output report] other account synthetic'
  ),
  'account deletion preserves the other account report and ownership'
);
select ok(
  exists (
    select 1 from public.feedback
    where id = 'e4444444-4444-4444-8444-444444444444'
      and user_id is null and name is null and email is null
      and message = 'anonymous synthetic'
  ),
  'account deletion preserves deliberately unlinked anonymous general feedback'
);
select * from finish();
rollback;
