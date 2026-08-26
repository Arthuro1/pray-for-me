begin;
select plan(33);

select ok(
  not exists (
    select 1
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
  ),
  'every public application table has RLS enabled'
);

select ok(
  not has_table_privilege('anon', 'public.group_key_versions', 'SELECT,INSERT,UPDATE,DELETE')
  and not has_table_privilege('anon', 'public.group_member_keys', 'SELECT,INSERT,UPDATE,DELETE')
  and not has_table_privilege('anon', 'public.ai_daily_usage', 'SELECT,INSERT,UPDATE,DELETE'),
  'anonymous users have no key or quota table privileges'
);

select ok(
  not has_table_privilege('authenticated', 'public.group_key_versions', 'INSERT,UPDATE,DELETE')
  and not has_table_privilege('authenticated', 'public.group_member_keys', 'INSERT,UPDATE,DELETE'),
  'group key mutations are RPC-only'
);

select ok(
  has_function_privilege('authenticated', 'public.create_group_key_version(uuid,integer,jsonb,uuid)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.distribute_group_key(uuid,integer,uuid,jsonb)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.remove_group_member_and_rotate(uuid,uuid,integer,jsonb,uuid)', 'EXECUTE'),
  'authenticated members can invoke transactional key RPCs'
);

select ok(
  not has_function_privilege('anon', 'public.create_group_key_version(uuid,integer,jsonb,uuid)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.check_ai_usage_quota(integer,integer)', 'EXECUTE'),
  'anonymous users cannot invoke protected RPCs'
);

select ok(
  exists (
    select 1 from pg_constraint
    where conname = 'group_member_keys_version_fk'
      and contype = 'f'
  ),
  'wrapped group keys reference an existing group key version'
);

select ok(
  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'check_ai_usage_quota' and p.prosecdef
  ),
  'daily AI quota reservation is a security-definer RPC'
);

select ok(
  not has_table_privilege('authenticated', 'public.ai_daily_usage', 'SELECT,INSERT,UPDATE,DELETE'),
  'AI quota counters are not directly accessible'
);

select ok(
  not exists (
    select 1 from public.group_key_versions v
    where not exists (
      select 1 from public.group_member_keys k
      where k.group_id = v.group_id and k.key_version = v.version
    )
  ),
  'clean schema starts without orphaned group key versions'
);

select ok(
  not exists (
    select 1
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and not exists (
        select 1 from unnest(coalesce(p.proconfig, '{}'::text[])) setting
        where setting like 'search_path=%'
      )
  ),
  'security-definer functions pin their search path'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Authenticated can read profiles'
      and roles = array['authenticated']::name[]
  ),
  'profile display names are readable only through the authenticated role policy'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can update their own profile'
      and qual like '%auth.uid()%id%'
      and with_check like '%auth.uid()%id%'
  ),
  'profile updates preserve ownership in USING and WITH CHECK'
);

select ok(
  exists (
    select 1
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'check_ai_usage_quota'
      and coalesce(p.proconfig, '{}'::text[]) && array['search_path=""']
  ),
  'daily AI quota RPC uses an empty search path'
);

select ok(
  exists (
    select 1
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'public_keys'
      and c.relkind = 'v'
      and coalesce(c.reloptions, '{}'::text[]) @> array['security_invoker=true']
  ),
  'public key view applies the querying user privileges and RLS'
);

select ok(
  has_table_privilege('authenticated', 'public.user_public_keys', 'SELECT')
  and not has_table_privilege('anon', 'public.user_public_keys', 'SELECT,INSERT,UPDATE,DELETE')
  and not has_table_privilege('authenticated', 'public.user_public_keys', 'INSERT,UPDATE,DELETE'),
  'published public keys are authenticated-read-only'
);

select ok(
  exists (
    select 1
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'default_delivery_mode'
      and coalesce(p.proconfig, '{}'::text[]) && array['search_path=""']
  ),
  'notification default helper uses an empty search path'
);

-- ── Avatars ─────────────────────────────────────────────────────────────────

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'avatar_type', 'SELECT')
  and not has_column_privilege('authenticated', 'public.profiles', 'avatar_value', 'SELECT')
  and not has_column_privilege('authenticated', 'public.profiles', 'avatar_color', 'SELECT'),
  'profile avatars are not selectable straight off the profiles table'
);

select ok(
  has_column_privilege('authenticated', 'public.profiles', 'id', 'SELECT')
  and has_column_privilege('authenticated', 'public.profiles', 'full_name', 'SELECT'),
  'display names stay readable so a friend request can name its sender'
);

