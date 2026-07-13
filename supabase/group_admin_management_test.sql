-- ════════════════════════════════════════════════════════════════════════════
-- Repeatable verification for group_admin_management.sql — run in the Supabase
-- SQL editor (as the privileged `postgres` role) AFTER applying the migration.
--
-- Everything runs inside a single transaction that ROLLS BACK at the end, so it
-- leaves no data behind and can be re-run safely. FK checks are disabled for the
-- synthetic ids (session_replication_role = replica) so we don't need real
-- auth.users rows. auth.uid() is simulated per call via request.jwt.claim.sub.
--
-- Each check RAISEs with a 'FAIL: …' message if the RPC behaves unexpectedly;
-- a clean run prints only the final 'ALL GROUP-ADMIN CHECKS PASSED' notice.
-- ════════════════════════════════════════════════════════════════════════════
begin;
set local session_replication_role = replica;  -- skip FK to synthetic auth.users

-- ── Fixtures ──────────────────────────────────────────────────────────────────
-- G1 owned by U_OWNER, with U_ADMIN (admin) and U_MEMBER (member).
-- G2 is a separate group owned by U_OUT (an outsider to G1).
insert into public.groups (id, name, invite_code, created_by) values
  ('11111111-1111-1111-1111-111111111111', 'G1', 'CODE01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'G2', 'CODE02', 'dddddddd-dddd-dddd-dddd-dddddddddddd');

insert into public.group_members (group_id, user_id, role) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin'),   -- owner
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'admin'),   -- non-owner admin
  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'member'),  -- regular member
  ('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'admin');   -- outsider

-- ── Checks ────────────────────────────────────────────────────────────────────
do $$
declare
  g1        constant uuid := '11111111-1111-1111-1111-111111111111';
  u_owner   constant uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  u_admin   constant uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  u_member  constant uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  u_out     constant uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  r         public.group_members;
  got       text;
begin
  -- 1 + 2 + 3: an admin can promote a regular member; role becomes 'admin' and
  -- is persisted (get_my_admin_group_ids / fetchGroups read exactly this column).
  perform set_config('request.jwt.claim.sub', u_admin::text, true);
  r := public.set_group_member_role(g1, u_member, 'admin');
  if r.role <> 'admin' then raise exception 'FAIL 1: return role %', r.role; end if;
  if (select role from public.group_members where group_id = g1 and user_id = u_member) <> 'admin'
    then raise exception 'FAIL 2: not persisted'; end if;
  -- restore member role for later independent checks
  update public.group_members set role = 'member' where group_id = g1 and user_id = u_member;

  -- 4: an admin can demote a non-owner admin (owner remains, so an admin stays).
  perform set_config('request.jwt.claim.sub', u_owner::text, true);
  r := public.set_group_member_role(g1, u_admin, 'member');
  if r.role <> 'member' then raise exception 'FAIL 4: demote failed'; end if;
  update public.group_members set role = 'admin' where group_id = g1 and user_id = u_admin;

  -- 5: a regular member cannot promote or demote anyone.
  perform set_config('request.jwt.claim.sub', u_member::text, true);
  begin
    perform public.set_group_member_role(g1, u_admin, 'member');
    raise exception 'FAIL 5: member was allowed to change roles';
  exception when others then
    got := sqlerrm;
    if got <> 'not_group_admin' then raise exception 'FAIL 5: got %', got; end if;
  end;

  -- 6 + 7: a user cannot change their own role (promote or demote) via this RPC.
  -- The self guard is checked before anything else, so it fires for any target
  -- role — here an admin attempting to demote themselves.
  perform set_config('request.jwt.claim.sub', u_admin::text, true);
  begin
    perform public.set_group_member_role(g1, u_admin, 'member');  -- self-demote
    raise exception 'FAIL 6/7: self-change allowed';
  exception when others then
    got := sqlerrm;
    if got <> 'cannot_change_own_role' then raise exception 'FAIL 6/7: got %', got; end if;
  end;

  -- 8: the group creator cannot be demoted (even by another admin).
  perform set_config('request.jwt.claim.sub', u_admin::text, true);
  begin
    perform public.set_group_member_role(g1, u_owner, 'member');
    raise exception 'FAIL 8: creator demoted';
  exception when others then
    got := sqlerrm;
    if got <> 'creator_cannot_be_demoted' then raise exception 'FAIL 8: got %', got; end if;
  end;

  -- 9: the group creator cannot be removed.
  perform set_config('request.jwt.claim.sub', u_admin::text, true);
  begin
    perform public.remove_group_member(g1, u_owner);
    raise exception 'FAIL 9: creator removed';
  exception when others then
    got := sqlerrm;
    if got <> 'creator_cannot_be_removed' then raise exception 'FAIL 9: got %', got; end if;
  end;

  -- 10: the last remaining admin cannot be demoted or removed. In G3 the creator
  -- (u_owner) has left, leaving u_admin as the sole admin and u_member as a plain
  -- member. Nobody can strip the final admin: a non-admin member is unauthorized,
  -- and the admin themselves is blocked by the self-change / self-remove guards —
  -- so the group can never be left without an admin. (The explicit
  -- must_retain_admin guard in the RPC is defense-in-depth for concurrent
  -- demotions, serialized by the group-row lock.)
  insert into public.groups (id, name, invite_code, created_by)
    values ('33333333-3333-3333-3333-333333333333', 'G3', 'CODE03', u_owner);
  insert into public.group_members (group_id, user_id, role) values
    ('33333333-3333-3333-3333-333333333333', u_admin, 'admin'),
    ('33333333-3333-3333-3333-333333333333', u_member, 'member');

  -- a regular member cannot demote the sole admin
  perform set_config('request.jwt.claim.sub', u_member::text, true);
  begin
    perform public.set_group_member_role('33333333-3333-3333-3333-333333333333', u_admin, 'member');
    raise exception 'FAIL 10: member demoted the last admin';
  exception when others then
    got := sqlerrm;
    if got <> 'not_group_admin' then raise exception 'FAIL 10 (member demote): got %', got; end if;
  end;

  -- the sole admin cannot demote themselves…
  perform set_config('request.jwt.claim.sub', u_admin::text, true);
  begin
    perform public.set_group_member_role('33333333-3333-3333-3333-333333333333', u_admin, 'member');
    raise exception 'FAIL 10: last admin self-demoted';
  exception when others then
    got := sqlerrm;
    if got <> 'cannot_change_own_role' then raise exception 'FAIL 10 (self demote): got %', got; end if;
  end;

  -- …nor remove themselves via the admin removal path (that is "leave group")
  begin
    perform public.remove_group_member('33333333-3333-3333-3333-333333333333', u_admin);
    raise exception 'FAIL 10: last admin self-removed';
  exception when others then
    got := sqlerrm;
    if got <> 'cannot_remove_self' then raise exception 'FAIL 10 (self remove): got %', got; end if;
  end;

  -- 11: a user from another group cannot modify this group.
  perform set_config('request.jwt.claim.sub', u_out::text, true);
  begin
    perform public.set_group_member_role(g1, u_member, 'admin');
    raise exception 'FAIL 11: outsider changed roles';
  exception when others then
    got := sqlerrm;
    if got <> 'not_group_admin' then raise exception 'FAIL 11: got %', got; end if;
  end;

  -- 12: an invalid role value is rejected.
  perform set_config('request.jwt.claim.sub', u_owner::text, true);
  begin
    perform public.set_group_member_role(g1, u_member, 'superadmin');
    raise exception 'FAIL 12: invalid role accepted';
  exception when others then
    got := sqlerrm;
    if got <> 'invalid_role' then raise exception 'FAIL 12: got %', got; end if;
  end;

  -- 13: a target who is not a group member is rejected.
  perform set_config('request.jwt.claim.sub', u_owner::text, true);
  begin
    perform public.set_group_member_role(g1, u_out, 'admin');   -- u_out is not in G1
    raise exception 'FAIL 13: non-member targeted';
  exception when others then
    got := sqlerrm;
    if got <> 'target_not_member' then raise exception 'FAIL 13: got %', got; end if;
  end;

  raise notice 'ALL GROUP-ADMIN CHECKS PASSED';
end $$;

-- 14: direct client UPDATE of group_members.role stays blocked by RLS (no UPDATE
-- policy exists). As the `authenticated` role the row is invisible to UPDATE, so
-- it affects 0 rows and the role is unchanged (RLS does not raise, it filters).
set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true);
update public.group_members set role = 'admin'
  where group_id = '11111111-1111-1111-1111-111111111111'
    and user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
reset role;
do $$
begin
  if (select role from public.group_members
      where group_id = '11111111-1111-1111-1111-111111111111'
        and user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc') = 'admin'
  then raise exception 'FAIL 14: direct RLS UPDATE escalated a role';
  else raise notice 'CHECK 14 PASSED: direct role UPDATE blocked by RLS';
  end if;
end $$;

rollback;
