-- Photo avatars for people and groups.
--
-- An extension of the preset avatars added in 20260826120000, not a second
-- system: the same avatar_type/avatar_value/avatar_color columns keep describing
-- the preset, and one new column holds an opaque key into a PRIVATE storage
-- bucket for people who would rather show a photograph. The preset survives
-- underneath a photo, so removing the photo restores exactly what the person had
-- before rather than resetting them.
--
-- Every column stays nullable with no default, so rows written before this
-- migration keep resolving to their existing preset or to the deterministic
-- name-derived fallback. Nothing is backfilled and nothing is rewritten.
--
-- Privacy properties this migration is responsible for:
--   • the bucket is private — there is no permanent public URL for any avatar;
--   • an object name carries an opaque id and nothing else: no display name, no
--     email, no prayer title, nothing that could leak through a log or a CDN;
--   • a check constraint ties a row's photo to that row's OWN storage folder, so
--     a profile can never be pointed at somebody else's picture;
--   • reads are authorised by the same relationship rule as the preset avatars
--     (yourself, an accepted friend, a member of a group you share), asked again
--     at the storage layer instead of being trusted from the client.
--
-- The account picture supplied by an OAuth identity provider is deliberately NOT
-- part of this schema. It is resolved from the caller's own session at render
-- time and never copied here, so it can never become a Pray4Me-hosted image or
-- appear in a lookup for anybody but its owner.

-- ── 1. The photo column ─────────────────────────────────────────────────────
alter table public.groups   add column if not exists avatar_photo_path text;
alter table public.profiles add column if not exists avatar_photo_path text;

comment on column public.profiles.avatar_photo_path is
  'Opaque key into the private avatars bucket. Not selectable from this table by app clients — see get_profile_avatars().';
comment on column public.groups.avatar_photo_path is
  'Opaque key into the private avatars bucket, readable by the group''s members.';

-- ── 2. Constraints ──────────────────────────────────────────────────────────
-- The preset keys and palette are mirrored in src/lib/avatar.js, as before. What
-- is new is the last two clauses: a photo path is only ever accepted when it
-- names an object inside THIS row's own folder, and avatar_type = 'photo' holds
-- exactly when a path is present. A hand-written row — or an unexpected client —
-- therefore cannot borrow another user's or another group's picture, and cannot
-- leave a row claiming a photo it does not have.
do $$
declare
  r record;
  icons text := $i$'dove', 'cross', 'church', 'hands', 'family', 'heart', 'bible', 'globe'$i$;
  colors text := $c$'#60457b', '#4a4f9e', '#2f6ea8', '#1f7d76', '#3f7d4c', '#8f6420', '#a35540', '#a34a6a'$c$;
begin
  -- The table name doubles as the storage folder: `profiles/…` and `groups/…`.
  for r in select unnest(array['groups', 'profiles']) as tbl loop
    execute format('alter table public.%I drop constraint if exists %I', r.tbl, r.tbl || '_avatar_preset_check');
    execute format($f$
      alter table public.%I add constraint %I
      check (
        (avatar_type is null or avatar_type in ('initials', 'icon', 'photo'))
        and (avatar_value is null or avatar_value in (%s))
        and (avatar_color is null or avatar_color in (%s))
        and (avatar_photo_path is null
             or avatar_photo_path ~ ('^%s/' || id::text || '/[0-9a-f]{32}\.(webp|jpg)$'))
        and ((avatar_photo_path is null) = (avatar_type is distinct from 'photo'))
      )$f$, r.tbl, r.tbl || '_avatar_preset_check', icons, colors, r.tbl);
  end loop;
end $$;

