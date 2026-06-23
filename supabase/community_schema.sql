-- ── Groups ──────────────────────────────────────────────────────────────────
create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ── Group members ─────────────────────────────────────────────────────────────
create table group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- ── Community prayers ─────────────────────────────────────────────────────────
-- source_prayer_id links a shared community prayer back to the personal prayer
-- it originated from (null when authored directly in the group). A single
-- personal prayer can have one community row per group it is shared to.
create table community_prayers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references auth.users(id),
  author_name text,
  title text not null,
  description text,
  is_anonymous boolean default false,
  is_answered boolean default false,
  category_ids uuid[] default '{}',
  prayer_points jsonb[] default '{}',
  source_prayer_id uuid references prayers(id) on delete cascade,
  created_at timestamptz default now(),
  unique (group_id, source_prayer_id)
);
create index idx_community_prayers_source on community_prayers(source_prayer_id);

-- ── Member updates on community prayers ───────────────────────────────────────
create table community_updates (
  id uuid primary key default gen_random_uuid(),
  community_prayer_id uuid references community_prayers(id) on delete cascade,
  user_id uuid references auth.users(id),
  author_name text,
  text text not null,
  is_anonymous boolean default false,
  created_at timestamptz default now()
);

-- ── "I'm praying" reactions ───────────────────────────────────────────────────
create table prayer_reactions (
  community_prayer_id uuid references community_prayers(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (community_prayer_id, user_id)
);

-- ── Testimonies ───────────────────────────────────────────────────────────────
create table testimonies (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references auth.users(id),
  author_name text,
  content text not null,
  is_anonymous boolean default false,
  community_prayer_id uuid references community_prayers(id) on delete set null,
  created_at timestamptz default now()
);

-- ── Helper functions ──────────────────────────────────────────────────────────

-- Avoids RLS recursion: security definer bypasses RLS on group_members
create or replace function get_my_group_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select group_id from group_members where user_id = auth.uid()
$$;

-- Atomically creates a group + adds creator as admin.
-- Runs as security definer so it can INSERT into both tables without
-- hitting the SELECT RLS chicken-and-egg (you can't be a member before the group exists).
create or replace function create_group_with_member(
  p_name text,
  p_invite_code text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_group_id uuid;
begin
  insert into groups (name, invite_code, created_by)
  values (p_name, p_invite_code, p_user_id)
  returning id into v_group_id;

  insert into group_members (group_id, user_id, role)
  values (v_group_id, p_user_id, 'admin');
end;
$$;

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table groups enable row level security;
alter table group_members enable row level security;
alter table community_prayers enable row level security;
alter table community_updates enable row level security;
alter table prayer_reactions enable row level security;
alter table testimonies enable row level security;

-- groups: visible only to members
create policy "Members can read their groups" on groups
  for select using (id in (select get_my_group_ids()));
create policy "Authenticated users can create groups" on groups
  for insert with check (auth.uid() is not null);

-- group_members: uses the function to avoid self-reference recursion
create policy "Members can see group members" on group_members
  for select using (group_id in (select get_my_group_ids()));
create policy "Users can join groups" on group_members
  for insert with check (user_id = auth.uid());
create policy "Users can leave groups" on group_members
  for delete using (user_id = auth.uid());
-- Admins can remove other members (defined after get_my_admin_group_ids below).

-- community_prayers: group members only
create policy "Group members can read prayers" on community_prayers
  for select using (group_id in (select get_my_group_ids()));
create policy "Group members can post prayers" on community_prayers
  for insert with check (
    group_id in (select get_my_group_ids()) and user_id = auth.uid()
  );

-- Returns group IDs where the current user is an admin (security definer avoids RLS recursion)
create or replace function get_my_admin_group_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select group_id from group_members where user_id = auth.uid() and role = 'admin'
$$;

-- Admins can remove members from groups they administer (but not themselves here).
create policy "Admins can remove members" on group_members
  for delete using (
    group_id in (select get_my_admin_group_ids()) and user_id <> auth.uid()
  );

create policy "Authors and admins can update prayers" on community_prayers
  for update using (
    user_id = auth.uid() or group_id in (select get_my_admin_group_ids())
  )
  with check (
    group_id in (select get_my_group_ids()) and (
      user_id = auth.uid() or group_id in (select get_my_admin_group_ids())
    )
  );
create policy "Authors and admins can delete prayers" on community_prayers
  for delete using (
    user_id = auth.uid() or group_id in (select get_my_admin_group_ids())
  );

-- community_updates: group members only
create policy "Group members can read updates" on community_updates
  for select using (
    community_prayer_id in (
      select id from community_prayers where group_id in (select get_my_group_ids())
    )
  );
create policy "Group members can add updates" on community_updates
  for insert with check (
    community_prayer_id in (
      select id from community_prayers where group_id in (select get_my_group_ids())
    )
    and user_id = auth.uid()
  );

-- prayer_reactions: group members only
create policy "Group members can see reactions" on prayer_reactions
  for select using (
    community_prayer_id in (
      select id from community_prayers where group_id in (select get_my_group_ids())
    )
  );
create policy "Group members can react" on prayer_reactions
  for insert with check (
    community_prayer_id in (
      select id from community_prayers where group_id in (select get_my_group_ids())
    )
    and user_id = auth.uid()
  );
create policy "Users can remove their own reactions" on prayer_reactions
  for delete using (user_id = auth.uid());

-- testimonies: group members only
create policy "Group members can read testimonies" on testimonies
  for select using (group_id in (select get_my_group_ids()));
create policy "Group members can post testimonies" on testimonies
  for insert with check (
    group_id in (select get_my_group_ids()) and user_id = auth.uid()
  );

-- ── Profiles (display names for community features) ───────────────────────────
-- Mirrors auth.users so the client can show names without touching auth.users.
-- Email is NOT stored here; lookups by email go through find_user_by_email().
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- Any authenticated user can read display names (needed to render friends,
-- members, requesters). No sensitive data lives here.
create policy "Authenticated can read profiles" on profiles
  for select using (auth.role() = 'authenticated');
create policy "Users can upsert their own profile" on profiles
  for insert with check (id = auth.uid());
create policy "Users can update their own profile" on profiles
  for update using (id = auth.uid());

-- Auto-create a profile row whenever a user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
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

-- Look up a user id by exact email. Security definer so it can read auth.users
-- without exposing the whole table to clients. Returns null if not found.
create or replace function find_user_by_email(p_email text)
returns uuid
language plpgsql
security definer
as $$
declare
  found_id uuid;
begin
  select id into found_id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  return found_id;
end;
$$;

-- ── Friendships ──────────────────────────────────────────────────────────────
create table friendships (
  user_id uuid references auth.users(id) on delete cascade,
  friend_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, friend_id),
  check (user_id < friend_id)
);

-- ── Friend requests ──────────────────────────────────────────────────────────
create table friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references auth.users(id) on delete cascade,
  to_user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (from_user_id, to_user_id),
  check (from_user_id != to_user_id)
);

-- ── Group invitations ────────────────────────────────────────────────────────
create table group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  invited_user_id uuid references auth.users(id) on delete cascade,
  invited_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique (group_id, invited_user_id)
);

