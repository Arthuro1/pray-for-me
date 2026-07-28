-- ════════════════════════════════════════════════════════════════════════
-- RPC hardening — run in the Supabase SQL editor. Idempotent, safe to re-run.
--
-- Closes two findings from the 2026-07-28 OWASP audit:
--
--   #1  Broken access control (OWASP A01): the core community/sync RPCs in
--       community_schema.sql, migration.sql, security_hardening.sql,
--       shared_prayer_sync.sql, offline_client_ids.sql, offline_conflict_
--       hardening.sql, attachment_management.sql and update_text_edit.sql
--       were created with NO grant/revoke, so Postgres's default
--       `EXECUTE TO PUBLIC` applies and the `anon` role can call them via
--       PostgREST with only the publishable anon key. The worst case is
--       find_user_by_email(): an UNAUTHENTICATED email -> user-UUID oracle.
--
--   #2  Security misconfiguration (OWASP A05): those same SECURITY DEFINER
--       functions run without a pinned search_path (Supabase linter
--       `function_search_path_mutable`), a privilege-escalation hardening gap.
--
-- This script restricts the client-facing RPCs to `authenticated` and pins a
-- fixed search_path on every SECURITY DEFINER function that lacks one. It
-- matches functions BY NAME, so it covers every overload (e.g. the two
-- sync_add_update / sync_add_point signatures) and silently skips any function
-- a given database hasn't created yet.
--
-- It deliberately does NOT touch:
--   • trigger functions (handle_new_user, tg_notify_*) — not client RPCs, and
--     handle_new_user is hardened + granted to supabase_auth_admin already.
--   • the service-role notification workers (claim_*, finish_*,
--     create_notification, resolve_notification_pref, pending_digest_recipients,
--     claim_user_digest, default_delivery_mode) — those are intentionally
--     revoked from anon/authenticated; granting `authenticated` would LOOSEN them.
--   • already-hardened RPCs (delete_account, set_group_member_role,
--     remove_group_member, check_ai_rate_limit) — re-running would be harmless,
--     but they're left out to keep this focused.
-- ════════════════════════════════════════════════════════════════════════

-- ── 0. BEFORE: audit the current state (read-only) ───────────────────────────
-- Every SECURITY DEFINER function in `public`, its pinned search_path
-- ((unpinned) = MUTABLE), and its ACL. A NULL acl means default privileges,
-- i.e. EXECUTE is still granted to PUBLIC — so `anon` can reach it.
-- (Wrapped in a CTE so `search_path` is a real column ORDER BY can sort on;
--  Postgres rejects an output alias used inside an ORDER BY expression.)
with secdef as (
  select
    p.oid::regprocedure                                 as function,
    p.prosecdef                                         as security_definer,
    coalesce(
      (select c from unnest(p.proconfig) c where c like 'search_path=%'),
      '(unpinned)'
    )                                                   as search_path,
    p.proacl                                            as acl
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef
)
select *
from secdef
order by (search_path = '(unpinned)') desc, function::text;

-- ── 1. RESTRICT client-facing RPCs to authenticated (+ pin search_path) ──────
do $$
declare
  r record;
  -- Client-called RPCs (verified against every supabase.rpc('…') caller in src).
  -- Each is SECURITY DEFINER and already self-gates on auth.uid(); locking
  -- EXECUTE to `authenticated` removes the anon attack surface (esp. #1).
  restrict_names text[] := array[
    'find_user_by_email',
    'create_group_with_member',
    'join_group_by_code',
    'answer_prayer',
    'sync_add_update',              -- both (uuid,text,text,bool) & p_id overloads
    'sync_add_point',               -- both (uuid,text,jsonb)      & p_id overloads
    'sync_remove_point',
    'sync_add_verse',
    'sync_remove_verse',
    'sync_remove_update_attachment',
    'sync_remove_update_text',
    'sync_set_update_text',
    'sync_delete_update'
  ];
begin
  for r in
    select p.oid::regprocedure as sig, p.prosecdef as secdef,
           exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c
                   where c like 'search_path=%') as has_sp
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any(restrict_names)
  loop
    if r.secdef and not r.has_sp then
      execute format('alter function %s set search_path = public', r.sig);
    end if;
    execute format('revoke all on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated', r.sig);
    raise notice 'restricted -> authenticated: %', r.sig;
  end loop;
end $$;

-- ── 2. PIN search_path on the internal helpers (leave EXECUTE as-is) ──────────
-- These are called INSIDE RLS policies / other definer bodies and return nothing
-- to anon (auth.uid() is null), so there's no access-control gain in revoking
-- anon — and doing so could make an anon query that touches a community table
-- error instead of returning empty. We only close the search_path gap (#2).
do $$
declare
  r record;
  helper_names text[] := array[
    'get_my_group_ids',
    'get_my_admin_group_ids',
    'can_sync_prayer',
    'can_remove_shared',
    'resolve_source_prayer'
  ];
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any(helper_names)
      and p.prosecdef
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c
                      where c like 'search_path=%')
  loop
    execute format('alter function %s set search_path = public', r.sig);
    raise notice 'pinned search_path: %', r.sig;
  end loop;
end $$;

-- ── 3. OPTIONAL (finding #3): stop create_group_with_member trusting a
--        client-supplied user id. The client already passes its own id, so this
--        keeps the 3-arg signature but derives the actor from auth.uid() and
--        rejects a mismatched p_user_id. Uncomment to apply.
-- ─────────────────────────────────────────────────────────────────────────────
-- create or replace function create_group_with_member(
--   p_name text, p_invite_code text, p_user_id uuid
-- )
-- returns void language plpgsql security definer set search_path = public as $$
-- declare v_group_id uuid; v_uid uuid := auth.uid();
-- begin
--   if v_uid is null then raise exception 'authentication required'; end if;
--   if p_user_id is distinct from v_uid then
--     raise exception 'cannot create a group on behalf of another user';
--   end if;
--   insert into groups (name, invite_code, created_by)
--   values (p_name, p_invite_code, v_uid)
--   returning id into v_group_id;
--   insert into group_members (group_id, user_id, role)
--   values (v_group_id, v_uid, 'admin');
-- end;
-- $$;
-- revoke all on function create_group_with_member(text, text, uuid) from public, anon;
-- grant execute on function create_group_with_member(text, text, uuid) to authenticated;

-- ── 4. AFTER: re-run section 0 to confirm ────────────────────────────────────
-- Every function above should now show a pinned `search_path=public` and an ACL
-- that no longer grants EXECUTE to PUBLIC. Also confirm the app still works end
-- to end (add a friend by email, create/join a group, add an update/point/verse,
-- mark a prayer answered) — all run as `authenticated`, so all still succeed.
--
-- NOTE: sync_set_update_text lives in update_text_edit.sql; if that file hasn't
-- been run in this database yet, it simply won't exist here and was skipped —
-- re-run this script after applying update_text_edit.sql.