-- ── 3. The relationship rule, in one place ──────────────────────────────────
-- Extracted from get_profile_avatars so the row read and the storage read ask
-- exactly the same question. Changing who may see an avatar is now a one-line
-- change, not two that can drift apart.
create or replace function public.can_view_profile_avatar(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select p_user_id is not null and (
    p_user_id = (select auth.uid())
    or exists (
      select 1 from public.friendships f
      where (f.user_id = (select auth.uid()) and f.friend_id = p_user_id)
         or (f.friend_id = (select auth.uid()) and f.user_id = p_user_id)
    )
    or exists (
      select 1
      from public.group_members mine
      join public.group_members theirs on theirs.group_id = mine.group_id
      where mine.user_id = (select auth.uid()) and theirs.user_id = p_user_id
    )
  );
$$;

-- Group avatars follow group visibility: members see them, and so does someone
-- holding a pending invitation — which is already true of the group's NAME on
-- the invitation card, so the picture discloses nothing further. Membership
-- itself is never revealed: an unrelated caller gets `false`, exactly as they
-- would for a group that does not exist.
create or replace function public.can_view_group_avatar(p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select p_group_id is not null and (
    exists (select 1 from public.group_members m where m.group_id = p_group_id and m.user_id = (select auth.uid()))
    or exists (select 1 from public.group_invitations i where i.group_id = p_group_id and i.invited_user_id = (select auth.uid()))
  );
$$;

-- Who may change a group's picture: an admin, or the group's creator. The same
-- rule canEditGroupAvatar() applies in the client and the "Admins can update
-- their group" policy applies to the row itself — this one guards the object.
create or replace function public.can_edit_group_avatar(p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select p_group_id is not null and (
    exists (
      select 1 from public.group_members m
      where m.group_id = p_group_id and m.user_id = (select auth.uid()) and m.role = 'admin'
    )
    or exists (select 1 from public.groups g where g.id = p_group_id and g.created_by = (select auth.uid()))
  );
$$;

-- A storage object name is untrusted text. Parse the owner segment defensively:
-- anything that is not a uuid becomes null, and every predicate above answers
-- `false` for null rather than raising — a malformed name is denied, never an
-- error the client can use to probe.
create or replace function public.avatar_owner_uuid(p_segment text)
returns uuid
language sql
immutable
as $$
  select case
    when p_segment ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then p_segment::uuid
  end;
$$;

-- A per-folder ceiling, so a signed-in client cannot write unbounded data into
-- the bucket by uploading avatars it never references. In normal use a folder
-- holds one object — a replacement uploads a second and deletes the first —
-- and the only way to leave one behind is a double failure (the save AND the
-- cleanup). Twenty is therefore unreachable by accident and caps deliberate
-- abuse at ten megabytes per profile or group.
create or replace function public.avatar_folder_under_quota(p_prefix text)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select (
    select count(*) from (
      select 1 from storage.objects o
      where o.bucket_id = 'avatars' and o.name like p_prefix || '%'
      limit 20
    ) capped
  ) < 20;
$$;

-- ── 4. get_profile_avatars now carries the photo key ────────────────────────
-- The return type changes, so the old function is dropped rather than replaced.
-- The authorization is unchanged — it is simply the shared predicate now.
drop function if exists public.get_profile_avatars(uuid[]);

create function public.get_profile_avatars(p_ids uuid[])
returns table (id uuid, avatar_type text, avatar_value text, avatar_color text, avatar_photo_path text)
language sql
security definer
stable
set search_path = ''
as $$
  select p.id, p.avatar_type, p.avatar_value, p.avatar_color, p.avatar_photo_path
  from public.profiles p
  where p.id = any(coalesce(p_ids, '{}'::uuid[]))
    and public.can_view_profile_avatar(p.id);
$$;

-- ── 5. The private avatars bucket ───────────────────────────────────────────
-- Deliberately NOT the `attachments` bucket. Attachments are client-side
-- ciphertext that any signed-in user may download because a download without the
-- per-file key is noise; an avatar is a readable picture of a person's face, so
-- it needs real read authorization instead.
--
-- The size and MIME limits are a server-side floor under the client pipeline
-- (which already emits a 512×512 image well under 200 KB): an unexpected client
-- cannot park a 40 MB file, or an SVG, in the bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 524288, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── 6. Storage policies ─────────────────────────────────────────────────────
-- Objects are named `<scope>/<owner id>/<32 hex>.<ext>`. The regex in each write
-- policy pins that shape, so a client cannot invent a path outside its own
-- folder even before the ownership predicate is consulted.
--
-- Note there is no UPDATE policy: an avatar is never overwritten in place. A new
-- picture is a new object, which is what lets a replacement keep the old one
-- until the row safely points at the new one.

-- Profile photos ────────────────────────────────────────────────────────────
drop policy if exists "avatars_profile_insert_own" on storage.objects;
create policy "avatars_profile_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and name ~ ('^profiles/' || (select auth.uid())::text || '/[0-9a-f]{32}\.(webp|jpg)$')
    and public.avatar_folder_under_quota('profiles/' || (select auth.uid())::text || '/')
  );

drop policy if exists "avatars_profile_delete_own" on storage.objects;
create policy "avatars_profile_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and name like ('profiles/' || (select auth.uid())::text || '/%')
  );

-- Reading is where the privacy rule lives: the same people who may see the
-- preset avatar may see the photograph, and nobody else may so much as confirm
-- that an object exists.
drop policy if exists "avatars_profile_select_related" on storage.objects;
create policy "avatars_profile_select_related" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'profiles'
    and public.can_view_profile_avatar(public.avatar_owner_uuid((storage.foldername(name))[2]))
  );

