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
create table community_prayers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references auth.users(id),
  author_name text,
  title text not null,
  description text,
  is_anonymous boolean default false,
  category_ids uuid[] default '{}',
  prayer_points jsonb[] default '{}',
  created_at timestamptz default now()
);

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