alter table friendships enable row level security;
alter table friend_requests enable row level security;
alter table group_invitations enable row level security;

-- friendships: users can see their own friendships
create policy "Users can read their friendships" on friendships
  for select using (user_id = auth.uid() or friend_id = auth.uid());
create policy "Users can create friendships" on friendships
  for insert with check (user_id = auth.uid() or friend_id = auth.uid());
create policy "Users can remove friendships" on friendships
  for delete using (user_id = auth.uid() or friend_id = auth.uid());

-- friend_requests: users can manage their own requests
create policy "Users can read friend requests" on friend_requests
  for select using (from_user_id = auth.uid() or to_user_id = auth.uid());
create policy "Users can send friend requests" on friend_requests
  for insert with check (from_user_id = auth.uid());
create policy "Users can delete friend requests" on friend_requests
  for delete using (from_user_id = auth.uid() or to_user_id = auth.uid());

-- group_invitations: group admins can invite, invitees can see their invitations.
-- Uses get_my_admin_group_ids() (security definer) to avoid RLS recursion.
create policy "Admins and invitees can see invitations" on group_invitations
  for select using (
    group_id in (select get_my_admin_group_ids()) or invited_user_id = auth.uid()
  );
create policy "Admins can send invitations" on group_invitations
  for insert with check (group_id in (select get_my_admin_group_ids()));
create policy "Users can delete invitations to them" on group_invitations
  for delete using (invited_user_id = auth.uid());
create policy "Admins can delete invitations" on group_invitations
  for delete using (group_id in (select get_my_admin_group_ids()));

-- Allow an invited user to join the group when accepting an invitation.
-- The base "Users can join groups" policy already permits user_id = auth.uid()
-- inserts, so no extra policy is needed for acceptGroupInvitation().

