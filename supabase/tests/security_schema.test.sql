begin;
select plan(20);

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

select * from finish();
rollback;