-- Group photos ──────────────────────────────────────────────────────────────
drop policy if exists "avatars_group_insert_admin" on storage.objects;
create policy "avatars_group_insert_admin" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and name ~ '^groups/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{32}\.(webp|jpg)$'
    and public.can_edit_group_avatar(public.avatar_owner_uuid((storage.foldername(name))[2]))
    and public.avatar_folder_under_quota('groups/' || (storage.foldername(name))[2] || '/')
  );

drop policy if exists "avatars_group_delete_admin" on storage.objects;
create policy "avatars_group_delete_admin" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'groups'
    and public.can_edit_group_avatar(public.avatar_owner_uuid((storage.foldername(name))[2]))
  );

drop policy if exists "avatars_group_select_member" on storage.objects;
create policy "avatars_group_select_member" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'groups'
    and public.can_view_group_avatar(public.avatar_owner_uuid((storage.foldername(name))[2]))
  );

-- ── 7. Deletion cleanup ─────────────────────────────────────────────────────
-- When a profile or a group is deleted, its avatar references go with it. The
-- client removes the object itself first (it is the only party that can call the
-- Storage API), so this is the backstop for the cases where it could not: a
-- failed request, a deletion performed from the dashboard, a cascade from
-- auth.users.
--
-- IMPORTANT: removing the storage.objects row revokes all access to the object
-- and drops the reference, but the file in the storage backend is only reclaimed
-- through the Storage API. See docs/OPERATIONS.md for the sweep.
create or replace function public.cleanup_avatar_storage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from storage.objects
   where bucket_id = 'avatars'
     and name like (tg_argv[0] || '/' || old.id::text || '/%');
  return old;
end;
$$;

drop trigger if exists profiles_avatar_cleanup on public.profiles;
create trigger profiles_avatar_cleanup
  before delete on public.profiles
  for each row execute function public.cleanup_avatar_storage('profiles');

drop trigger if exists groups_avatar_cleanup on public.groups;
create trigger groups_avatar_cleanup
  before delete on public.groups
  for each row execute function public.cleanup_avatar_storage('groups');

-- ── 8. Grants ───────────────────────────────────────────────────────────────
-- New functions are not exposed by default (see the explicit Data API grants
-- migration). Only get_profile_avatars is an RPC the client calls; the three
-- predicates are needed by `authenticated` because storage policies are
-- evaluated as that role, and the trigger function is never called directly.
revoke all on function public.get_profile_avatars(uuid[]) from public, anon, authenticated;
grant execute on function public.get_profile_avatars(uuid[]) to authenticated;
grant execute on function public.get_profile_avatars(uuid[]) to service_role;

revoke all on function public.can_view_profile_avatar(uuid) from public, anon, authenticated;
revoke all on function public.can_view_group_avatar(uuid) from public, anon, authenticated;
revoke all on function public.can_edit_group_avatar(uuid) from public, anon, authenticated;
revoke all on function public.avatar_owner_uuid(text) from public, anon, authenticated;
revoke all on function public.avatar_folder_under_quota(text) from public, anon, authenticated;
grant execute on function public.can_view_profile_avatar(uuid) to authenticated, service_role;
grant execute on function public.can_view_group_avatar(uuid) to authenticated, service_role;
grant execute on function public.can_edit_group_avatar(uuid) to authenticated, service_role;
grant execute on function public.avatar_owner_uuid(text) to authenticated, service_role;
grant execute on function public.avatar_folder_under_quota(text) to authenticated, service_role;

revoke all on function public.cleanup_avatar_storage() from public, anon, authenticated;
grant execute on function public.cleanup_avatar_storage() to service_role;
