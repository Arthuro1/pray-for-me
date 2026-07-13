-- ════════════════════════════════════════════════════════════════════════════
-- Multi-admin management for prayer groups — run in the Supabase SQL editor.
-- Idempotent and safe to re-run.
--
-- Goal: let an existing group admin promote a member to admin, demote a
-- non-owner admin, and remove members — WITHOUT ever letting a client bypass
-- authorization by writing group_members directly. All authorization lives in
-- SECURITY DEFINER functions below; there is deliberately NO client-facing
-- UPDATE policy on group_members, so direct role changes stay blocked by RLS.
--
-- Ownership is derived from groups.created_by (the immutable owner). We do NOT
-- introduce an "owner" role value — role is only ever 'member' or 'admin'.
--
-- ── Deadlock note ────────────────────────────────────────────────────────────
-- PART 1 (functions + grants) takes NO table locks and is the essential part.
-- PART 2 (the role check-constraint + retiring the old DELETE policy) needs a
-- brief AccessExclusiveLock on group_members, which can contend with live app
-- reads (PostgREST/Realtime) and — under load — deadlock. If PART 2 errors with
-- "deadlock detected" it is transient and nothing was applied: just re-run it
-- (ideally in a quiet moment). Running PART 1 and PART 2 as SEPARATE executions
-- keeps the exclusive lock window tiny. lock_timeout below also makes any lock
-- wait fail fast instead of hanging.
-- ════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════ PART 1 — functions (no table locks) ══════════════

-- ── Secure role management ────────────────────────────────────────────────────
-- Promote/demote a member. Runs as definer (bypasses RLS) but enforces every
-- authorization rule itself: UI visibility is never trusted as authorization.
-- The acting user is always auth.uid() — a client can never supply it.
--
-- Raises stable single-token messages the client maps to localized strings:
--   not_authenticated · invalid_role · cannot_change_own_role · not_group_admin
--   target_not_member · creator_cannot_be_demoted · must_retain_admin
create or replace function public.set_group_member_role(
  p_group_id uuid,
  p_target_user_id uuid,
  p_role text
)
returns public.group_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor       uuid := auth.uid();
  v_created_by  uuid;
  v_current     text;
  v_admin_count int;
  v_row         public.group_members;
begin
  -- 1. Caller must be authenticated.
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- 2. Requested role must be exactly 'member' or 'admin'.
  if p_role is null or p_role not in ('member', 'admin') then
    raise exception 'invalid_role' using errcode = '22023';
  end if;

  -- 3. Nobody may change their own role through this RPC.
  if p_target_user_id = v_actor then
    raise exception 'cannot_change_own_role' using errcode = '42501';
  end if;

  -- Lock the group row for the whole operation so two simultaneous demotions
  -- can't each pass the "an admin will remain" check and leave the group with
  -- no admin. created_by is the immutable owner.
  select created_by into v_created_by
  from public.groups
  where id = p_group_id
  for update;

  -- Unknown group → report as an authorization failure (don't leak existence).
  if v_created_by is null then
    raise exception 'not_group_admin' using errcode = '42501';
  end if;

  -- 4. Caller must currently be an admin of this group.
  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = v_actor and role = 'admin'
  ) then
    raise exception 'not_group_admin' using errcode = '42501';
  end if;

  -- 5. Target must currently be a member of this group.
  select role into v_current
  from public.group_members
  where group_id = p_group_id and user_id = p_target_user_id;

  if v_current is null then
    raise exception 'target_not_member' using errcode = 'P0002';
  end if;

  -- 6. The creator is the permanent owner and must always remain an admin.
  if p_target_user_id = v_created_by and p_role <> 'admin' then
    raise exception 'creator_cannot_be_demoted' using errcode = '42501';
  end if;

  -- 8. Idempotent: role already at the requested value → return it unchanged.
  if v_current = p_role then
    select * into v_row from public.group_members
    where group_id = p_group_id and user_id = p_target_user_id;
    return v_row;
  end if;

  -- 7. Demoting an admin must leave at least one other admin behind.
  if v_current = 'admin' and p_role = 'member' then
    select count(*) into v_admin_count
    from public.group_members
    where group_id = p_group_id and role = 'admin' and user_id <> p_target_user_id;
    if v_admin_count < 1 then
      raise exception 'must_retain_admin' using errcode = '42501';
    end if;
  end if;

  update public.group_members
  set role = p_role
  where group_id = p_group_id and user_id = p_target_user_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.set_group_member_role(uuid, uuid, text) from public, anon;
