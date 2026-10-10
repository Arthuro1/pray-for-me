-- Supabase no longer auto-exposes new public tables/functions. Preserve the
-- app's existing Data API surface explicitly while keeping key-management and
-- private rate-limit tables RPC-only.

grant usage on schema public to authenticated, service_role;

do $$
declare r record;
begin
  for r in
    select c.oid::regclass as relation
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relrowsecurity
      and c.relname not in (
        'group_key_versions', 'group_member_keys', 'group_key_operations',
        'ai_rate_limits'
      )
  loop
    execute format('grant select, insert, update, delete on table %s to authenticated', r.relation);
  end loop;
end $$;

grant select on table public.group_key_versions, public.group_member_keys to authenticated;
grant select on table public.public_keys to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- PostgreSQL grants EXECUTE to PUBLIC on new functions by default. Remove that
-- ambient access (and any legacy authenticated grants) before allow-listing the
-- exact RPC surface used by the application.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.signature);
  end loop;
end $$;

do $$
declare r record;
declare allowed text[] := array[
  'sync_add_update', 'sync_add_point', 'sync_remove_update_attachment',
  'sync_remove_update_text', 'sync_set_update_text', 'sync_delete_update',
  'sync_add_verse', 'sync_remove_verse', 'sync_remove_point',
  'create_group_with_member', 'join_group_by_code', 'find_user_by_email',
  'set_group_member_role', 'delete_account', 'check_ai_rate_limit',
  'create_group_key_version', 'distribute_group_key',
  'remove_group_member_and_rotate', 'detect_orphaned_group_key_versions',
  'repair_orphaned_group_key_versions'
];
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any(allowed)
  loop
    execute format('grant execute on function %s to authenticated', r.signature);
  end loop;
end $$;

-- Keep future objects opt-in instead of silently expanding the API surface.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;
