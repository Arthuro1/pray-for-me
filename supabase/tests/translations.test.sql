-- Exercise the personal cache through the same role and upsert key as the app.
begin;
select plan(13);

insert into auth.users (id, email, aud, role)
values
  ('f1111111-1111-4111-8111-111111111111', 'translation-owner@example.invalid', 'authenticated', 'authenticated'),
  ('f2222222-2222-4222-8222-222222222222', 'translation-other@example.invalid', 'authenticated', 'authenticated');

insert into public.translations (user_id, lang, original_text, translated_text)
values ('f2222222-2222-4222-8222-222222222222', 'fr', 'Private', 'Prive');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.translations'::regclass),
  'the personal translation cache has RLS enabled'
);
select ok(
  not has_table_privilege('anon', 'public.translations', 'SELECT,INSERT,UPDATE,DELETE'),
  'anonymous callers cannot access personal translations'
);

set local request.jwt.claims = '{"sub":"f1111111-1111-4111-8111-111111111111","role":"authenticated"}';
set local role authenticated;

select lives_ok($sql$
  insert into public.translations (user_id, lang, original_text, translated_text)
  values ('f1111111-1111-4111-8111-111111111111', 'fr', 'Hello', 'Bonjour')
  on conflict (user_id, lang, original_text) do nothing
$sql$, 'the app can cache a translation for the caller');

select lives_ok($sql$
  insert into public.translations (user_id, lang, original_text, translated_text)
  values ('f1111111-1111-4111-8111-111111111111', 'fr', 'Hello', 'Duplicate')
  on conflict (user_id, lang, original_text) do nothing
$sql$, 'the app can ignore an already-cached translation');

select results_eq(
  'select translated_text from public.translations', array['Bonjour'],
  'the caller sees only their own cache, with no duplicate'
);

select throws_ok($sql$
  insert into public.translations (user_id, lang, original_text, translated_text)
  values ('f2222222-2222-4222-8222-222222222222', 'fr', 'Injected', 'Injected')
$sql$, '42501', null, 'the caller cannot insert a translation for another user');

select throws_ok($sql$
  update public.translations
  set user_id = 'f2222222-2222-4222-8222-222222222222'
  where original_text = 'Hello'
$sql$, '42501', null, 'the caller cannot transfer a translation to another user');

select is_empty($sql$
  update public.translations set translated_text = 'Changed'
  where user_id = 'f2222222-2222-4222-8222-222222222222'
  returning translated_text
$sql$, 'the caller cannot update another user cache');

select is_empty($sql$
  delete from public.translations
  where user_id = 'f2222222-2222-4222-8222-222222222222'
  returning translated_text
$sql$, 'the caller cannot delete another user cache');

select results_eq($sql$
  update public.translations set translated_text = 'Bonsoir'
  where original_text = 'Hello'
  returning translated_text
$sql$, array['Bonsoir'], 'the caller can update their own translation');

select results_eq($sql$
  delete from public.translations where original_text = 'Hello'
  returning translated_text
$sql$, array['Bonsoir'], 'the caller can delete their own translation');

reset role;
select results_eq(
  $$select translated_text from public.translations
    where user_id = 'f2222222-2222-4222-8222-222222222222'$$,
  array['Prive'], 'the other user cache remains unchanged'
);

delete from auth.users where id = 'f2222222-2222-4222-8222-222222222222';
select is_empty(
  $$select 1 from public.translations where user_id = 'f2222222-2222-4222-8222-222222222222'$$,
  'removing an auth user cascades to their cached translations'
);

select * from finish();
rollback;
