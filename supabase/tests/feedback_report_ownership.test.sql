begin;
select plan(6);
insert into auth.users (id, email, aud, role) values
  ('e1111111-1111-4111-8111-111111111111', 'report-a@example.invalid', 'authenticated', 'authenticated'),
  ('e2222222-2222-4222-8222-222222222222', 'report-b@example.invalid', 'authenticated', 'authenticated');

select ok(not has_table_privilege('anon', 'public.feedback', 'INSERT'), 'signed-out callers cannot insert feedback');
set local request.jwt.claims = '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated"}';
set local role authenticated;
select lives_ok($$insert into public.feedback(user_id, type, message) values ('e1111111-1111-4111-8111-111111111111', 'bug', '[AI output report] synthetic')$$, 'owned AI report accepted');
select lives_ok($$insert into public.feedback(user_id, name, email, message) values (null, null, null, 'anonymous synthetic')$$, 'anonymous general feedback accepted');
select throws_ok($$insert into public.feedback(user_id, message) values ('e2222222-2222-4222-8222-222222222222', 'forged owner')$$, '42501', 'new row violates row-level security policy for table "feedback"', 'other account ownership rejected');
select throws_ok($$insert into public.feedback(user_id, name, email, message) values (null, 'Forged', 'forged@example.invalid', 'forged identity')$$, '42501', 'new row violates row-level security policy for table "feedback"', 'anonymous claimed identity rejected');
select is((select count(*) from public.feedback), 0::bigint, 'ordinary clients cannot read the report queue');
reset role;
select * from finish();
rollback;
