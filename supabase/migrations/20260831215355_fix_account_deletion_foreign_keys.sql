-- Account deletion used to fail as soon as the member had authored community
-- content. These six historical foreign keys used the default ON DELETE
-- RESTRICT action, so deleting auth.users was impossible for active members.
--
-- User-authored prayers/updates/testimonies are personal data and disappear
-- with the account. Shared group infrastructure must survive for the remaining
-- members, so creator/audit references are anonymised instead.

alter table public.community_prayers
  drop constraint if exists community_prayers_user_id_fkey,
  add constraint community_prayers_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.community_updates
  drop constraint if exists community_updates_user_id_fkey,
  add constraint community_updates_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.testimonies
  drop constraint if exists testimonies_user_id_fkey,
  add constraint testimonies_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.groups
  drop constraint if exists groups_created_by_fkey,
  add constraint groups_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete set null;

alter table public.group_invitations
  drop constraint if exists group_invitations_invited_by_fkey,
  add constraint group_invitations_invited_by_fkey
    foreign key (invited_by) references auth.users(id) on delete set null;

alter table public.group_key_versions
  drop constraint if exists group_key_versions_created_by_fkey,
  add constraint group_key_versions_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete set null;

-- Keep the RPC self-service and narrowly scoped to auth.uid(). An empty search
-- path plus fully-qualified relations avoids object-shadowing in this
-- SECURITY DEFINER function.
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = 'insufficient_privilege';
  end if;

  -- Rows that intentionally use ON DELETE SET NULL still contain submitted
  -- personal content, so erase the caller's copies before removing auth.users.
  delete from public.feedback           where user_id = v_uid;
  delete from public.translations       where user_id = v_uid;
  delete from public.vault_keys         where user_id = v_uid;
  delete from public.push_subscriptions where user_id = v_uid;

  -- A group with no member besides its departing creator is unreachable after
  -- deletion. Remove only those empty groups; groups with other members remain
  -- intact and their created_by reference is anonymised by the FK above.
  delete from public.groups g
  where g.created_by = v_uid
    and not exists (
      select 1
      from public.group_members gm
      where gm.group_id = g.id
        and gm.user_id <> v_uid
    );

  -- Cascades remove all remaining user-owned rows and auth sessions.
  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