select ok(
  has_function_privilege('authenticated', 'public.get_profile_avatars(uuid[])', 'EXECUTE')
  and not has_function_privilege('anon', 'public.get_profile_avatars(uuid[])', 'EXECUTE'),
  'profile avatars are reachable only by signed-in users, through the RPC'
);

select ok(
  exists (
    select 1
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'get_profile_avatars'
      and p.prosecdef
      and coalesce(p.proconfig, '{}'::text[]) && array['search_path=""']
  ),
  'the avatar visibility function is definer-rights with a pinned search path'
);

-- ── Avatar photos ───────────────────────────────────────────────────────────

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'avatar_photo_path', 'SELECT'),
  'an uploaded profile photo is no more enumerable than the preset it replaces'
);

select ok(
  exists (
    select 1 from pg_get_function_result(
      (select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = 'get_profile_avatars')
    ) as result
    where result like '%avatar_photo_path%'
  ),
  'the avatar RPC hands out the photo key alongside the preset'
);

select ok(
  exists (
    select 1 from storage.buckets
    where id = 'avatars'
      and public = false
      and file_size_limit is not null and file_size_limit <= 524288
      and allowed_mime_types @> array['image/webp', 'image/jpeg']
      and not (allowed_mime_types @> array['image/svg+xml'])
  ),
  'avatars live in a private bucket with a size and format floor under the client'
);

select ok(
  (select count(*) from pg_policies
   where schemaname = 'storage' and tablename = 'objects' and policyname like 'avatars\_%') = 6,
  'the avatars bucket carries exactly the six policies it needs'
);

select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname like 'avatars\_%' and cmd = 'UPDATE'
  ),
  'an avatar object is never overwritten in place, so a replacement can keep the old one'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'avatars_profile_insert_own'
      and cmd = 'INSERT' and roles = array['authenticated']::name[]
      and with_check like '%auth.uid()%'
  )
  and exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'avatars_profile_delete_own'
      and cmd = 'DELETE' and qual like '%auth.uid()%'
  ),
  'only a user may write or delete their own profile photo'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'avatars_profile_select_related'
      and cmd = 'SELECT' and qual like '%can_view_profile_avatar%'
  ),
  'reading a profile photo asks the same relationship question as reading its preset'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'avatars_group_insert_admin'
      and cmd = 'INSERT' and with_check like '%can_edit_group_avatar%'
  )
  and exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'avatars_group_delete_admin'
      and cmd = 'DELETE' and qual like '%can_edit_group_avatar%'
  )
  and exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'avatars_group_select_member'
      and cmd = 'SELECT' and qual like '%can_view_group_avatar%'
  ),
  'group photos are admin-written and member-read, enforced in the database'
);

select ok(
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('can_view_profile_avatar', 'can_view_group_avatar', 'can_edit_group_avatar')
     and p.prosecdef
     and coalesce(p.proconfig, '{}'::text[]) && array['search_path=""']) = 3,
  'every avatar authorization predicate is definer-rights with a pinned search path'
);

select ok(
  not has_function_privilege('anon', 'public.can_view_profile_avatar(uuid)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.can_view_group_avatar(uuid)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.can_edit_group_avatar(uuid)', 'EXECUTE'),
  'an anonymous caller cannot probe avatar visibility'
);

-- The constraint that makes it impossible for a row to claim someone else's
-- picture: the stored key must name an object inside this row's own folder.
select ok(
  (select count(*) from pg_constraint c join pg_class t on t.oid = c.conrelid
   where t.relname in ('profiles', 'groups')
     and c.conname like '%_avatar_preset_check'
     and pg_get_constraintdef(c.oid) like '%avatar_photo_path%'
     and pg_get_constraintdef(c.oid) like '%(id)::text%') = 2,
  'a stored photo key is pinned to the profile or group that owns it'
);

select ok(
  (select count(*) from pg_trigger
   where not tgisinternal
     and tgname in ('profiles_avatar_cleanup', 'groups_avatar_cleanup')) = 2,
  'deleting a profile or a group takes its avatar objects with it'
);

select ok(
  (select count(*) from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and policyname in ('avatars_profile_insert_own', 'avatars_group_insert_admin')
     and with_check like '%avatar_folder_under_quota%') = 2,
  'a signed-in client cannot write unbounded objects into an avatar folder'
);

select * from finish();
rollback;
