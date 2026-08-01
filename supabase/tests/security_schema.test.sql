begin;
select plan(10);

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
      and not coalesce(p.proconfig, '{}'::text[]) && array['search_path=""', 'search_path=public, pg_temp']
  ),
  'security-definer functions pin their search path'
);

select * from finish();
rollback;
