-- ============================================================================
--  Consolidated migration — community social, prayer sharing & two-way sync.
--
--  Idempotent: safe to run top-to-bottom any number of times.
--  Run in the Supabase SQL editor.
--
--  Assumes the base community schema is already applied (groups, group_members,
--  community_prayers, community_updates, prayer_reactions, testimonies, and the
--  helper functions get_my_group_ids() / get_my_admin_group_ids() from
--  community_schema.sql). This file only adds what the later features need.
-- ============================================================================


-- ── Profiles (display names for community features) ──────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz default now()
);
alter table profiles enable row level security;

drop policy if exists "Authenticated can read profiles" on profiles;
create policy "Authenticated can read profiles" on profiles
  for select using (auth.role() = 'authenticated');
drop policy if exists "Users can upsert their own profile" on profiles;
create policy "Users can upsert their own profile" on profiles
  for insert with check (id = auth.uid());
drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile" on profiles
  for update using (id = auth.uid());

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill profiles for users who already exist.
insert into profiles (id, full_name)
select id, coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;

-- Look up a user id by exact email (security definer; returns null if not found).
create or replace function find_user_by_email(p_email text)
returns uuid language plpgsql security definer as $$
declare found_id uuid;
begin
  select id into found_id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  return found_id;
end;
$$;


-- ── Friendships ──────────────────────────────────────────────────────────────
create table if not exists friendships (
  user_id uuid references auth.users(id) on delete cascade,
  friend_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, friend_id),
  check (user_id < friend_id)
);
alter table friendships enable row level security;
drop policy if exists "Users can read their friendships" on friendships;
create policy "Users can read their friendships" on friendships
  for select using (user_id = auth.uid() or friend_id = auth.uid());
drop policy if exists "Users can create friendships" on friendships;
create policy "Users can create friendships" on friendships
  for insert with check (user_id = auth.uid() or friend_id = auth.uid());
drop policy if exists "Users can remove friendships" on friendships;
create policy "Users can remove friendships" on friendships
  for delete using (user_id = auth.uid() or friend_id = auth.uid());


-- ── Friend requests ──────────────────────────────────────────────────────────
create table if not exists friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references auth.users(id) on delete cascade,
  to_user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (from_user_id, to_user_id),
  check (from_user_id != to_user_id)
);
alter table friend_requests enable row level security;
drop policy if exists "Users can read friend requests" on friend_requests;
create policy "Users can read friend requests" on friend_requests
  for select using (from_user_id = auth.uid() or to_user_id = auth.uid());
drop policy if exists "Users can send friend requests" on friend_requests;
create policy "Users can send friend requests" on friend_requests
  for insert with check (from_user_id = auth.uid());
drop policy if exists "Users can delete friend requests" on friend_requests;
create policy "Users can delete friend requests" on friend_requests
  for delete using (from_user_id = auth.uid() or to_user_id = auth.uid());


-- ── Group invitations ────────────────────────────────────────────────────────
create table if not exists group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  invited_user_id uuid references auth.users(id) on delete cascade,
  invited_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique (group_id, invited_user_id)
);
alter table group_invitations enable row level security;
drop policy if exists "Admins and invitees can see invitations" on group_invitations;
create policy "Admins and invitees can see invitations" on group_invitations
  for select using (group_id in (select get_my_admin_group_ids()) or invited_user_id = auth.uid());
drop policy if exists "Admins can send invitations" on group_invitations;
create policy "Admins can send invitations" on group_invitations
  for insert with check (group_id in (select get_my_admin_group_ids()));
drop policy if exists "Users can delete invitations to them" on group_invitations;
create policy "Users can delete invitations to them" on group_invitations
  for delete using (invited_user_id = auth.uid());
drop policy if exists "Admins can delete invitations" on group_invitations;
create policy "Admins can delete invitations" on group_invitations
  for delete using (group_id in (select get_my_admin_group_ids()));


-- ── Admins can remove other members ──────────────────────────────────────────
drop policy if exists "Admins can remove members" on group_members;
create policy "Admins can remove members" on group_members
  for delete using (
    group_id in (select get_my_admin_group_ids()) and user_id <> auth.uid()
  );


-- ── community_prayers: sharing + answered status ─────────────────────────────
alter table community_prayers add column if not exists is_answered boolean default false;
alter table community_prayers add column if not exists source_prayer_id uuid references prayers(id) on delete cascade;
create index if not exists idx_community_prayers_source on community_prayers(source_prayer_id);
do $$
begin
  alter table community_prayers add constraint community_prayers_group_source_unique unique (group_id, source_prayer_id);
exception when duplicate_table then null; when duplicate_object then null;
end $$;


-- ── prayers: community provenance ────────────────────────────────────────────
alter table prayers add column if not exists community_origin_id uuid references community_prayers(id) on delete set null;
alter table prayers add column if not exists origin_author_name text;
alter table prayers add column if not exists origin_is_anonymous boolean default false;
alter table prayers add column if not exists origin_group_name text;
-- Accumulating testimonies for a personal prayer (like community testimonies),
-- so previous ones are kept across resume / re-answer. Each: { id, content, created_at }.
alter table prayers add column if not exists testimonies jsonb[] default '{}';


-- ── prayer_updates: author info (for group-originated updates) ───────────────
alter table prayer_updates add column if not exists author_name text;
alter table prayer_updates add column if not exists is_anonymous boolean default false;


-- ── Per-member group preferences (auto-add) ──────────────────────────────────
create table if not exists group_member_prefs (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  auto_add boolean default false,
  primary key (group_id, user_id)
);
alter table group_member_prefs enable row level security;
drop policy if exists "Users manage own group prefs" on group_member_prefs;
create policy "Users manage own group prefs" on group_member_prefs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ── Two-way sync for shared prayers ──────────────────────────────────────────
-- Writes go to the source prayer AND fan out to every community copy.
-- Allowed for the prayer owner or any member of a group it is shared to.