-- ── Migrations for existing databases ─────────────────────────────────────────
-- Run these if community_prayers was created before the sharing feature.
alter table community_prayers add column if not exists is_answered boolean default false;
alter table community_prayers add column if not exists source_prayer_id uuid references prayers(id) on delete cascade;
create index if not exists idx_community_prayers_source on community_prayers(source_prayer_id);
-- One community copy per (group, source prayer); ignored if it already exists.
do $$
begin
  alter table community_prayers add constraint community_prayers_group_source_unique unique (group_id, source_prayer_id);
exception
  when duplicate_table then null;
  when duplicate_object then null;
end $$;

-- Provenance: a personal prayer can be a saved copy of a community prayer.
-- Used to dedupe "Add to my prayers" and show the already-saved state.
alter table prayers add column if not exists community_origin_id uuid references community_prayers(id) on delete set null;
-- Original request author carried over when saving a community prayer, so the
-- personal list can credit the author (or show "anonymous").
alter table prayers add column if not exists origin_author_name text;
alter table prayers add column if not exists origin_is_anonymous boolean default false;

-- Per-member group preferences (kept separate from group_members so a user
-- can't escalate their own role via an UPDATE). auto_add = automatically copy
-- this group's new requests into the member's personal prayer list.
create table if not exists group_member_prefs (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  auto_add boolean default false,
  primary key (group_id, user_id)
);
alter table group_member_prefs enable row level security;
do $$
begin
  create policy "Users manage own group prefs" on group_member_prefs
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null;
end $$;

-- Personal updates can now carry author info so updates that originate from a
-- group (added by another member) display correctly on the owner's side.
alter table prayer_updates add column if not exists author_name text;
alter table prayer_updates add column if not exists is_anonymous boolean default false;

-- ── Two-way sync for shared prayers ───────────────────────────────────────────
-- A shared personal prayer and its community copies keep one set of updates and
-- prayer points. These security-definer RPCs write to the source prayer AND
-- fan out to every community copy, so an add from either side appears on both.
-- Allowed for the prayer owner or any member of a group it is shared to.

create or replace function can_sync_prayer(p_source uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from prayers where id = p_source and user_id = auth.uid())
      or exists (
        select 1 from community_prayers cp
        join group_members gm on gm.group_id = cp.group_id
        where cp.source_prayer_id = p_source and gm.user_id = auth.uid()
      );
$$;

create or replace function sync_add_update(p_source uuid, p_text text, p_author text, p_anon boolean)
returns prayer_updates
language plpgsql
security definer
as $$
declare
  new_row prayer_updates;
begin
  if not can_sync_prayer(p_source) then
    raise exception 'not allowed to update this prayer';
  end if;

  insert into prayer_updates (prayer_id, text, author_name, is_anonymous)
  values (p_source, p_text, p_author, p_anon)
  returning * into new_row;

  insert into community_updates (community_prayer_id, user_id, author_name, text, is_anonymous)
  select id, auth.uid(), p_author, p_text, p_anon
  from community_prayers where source_prayer_id = p_source;

  return new_row;
end;
$$;

create or replace function sync_add_point(p_source uuid, p_title text, p_verses jsonb)
returns prayer_points
language plpgsql
security definer
as $$
declare
  new_row prayer_points;
  point_json jsonb;
begin
  if not can_sync_prayer(p_source) then
    raise exception 'not allowed to update this prayer';
  end if;

  insert into prayer_points (prayer_id, title, verses)
  values (p_source, p_title, coalesce(p_verses, '[]'::jsonb))
  returning * into new_row;

  -- Append the same point (sharing the personal row id) to each community copy.
  point_json := jsonb_build_object('id', new_row.id, 'title', p_title, 'verses', coalesce(p_verses, '[]'::jsonb));
  update community_prayers
  set prayer_points = array_append(prayer_points, point_json)
  where source_prayer_id = p_source;

  return new_row;
end;
$$;

-- Remove a prayer point from the source prayer and every community copy.
create or replace function sync_remove_point(p_source uuid, p_point_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if not can_sync_prayer(p_source) then
    raise exception 'not allowed to update this prayer';
  end if;

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

-- Add a verse {ref, text} to a point on the source prayer and every copy.
create or replace function sync_add_verse(p_source uuid, p_point_id uuid, p_verse jsonb)
returns void
language plpgsql
security definer
as $$
begin
  if not can_sync_prayer(p_source) then
    raise exception 'not allowed to update this prayer';
  end if;

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

-- Remove a verse (matched by ref) from a point on the source prayer and copies.
create or replace function sync_remove_verse(p_source uuid, p_point_id uuid, p_verse_ref text)
returns void
language plpgsql
security definer
as $$
begin
  if not can_sync_prayer(p_source) then
    raise exception 'not allowed to update this prayer';
  end if;

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
