-- ════════════════════════════════════════════════════════════════════════
-- Security hardening — run in the Supabase SQL editor (idempotent).
-- Addresses:
--   #2  Group join was gated only by a (non-secret) group UUID.
--   #3  Forgeable source_prayer_id let members tamper with others' prayers.
-- ════════════════════════════════════════════════════════════════════════

-- ── #2  Joining a group now requires the invite code (server-validated) or a
--        real invitation — not just knowing the group's UUID. ───────────────

-- Remove the blanket self-insert policy that allowed adding yourself to ANY group.
drop policy if exists "Users can join groups" on group_members;

-- Direct self-insert is allowed ONLY when an invitation to that group exists.
create policy "Users join via invitation" on group_members
  for insert with check (
    user_id = auth.uid()
    and group_id in (select group_id from group_invitations where invited_user_id = auth.uid())
  );

-- Joining by invite code goes through this security-definer RPC, which validates
-- the code server-side before inserting membership (bypassing the policy above).
create or replace function join_group_by_code(p_code text)
returns groups language plpgsql security definer as $$
declare g groups;
begin
  select * into g from groups where invite_code = upper(trim(p_code));
  if g.id is null then
    raise exception 'group not found' using errcode = 'no_data_found';
  end if;
  if exists (select 1 from group_members where group_id = g.id and user_id = auth.uid()) then
    raise exception 'already member' using errcode = 'unique_violation';
  end if;
  insert into group_members (group_id, user_id, role) values (g.id, auth.uid(), 'member');
  return g;
end;
$$;

-- ── #3  A shared community prayer may only link to the inserter's OWN personal
--        prayer, closing the path to tampering with another user's prayer via
--        the sync_* RPCs. ────────────────────────────────────────────────────
drop policy if exists "Group members can post prayers" on community_prayers;
create policy "Group members can post prayers" on community_prayers
  for insert with check (
    group_id in (select get_my_group_ids())
    and user_id = auth.uid()
    and (
      source_prayer_id is null
      or exists (select 1 from prayers where id = source_prayer_id and user_id = auth.uid())
    )
  );
