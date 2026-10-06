-- ════════════════════════════════════════════════════════════════════════
-- Right-to-erasure: let a user permanently delete their account and ALL data.
-- Run in the Supabase SQL editor (idempotent).
--
-- The function runs as its owner (security definer) so it can remove the row
-- from auth.users; every user-owned table referencing auth.users(id) with
-- `on delete cascade` (prayers, categories, prayer_updates, prayer_points,
-- vault_keys, push_subscriptions, group_members, community_prayers, …) is then
-- cleared automatically. Tables without a cascade are deleted explicitly first.
-- ════════════════════════════════════════════════════════════════════════

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

  delete from public.feedback           where user_id = v_uid;
  delete from public.translations       where user_id = v_uid;
  delete from public.vault_keys         where user_id = v_uid;
  delete from public.push_subscriptions where user_id = v_uid;

  delete from public.groups g
  where g.created_by = v_uid
    and not exists (
      select 1 from public.group_members gm
      where gm.group_id = g.id and gm.user_id <> v_uid
    );

  -- Removing the auth user cascades to everything that references it.
  delete from auth.users where id = v_uid;
end;
$$;

-- Only an authenticated user may call it (and it only ever deletes auth.uid()).
revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
