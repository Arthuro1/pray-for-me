-- Lightweight avatars for groups and people.
--
-- Three structured columns per row instead of an uploaded image: there is no
-- file, no storage bucket, and no URL, so there is no filename or path that
-- could carry a name or a prayer detail into a log, a CDN, or a push payload.
-- Every column is nullable with no default, so rows that predate this migration
-- keep working unchanged — the client derives a deterministic avatar from the
-- display name whenever the columns are null.

-- ── Columns ─────────────────────────────────────────────────────────────────
alter table public.groups   add column if not exists avatar_type  text;
alter table public.groups   add column if not exists avatar_value text;
alter table public.groups   add column if not exists avatar_color text;
alter table public.profiles add column if not exists avatar_type  text;
alter table public.profiles add column if not exists avatar_value text;
alter table public.profiles add column if not exists avatar_color text;

-- The preset keys and the palette are mirrored in src/lib/avatar.js. Constraining
-- them here means an unexpected client — or a hand-written row — cannot park
-- arbitrary text in a field the UI renders into a style attribute. Existing rows
-- are all null, so each constraint validates instantly.
do $$
declare r record;
begin
  for r in select unnest(array['groups', 'profiles']) as tbl loop
    begin
      execute format($f$
        alter table public.%I add constraint %I
        check (
          (avatar_type is null or avatar_type in ('initials', 'icon'))
          and (avatar_value is null or avatar_value in
                ('dove', 'cross', 'church', 'hands', 'family', 'heart', 'bible', 'globe'))
          and (avatar_color is null or avatar_color in
                ('#60457b', '#4a4f9e', '#2f6ea8', '#1f7d76', '#3f7d4c', '#8f6420', '#a35540', '#a34a6a'))
        )$f$, r.tbl, r.tbl || '_avatar_preset_check');
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ── Group avatars: no policy changes needed ─────────────────────────────────
-- Groups are already members-only under "Members can read their groups" (plus
-- the invitee read policy that lets an invitation card name its group), and
-- writes are already admin-only under "Admins can update their group". The
-- avatar columns inherit both rules unchanged.

-- ── Profile avatars: narrower than the display name ─────────────────────────
-- A display name has to be readable by any signed-in user, because a friend
-- request can arrive from someone you have no relationship with yet. An avatar
-- does not, and must not be globally discoverable. RLS cannot express "these
-- three columns are narrower than the rest of the row", so the narrowing is
-- done with column privileges: the table-wide SELECT grant is replaced by a
-- grant on exactly the columns the app reads directly. The avatar columns are
-- then reachable only through the relationship-scoped function below.
--
-- NOTE for future migrations: a blanket `grant select on public.profiles` would
-- silently undo this. Grant columns, not the table.
revoke select on table public.profiles from authenticated;
grant select (id, full_name, created_at) on table public.profiles to authenticated;

comment on column public.profiles.avatar_type is
  'Avatar preset. Not selectable from this table by app clients — see get_profile_avatars().';

-- Avatars for the given users, filtered to people the caller already has a
-- legitimate relationship with: themselves, an accepted friend, or a member of
-- a group they share. Anyone else is simply absent from the result — no error,
-- no existence signal, and no other profile field. SECURITY DEFINER only so it
-- can read the narrowed columns; the visibility rule below IS the authorization.
create or replace function public.get_profile_avatars(p_ids uuid[])
returns table (id uuid, avatar_type text, avatar_value text, avatar_color text)
language sql
security definer
stable
set search_path = ''
as $$
  select p.id, p.avatar_type, p.avatar_value, p.avatar_color
  from public.profiles p
  where p.id = any(coalesce(p_ids, '{}'::uuid[]))
    and (
      p.id = (select auth.uid())
      or exists (
        select 1 from public.friendships f
        where (f.user_id = (select auth.uid()) and f.friend_id = p.id)
           or (f.friend_id = (select auth.uid()) and f.user_id = p.id)
      )
      or exists (
        select 1
        from public.group_members mine
        join public.group_members theirs on theirs.group_id = mine.group_id
        where mine.user_id = (select auth.uid()) and theirs.user_id = p.id
      )
    );
$$;

-- New functions are not exposed by default (see the explicit Data API grants
-- migration); allow-list this one for signed-in users only.
revoke all on function public.get_profile_avatars(uuid[]) from public, anon, authenticated;
grant execute on function public.get_profile_avatars(uuid[]) to authenticated;
grant execute on function public.get_profile_avatars(uuid[]) to service_role;