grant execute on function public.set_group_member_role(uuid, uuid, text) to authenticated;

-- ── Secure member removal ─────────────────────────────────────────────────────
-- Newly promoted admins inherit member removal, so it is guarded here rather
-- than by a broad DELETE policy. An admin cannot remove the creator, cannot
-- remove themselves (that is "leave group"), and cannot remove the last admin.
--
-- Raises stable tokens: not_authenticated · cannot_remove_self · not_group_admin
--   target_not_member · creator_cannot_be_removed · must_retain_admin
create or replace function public.remove_group_member(
  p_group_id uuid,
  p_target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor       uuid := auth.uid();
  v_created_by  uuid;
  v_target_role text;
  v_admin_count int;
begin
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Leaving is a separate self-service action, not an admin "remove".
  if p_target_user_id = v_actor then
    raise exception 'cannot_remove_self' using errcode = '42501';
  end if;

  select created_by into v_created_by
  from public.groups
  where id = p_group_id
  for update;

  if v_created_by is null then
    raise exception 'not_group_admin' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = v_actor and role = 'admin'
  ) then
    raise exception 'not_group_admin' using errcode = '42501';
  end if;

  select role into v_target_role
  from public.group_members
  where group_id = p_group_id and user_id = p_target_user_id;

  if v_target_role is null then
    raise exception 'target_not_member' using errcode = 'P0002';
  end if;

  -- The creator can never be removed.
  if p_target_user_id = v_created_by then
    raise exception 'creator_cannot_be_removed' using errcode = '42501';
  end if;

  -- Removing an admin must leave at least one other admin behind.
  if v_target_role = 'admin' then
    select count(*) into v_admin_count
    from public.group_members
    where group_id = p_group_id and role = 'admin' and user_id <> p_target_user_id;
    if v_admin_count < 1 then
      raise exception 'must_retain_admin' using errcode = '42501';
    end if;
  end if;

  delete from public.group_members
  where group_id = p_group_id and user_id = p_target_user_id;

  -- Tidy the removed member's per-group preference row (harmless if absent).
  delete from public.group_member_prefs
  where group_id = p_group_id and user_id = p_target_user_id;
end;
$$;

revoke all on function public.remove_group_member(uuid, uuid) from public, anon;
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;

-- ══════════════ PART 2 — group_members table changes (brief exclusive lock) ═══
-- Run this block on its own if PART 1 already committed. Every statement here
-- touches group_members; a short lock_timeout turns a lock wait into a fast
-- error (retry) instead of a hang, and the check constraint is added NOT VALID
-- (catalog-only, no full-table scan under the exclusive lock) then validated
-- separately under a concurrent-friendly ShareUpdateExclusiveLock.
set lock_timeout = '6s';

-- Role value constraint: role may only be 'member' or 'admin'. Normalise any
-- stray value first so validation can never fail on an existing prod table.
update public.group_members
set role = 'member'
where role is null or role not in ('member', 'admin');

do $$
begin
  alter table public.group_members
    add constraint group_members_role_check check (role in ('member', 'admin')) not valid;
exception
  when duplicate_object then null;  -- constraint already present
  when duplicate_table then null;
end $$;

-- Validate outside the exclusive lock (no-op if the constraint was already valid).
alter table public.group_members validate constraint group_members_role_check;

-- Lock down direct writes: admin member removal now flows exclusively through
-- remove_group_member(), so retire the broad DELETE policy that let any admin
-- delete any membership row (it could remove the creator or the last admin).
-- Self-leave is still allowed by the "Users can leave groups" policy.
drop policy if exists "Admins can remove members" on public.group_members;

-- No UPDATE policy is defined on group_members (RLS is enabled), so direct role
-- updates from the client remain denied. Do NOT add one — role changes must go
-- through set_group_member_role().