create or replace function can_sync_prayer(p_source uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from prayers where id = p_source and user_id = auth.uid())
      or exists (
        select 1 from community_prayers cp
        join group_members gm on gm.group_id = cp.group_id
        where cp.source_prayer_id = p_source and gm.user_id = auth.uid()
      );
$$;

create or replace function sync_add_update(p_source uuid, p_text text, p_author text, p_anon boolean)
returns prayer_updates language plpgsql security definer as $$
declare new_row prayer_updates;
begin
  if not can_sync_prayer(p_source) then raise exception 'not allowed to update this prayer'; end if;
  insert into prayer_updates (prayer_id, text, author_name, is_anonymous)
  values (p_source, p_text, p_author, p_anon) returning * into new_row;
  insert into community_updates (community_prayer_id, user_id, author_name, text, is_anonymous)
  select id, auth.uid(), p_author, p_text, p_anon from community_prayers where source_prayer_id = p_source;
  return new_row;
end;
$$;

create or replace function sync_add_point(p_source uuid, p_title text, p_verses jsonb)
returns prayer_points language plpgsql security definer as $$
declare new_row prayer_points; point_json jsonb;
begin
  if not can_sync_prayer(p_source) then raise exception 'not allowed to update this prayer'; end if;
  insert into prayer_points (prayer_id, title, verses)
  values (p_source, p_title, coalesce(p_verses, '[]'::jsonb)) returning * into new_row;
  point_json := jsonb_build_object('id', new_row.id, 'title', p_title, 'verses', coalesce(p_verses, '[]'::jsonb));
  update community_prayers set prayer_points = array_append(prayer_points, point_json)
  where source_prayer_id = p_source;
  return new_row;
end;
$$;

create or replace function sync_remove_point(p_source uuid, p_point_id uuid)
returns void language plpgsql security definer as $$
begin
  if not can_sync_prayer(p_source) then raise exception 'not allowed to update this prayer'; end if;
  delete from prayer_points where id = p_point_id and prayer_id = p_source;
  update community_prayers
  set prayer_points = (
    select coalesce(array_agg(elem), '{}')
    from unnest(prayer_points) elem
    where elem->>'id' <> p_point_id::text
  )
  where source_prayer_id = p_source;
end;
$$;

create or replace function sync_add_verse(p_source uuid, p_point_id uuid, p_verse jsonb)
returns void language plpgsql security definer as $$
begin
  if not can_sync_prayer(p_source) then raise exception 'not allowed to update this prayer'; end if;
  update prayer_points
  set verses = coalesce(verses, '[]'::jsonb) || jsonb_build_array(p_verse)
  where id = p_point_id and prayer_id = p_source;
  update community_prayers
  set prayer_points = (
    select coalesce(array_agg(
      case when elem->>'id' = p_point_id::text
        then jsonb_set(elem, '{verses}', coalesce(elem->'verses', '[]'::jsonb) || jsonb_build_array(p_verse))
        else elem end
    ), '{}')
    from unnest(prayer_points) elem
  )
  where source_prayer_id = p_source;
end;
$$;

create or replace function sync_remove_verse(p_source uuid, p_point_id uuid, p_verse_ref text)
returns void language plpgsql security definer as $$
begin
  if not can_sync_prayer(p_source) then raise exception 'not allowed to update this prayer'; end if;
  update prayer_points
  set verses = (
    select coalesce(jsonb_agg(v), '[]'::jsonb)
    from jsonb_array_elements(coalesce(verses, '[]'::jsonb)) v
    where v->>'ref' <> p_verse_ref
  )
  where id = p_point_id and prayer_id = p_source;
  update community_prayers
  set prayer_points = (
    select coalesce(array_agg(
      case when elem->>'id' = p_point_id::text
        then jsonb_set(elem, '{verses}', (
          select coalesce(jsonb_agg(v), '[]'::jsonb)
          from jsonb_array_elements(coalesce(elem->'verses', '[]'::jsonb)) v
          where v->>'ref' <> p_verse_ref
        ))
        else elem end
    ), '{}')
    from unnest(prayer_points) elem
  )
  where source_prayer_id = p_source;
end;
$$;


-- ── Realtime: publish tables that drive live UI (nav badge + prayer wall) ────
-- Adds tables to the supabase_realtime publication (no-op if already present).
do $$
begin
  alter publication supabase_realtime add table community_prayers;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table friend_requests;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table group_invitations;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table prayer_reactions;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table community_updates;
exception when duplicate_object then null; end $$;


-- ── One-time backfill for data created before sync existed ───────────────────
-- Copy each shared prayer's current points into its existing community copies.
update community_prayers cp
set prayer_points = coalesce((
  select array_agg(jsonb_build_object('id', pp.id, 'title', pp.title, 'verses', coalesce(pp.verses, '[]'::jsonb)))
  from prayer_points pp
  where pp.prayer_id = cp.source_prayer_id
), '{}')
where cp.source_prayer_id is not null;

-- Copy existing personal updates into shared copies that have none yet.
insert into community_updates (community_prayer_id, user_id, author_name, text, is_anonymous)
select cp.id, cp.user_id, coalesce(pu.author_name, cp.author_name), pu.text, coalesce(pu.is_anonymous, false)
from community_prayers cp
join prayer_updates pu on pu.prayer_id = cp.source_prayer_id
where cp.source_prayer_id is not null
  and not exists (select 1 from community_updates cu where cu.community_prayer_id = cp.id);
