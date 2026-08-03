-- Deterministic baseline assembled from the legacy hand-applied SQL files.
-- Environment-specific secrets, seed data, audit queries, and test fixtures are intentionally excluded.

-- BEGIN LEGACY FILE: supabase/_migrations_tracking.sql
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Schema-migration tracking.  RUN THIS FIRST (once per environment).
--
-- The problem this solves: the 40+ SQL files in this folder are applied by hand
-- in the Supabase SQL editor, and "which ones are live in prod" has been tracked
-- only in a developer's head / notes. This table makes prod state *queryable
-- from the database itself* â€” the single source of truth, not memory.
--
-- Convention going forward: every migration file ends with a self-recording
-- footer (copy the template at the bottom of this file), so running it also
-- stamps this table. To see what's applied in an environment:
--
--     select filename, applied_at, note from public.schema_migrations
--     order by applied_at;
--
-- Then diff that list against docs/DEPLOY.md (the authoritative repo checklist)
-- to find anything not yet applied here.
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create table if not exists public.schema_migrations (
  filename    text primary key,       -- e.g. 'content_language.sql'
  applied_at  timestamptz not null default now(),
  note        text                     -- optional: 'backfilled', PR link, etc.
);

comment on table public.schema_migrations is
  'One row per applied supabase/*.sql migration. Source of truth for what is live in this environment. See docs/DEPLOY.md.';

-- Metadata only â€” no anon/authenticated access. RLS on with no policies means
-- the table is invisible to app users; the service role (SQL editor, Edge
-- Functions) bypasses RLS and can read/write it.
alter table public.schema_migrations enable row level security;

-- â”€â”€ One-time backfill â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- If some migrations are already applied in this environment, record them so the
-- table reflects reality from day one. Uncomment and keep ONLY the files that are
-- genuinely already live here (see docs/DEPLOY.md for the full list), then run:
--
--   insert into public.schema_migrations (filename, note) values
--     ('community_schema.sql', 'backfilled'),
--     ('migration.sql',        'backfilled'),
--     ('e2ee_migration.sql',   'backfilled')
--     -- â€¦add every file already applied in this environmentâ€¦
--   on conflict (filename) do nothing;

-- â”€â”€ Footer template (paste at the end of each migration file) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
--   insert into public.schema_migrations (filename)
--   values ('THIS_FILE_NAME.sql')
--   on conflict (filename) do nothing;

insert into public.schema_migrations (filename)
values ('_migrations_tracking.sql')
on conflict (filename) do nothing;

-- END LEGACY FILE: supabase/_migrations_tracking.sql

-- BEGIN LEGACY FILE: supabase_schema.sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Categories
create table categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  emoji text default 'ðŸ™',
  color text default '#4f46e5',
  week_days integer[] default '{}',
  created_at timestamptz default now()
);

-- Prayers
create table prayers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text default '',
  category_id uuid references categories(id) on delete set null,
  status text default 'active' check (status in ('active', 'answered')),
  for_other boolean default false,
  person_name text default '',
  phone text default '',
  testimony text default '',
  answered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Prayer updates (Ã©volutions)
create table prayer_updates (
  id uuid primary key default uuid_generate_v4(),
  prayer_id uuid references prayers(id) on delete cascade not null,
  text text not null,
  created_at timestamptz default now()
);

-- Prayer points (sujets IA)
create table prayer_points (
  id uuid primary key default uuid_generate_v4(),
  prayer_id uuid references prayers(id) on delete cascade not null,
  title text not null,
  verses jsonb default '[]',      -- [{ref: string, text: string}]
  -- legacy columns kept for backward compat, use `verses` for new rows
  verse text default '',
  verse_text text default '',
  created_at timestamptz default now()
);

-- Migration: run once on existing databases to add the verses column
-- alter table prayer_points add column if not exists verses jsonb default '[]';
-- update prayer_points set verses = jsonb_build_array(jsonb_build_object('ref', verse, 'text', verse_text)) where verse != '' and (verses = '[]' or verses is null);

-- Row Level Security
alter table categories enable row level security;
alter table prayers enable row level security;
alter table prayer_updates enable row level security;
alter table prayer_points enable row level security;

create policy "Users manage own categories" on categories for all using (auth.uid() = user_id);
create policy "Users manage own prayers" on prayers for all using (auth.uid() = user_id);
create policy "Users manage own updates" on prayer_updates for all using (
  prayer_id in (select id from prayers where user_id = auth.uid())
);
create policy "Users manage own points" on prayer_points for all using (
  prayer_id in (select id from prayers where user_id = auth.uid())
);

-- Feedback
create table feedback (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  user_id uuid references auth.users(id) on delete set null,
  name text,
  email text,
  type text default 'general' check (type in ('general', 'feature', 'bug')),
  message text not null,
  lang text default 'fr'
);

alter table feedback enable row level security;
create policy "Anyone can insert feedback" on feedback for insert with check (true);
create policy "Admins read feedback" on feedback for select using (false);

-- END LEGACY FILE: supabase_schema.sql

-- BEGIN LEGACY FILE: supabase_migration_multicategory.sql
-- Remove old single category column
alter table prayers drop column if exists category_id;

-- Junction table for many-to-many
create table prayer_categories (
  prayer_id uuid references prayers(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade not null,
  primary key (prayer_id, category_id)
);

alter table prayer_categories enable row level security;

create policy "Users manage own prayer_categories" on prayer_categories for all using (
  prayer_id in (select id from prayers where user_id = auth.uid())
);

-- END LEGACY FILE: supabase_migration_multicategory.sql

-- BEGIN LEGACY FILE: supabase/community_schema.sql
-- â”€â”€ Groups â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- â”€â”€ Group members â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- â”€â”€ Community prayers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Member updates on community prayers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table community_updates (
  id uuid primary key default gen_random_uuid(),
  community_prayer_id uuid references community_prayers(id) on delete cascade,
  user_id uuid references auth.users(id),
  author_name text,
  text text not null,
  is_anonymous boolean default false,
  created_at timestamptz default now()
);

-- â”€â”€ "I'm praying" reactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table prayer_reactions (
  community_prayer_id uuid references community_prayers(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (community_prayer_id, user_id)
);

-- â”€â”€ Testimonies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Helper functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

-- â”€â”€ Row Level Security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
-- Authors (and group admins) can delete a word â€” get_my_admin_group_ids is
-- defined earlier and is SECURITY DEFINER, so it won't recurse on RLS.
create policy "Authors and admins can delete updates" on community_updates
  for delete using (
    user_id = auth.uid()
    or community_prayer_id in (
      select id from community_prayers where group_id in (select get_my_admin_group_ids())
    )
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

-- â”€â”€ Profiles (display names for community features) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- Auto-create a profile row whenever a user signs up. SECURITY DEFINER with a
-- pinned search_path and fully-qualified table (an unqualified insert here can
-- break signup with "Database error saving new user"); the profile mirror is
-- non-blocking so it can never take down authentication.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
exception when others then
  raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
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

-- â”€â”€ Friendships â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table friendships (
  user_id uuid references auth.users(id) on delete cascade,
  friend_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, friend_id),
  check (user_id < friend_id)
);

-- â”€â”€ Friend requests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references auth.users(id) on delete cascade,
  to_user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (from_user_id, to_user_id),
  check (from_user_id != to_user_id)
);

-- â”€â”€ Group invitations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Migrations for existing databases â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
alter table prayers add column if not exists origin_group_name text;
alter table prayers add column if not exists testimonies jsonb[] default '{}';
alter table prayers add column if not exists week_days int[] default '{}';
alter table categories add column if not exists sort_order int;

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

-- â”€â”€ Two-way sync for shared prayers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- END LEGACY FILE: supabase/community_schema.sql

-- BEGIN LEGACY FILE: supabase/migration.sql
-- ============================================================================
--  Consolidated migration â€” community social, prayer sharing & two-way sync.
--
--  Idempotent: safe to run top-to-bottom any number of times.
--  Run in the Supabase SQL editor.
--
--  Assumes the base community schema is already applied (groups, group_members,
--  community_prayers, community_updates, prayer_reactions, testimonies, and the
--  helper functions get_my_group_ids() / get_my_admin_group_ids() from
--  community_schema.sql). This file only adds what the later features need.
-- ============================================================================


-- â”€â”€ Profiles (display names for community features) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- Pinned search_path + qualified table: an unqualified insert under the auth
-- admin role can break signup with "Database error saving new user". Mirror is
-- non-blocking so a profile hiccup can never take down authentication.
create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
exception when others then
  raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
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


-- â”€â”€ Friendships â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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


-- â”€â”€ Friend requests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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


-- â”€â”€ Group invitations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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


-- â”€â”€ Admins can remove other members â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
drop policy if exists "Admins can remove members" on group_members;
create policy "Admins can remove members" on group_members
  for delete using (
    group_id in (select get_my_admin_group_ids()) and user_id <> auth.uid()
  );


-- â”€â”€ community_prayers: sharing + answered status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table community_prayers add column if not exists is_answered boolean default false;
alter table community_prayers add column if not exists source_prayer_id uuid references prayers(id) on delete cascade;
create index if not exists idx_community_prayers_source on community_prayers(source_prayer_id);
do $$
begin
  alter table community_prayers add constraint community_prayers_group_source_unique unique (group_id, source_prayer_id);
exception when duplicate_table then null; when duplicate_object then null;
end $$;


-- â”€â”€ prayers: community provenance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table prayers add column if not exists community_origin_id uuid references community_prayers(id) on delete set null;
alter table prayers add column if not exists origin_author_name text;
alter table prayers add column if not exists origin_is_anonymous boolean default false;
alter table prayers add column if not exists origin_group_name text;
-- Accumulating testimonies for a personal prayer (like community testimonies),
-- so previous ones are kept across resume / re-answer. Each: { id, content, created_at }.
alter table prayers add column if not exists testimonies jsonb[] default '{}';
-- Optional per-prayer schedule (weekday indices 0-6). When set, overrides the
-- category-based schedule for deciding which days the prayer appears.
alter table prayers add column if not exists week_days int[] default '{}';
-- Manual ordering of categories (lower = first). Null falls back to created order.
alter table categories add column if not exists sort_order int;


-- â”€â”€ prayer_updates: author info (for group-originated updates) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table prayer_updates add column if not exists author_name text;
alter table prayer_updates add column if not exists is_anonymous boolean default false;


-- â”€â”€ Per-member group preferences (auto-add) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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


-- â”€â”€ Two-way sync for shared prayers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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


-- â”€â”€ Realtime: publish tables that drive live UI (nav badge + prayer wall) â”€â”€â”€â”€
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


-- â”€â”€ One-time backfill for data created before sync existed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- END LEGACY FILE: supabase/migration.sql

-- BEGIN LEGACY FILE: supabase/shared_prayer_sync.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Fully shared prayers: a saved copy (prayers.community_origin_id) is now a
-- first-class participant. Edits to prayer points/verses from ANY participant
-- (author or a member's saved copy) fan out to the author's prayer and every
-- group copy. Run in the Supabase SQL editor.
--
-- Mechanism: the sync_* functions resolve the canonical "source" prayer from
-- whatever prayer id is passed (a member copy â†’ its community prayer's source),
-- then fan out from there as before. Member copies don't store synced rows â€”
-- they MIRROR the community prayer's content (pulled client-side).
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Opt-in flag: a saved copy only participates in full two-way sharing when the
-- owner turns on "Co-edit". Off (default) = read-only follow.
alter table prayers add column if not exists co_edit boolean default false;

-- Given any participant prayer id, return the canonical source prayer id:
-- a CO-EDITING saved copy resolves to its community prayer's source; anything
-- else (including a follow-only copy) is itself, so its edits stay local.
create or replace function resolve_source_prayer(p_prayer uuid)
returns uuid language sql security definer stable as $$
  select coalesce(
    (select cp.source_prayer_id
       from prayers pr
       join community_prayers cp on cp.id = pr.community_origin_id
      where pr.id = p_prayer and pr.co_edit = true and cp.source_prayer_id is not null
      limit 1),
    p_prayer
  );
$$;

-- Removing points/verses group-wide is limited to the source author or a group
-- admin â€” members can add but not delete shared content.
create or replace function can_remove_shared(p_source uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from prayers where id = p_source and user_id = auth.uid())
      or exists (
        select 1 from community_prayers cp
        join group_members gm on gm.group_id = cp.group_id
        where cp.source_prayer_id = p_source and gm.user_id = auth.uid() and gm.role = 'admin'
      );
$$;

create or replace function sync_add_point(p_id uuid, p_source uuid, p_title text, p_verses jsonb)
returns prayer_points language plpgsql security definer as $$
declare v_source uuid := resolve_source_prayer(p_source); new_row prayer_points; point_json jsonb;
begin
  if not can_sync_prayer(v_source) then raise exception 'not allowed to update this prayer'; end if;
  insert into prayer_points (id, prayer_id, title, verses)
  values (p_id, v_source, p_title, coalesce(p_verses, '[]'::jsonb))
  on conflict (id) do nothing;
  select * into new_row from prayer_points where id = p_id;
  point_json := jsonb_build_object('id', p_id, 'title', p_title, 'verses', coalesce(p_verses, '[]'::jsonb));
  update community_prayers set prayer_points = array_append(prayer_points, point_json)
  where source_prayer_id = v_source
    and not exists (select 1 from unnest(prayer_points) e where e->>'id' = p_id::text);
  return new_row;
end;
$$;

create or replace function sync_remove_point(p_source uuid, p_point_id uuid)
returns void language plpgsql security definer as $$
declare v_source uuid := resolve_source_prayer(p_source);
begin
  if not can_remove_shared(v_source) then raise exception 'not allowed to remove from this prayer'; end if;
  delete from prayer_points where id = p_point_id and prayer_id = v_source;
  update community_prayers set prayer_points = (
    select coalesce(array_agg(elem), '{}') from unnest(prayer_points) elem where elem->>'id' <> p_point_id::text
  )
  where source_prayer_id = v_source;
end;
$$;

create or replace function sync_add_verse(p_source uuid, p_point_id uuid, p_verse jsonb)
returns void language plpgsql security definer as $$
declare v_source uuid := resolve_source_prayer(p_source);
begin
  if not can_sync_prayer(v_source) then raise exception 'not allowed to update this prayer'; end if;
  update prayer_points
  set verses = coalesce(verses, '[]'::jsonb) || jsonb_build_array(p_verse)
  where id = p_point_id and prayer_id = v_source
    and not exists (select 1 from jsonb_array_elements(coalesce(verses, '[]'::jsonb)) v where v->>'ref' = p_verse->>'ref');
  update community_prayers set prayer_points = (
    select coalesce(array_agg(
      case when elem->>'id' = p_point_id::text
        and not exists (select 1 from jsonb_array_elements(coalesce(elem->'verses', '[]'::jsonb)) v where v->>'ref' = p_verse->>'ref')
        then jsonb_set(elem, '{verses}', coalesce(elem->'verses', '[]'::jsonb) || jsonb_build_array(p_verse))
        else elem end
    ), '{}')
    from unnest(prayer_points) elem
  )
  where source_prayer_id = v_source;
end;
$$;

create or replace function sync_remove_verse(p_source uuid, p_point_id uuid, p_verse_ref text)
returns void language plpgsql security definer as $$
declare v_source uuid := resolve_source_prayer(p_source);
begin
  if not can_remove_shared(v_source) then raise exception 'not allowed to remove from this prayer'; end if;
  update prayer_points set verses = (
    select coalesce(jsonb_agg(v), '[]'::jsonb) from jsonb_array_elements(coalesce(verses, '[]'::jsonb)) v where v->>'ref' <> p_verse_ref
  )
  where id = p_point_id and prayer_id = v_source;
  update community_prayers set prayer_points = (
    select coalesce(array_agg(
      case when elem->>'id' = p_point_id::text
        then jsonb_set(elem, '{verses}', (
          select coalesce(jsonb_agg(v), '[]'::jsonb) from jsonb_array_elements(coalesce(elem->'verses', '[]'::jsonb)) v where v->>'ref' <> p_verse_ref
        ))
        else elem end
    ), '{}')
    from unnest(prayer_points) elem
  )
  where source_prayer_id = v_source;
end;
$$;

-- END LEGACY FILE: supabase/shared_prayer_sync.sql

-- BEGIN LEGACY FILE: supabase/security_hardening.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Security hardening â€” run in the Supabase SQL editor (idempotent).
-- Addresses:
--   #2  Group join was gated only by a (non-secret) group UUID.
--   #3  Forgeable source_prayer_id let members tamper with others' prayers.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ #2  Joining a group now requires the invite code (server-validated) or a
--        real invitation â€” not just knowing the group's UUID. â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

-- â”€â”€ #3  A shared community prayer may only link to the inserter's OWN personal
--        prayer, closing the path to tampering with another user's prayer via
--        the sync_* RPCs. â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- END LEGACY FILE: supabase/security_hardening.sql

-- BEGIN LEGACY FILE: supabase/offline_client_ids.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Offline support: let sync_add_update / sync_add_point accept a CLIENT-supplied
-- id so an optimistic local row keeps the same id as the eventual server row
-- (no duplicates after refetch), and make all sync_* writes idempotent so a
-- replayed mutation can't double-apply. Run in the Supabase SQL editor.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Drop the previous (no p_id) overloads first â€” otherwise two functions share a
-- name and PostgREST RPC calls fail with PGRST203 ("could not choose candidate").
drop function if exists sync_add_update(uuid, text, text, boolean);
drop function if exists sync_add_point(uuid, text, jsonb);

-- Member update / prayer "word": id supplied by the client; community fan-out
-- rows get a deterministic id so replay is a no-op.
create or replace function sync_add_update(p_id uuid, p_source uuid, p_text text, p_author text, p_anon boolean)
returns prayer_updates language plpgsql security definer as $$
declare new_row prayer_updates;
begin
  if not can_sync_prayer(p_source) then raise exception 'not allowed to update this prayer'; end if;

  insert into prayer_updates (id, prayer_id, text, author_name, is_anonymous)
  values (p_id, p_source, p_text, p_author, p_anon)
  on conflict (id) do nothing;
  select * into new_row from prayer_updates where id = p_id;

  insert into community_updates (id, community_prayer_id, user_id, author_name, text, is_anonymous)
  select md5(p_id::text || cp.id::text)::uuid, cp.id, auth.uid(), p_author, p_text, p_anon
  from community_prayers cp where cp.source_prayer_id = p_source
  on conflict (id) do nothing;

  return new_row;
end;
$$;

-- Prayer point: id supplied by the client; community array append is guarded so
-- a replay doesn't add the point twice.
create or replace function sync_add_point(p_id uuid, p_source uuid, p_title text, p_verses jsonb)
returns prayer_points language plpgsql security definer as $$
declare new_row prayer_points; point_json jsonb;
begin
  if not can_sync_prayer(p_source) then raise exception 'not allowed to update this prayer'; end if;

  insert into prayer_points (id, prayer_id, title, verses)
  values (p_id, p_source, p_title, coalesce(p_verses, '[]'::jsonb))
  on conflict (id) do nothing;
  select * into new_row from prayer_points where id = p_id;

  point_json := jsonb_build_object('id', p_id, 'title', p_title, 'verses', coalesce(p_verses, '[]'::jsonb));
  update community_prayers
  set prayer_points = array_append(prayer_points, point_json)
  where source_prayer_id = p_source
    and not exists (select 1 from unnest(prayer_points) e where e->>'id' = p_id::text);

  return new_row;
end;
$$;

-- Add verse: guard against appending a duplicate ref (idempotent on replay).
create or replace function sync_add_verse(p_source uuid, p_point_id uuid, p_verse jsonb)
returns void language plpgsql security definer as $$
begin
  if not can_sync_prayer(p_source) then raise exception 'not allowed to update this prayer'; end if;

  update prayer_points
  set verses = coalesce(verses, '[]'::jsonb) || jsonb_build_array(p_verse)
  where id = p_point_id and prayer_id = p_source
    and not exists (select 1 from jsonb_array_elements(coalesce(verses, '[]'::jsonb)) v where v->>'ref' = p_verse->>'ref');

  update community_prayers
  set prayer_points = (
    select coalesce(array_agg(
      case when elem->>'id' = p_point_id::text
        and not exists (select 1 from jsonb_array_elements(coalesce(elem->'verses', '[]'::jsonb)) v where v->>'ref' = p_verse->>'ref')
        then jsonb_set(elem, '{verses}', coalesce(elem->'verses', '[]'::jsonb) || jsonb_build_array(p_verse))
        else elem end
    ), '{}')
    from unnest(prayer_points) elem
  )
  where source_prayer_id = p_source;
end;
$$;

-- (sync_remove_point and sync_remove_verse are already idempotent â€” deleting an
--  absent row / filtering an absent ref is a no-op â€” so they're unchanged.)

-- END LEGACY FILE: supabase/offline_client_ids.sql

-- BEGIN LEGACY FILE: supabase/offline_conflict_hardening.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Conflict hardening: mark-answered now APPENDS the testimony server-side
-- (idempotent by testimony id) instead of overwriting the whole testimonies
-- array â€” so a concurrent testimony from another device can't be lost.
-- Run in the Supabase SQL editor.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
create or replace function answer_prayer(
  p_prayer uuid,
  p_status text,
  p_answered_at timestamptz,
  p_testimony_id uuid,
  p_content text,
  p_created_at timestamptz
)
returns void language plpgsql security definer as $$
begin
  if not exists (select 1 from prayers where id = p_prayer and user_id = auth.uid()) then
    raise exception 'not allowed to update this prayer';
  end if;

  update prayers set status = p_status, answered_at = p_answered_at where id = p_prayer;

  -- Append the testimony only if one with this id isn't already present (idempotent replay).
  if p_testimony_id is not null
     and not exists (
       select 1 from prayers p, unnest(coalesce(p.testimonies, '{}')) t
       where p.id = p_prayer and t->>'id' = p_testimony_id::text
     ) then
    update prayers
    set testimonies = array_append(
      coalesce(testimonies, '{}'),
      jsonb_build_object('id', p_testimony_id, 'content', p_content, 'created_at', p_created_at)
    )
    where id = p_prayer;
  end if;

  -- Mirror answered status onto any shared community copies.
  update community_prayers set is_answered = (p_status = 'answered') where source_prayer_id = p_prayer;
end;
$$;

-- END LEGACY FILE: supabase/offline_conflict_hardening.sql

-- BEGIN LEGACY FILE: supabase/fix_signup_trigger.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- FIX: Google/email signup failing in production with
--   error=server_error&error_code=unexpected_failure
--   &error_description=Database+error+saving+new+user
--
-- Cause: the on_auth_user_created trigger runs handle_new_user(), which mirrors
-- the new user into public.profiles. It was SECURITY DEFINER with NO search_path
-- and an UNQUALIFIED `insert into profiles`. When the auth admin role executes
-- the trigger and its search_path doesn't include `public`, the insert raises
-- and GoTrue reports "Database error saving new user", blocking ALL new signups.
--
-- Fix: pin search_path, fully-qualify the table, and make the profile mirror
-- non-blocking so a profile hiccup can never again break authentication.
-- Idempotent â€” safe to run in the Supabase SQL editor.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
exception when others then
  -- Never block auth signup because the profile mirror failed; just log it.
  raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

-- Belt-and-suspenders: let the auth admin role reach public.profiles even if a
-- future platform change tightens its grants.
grant usage on schema public to supabase_auth_admin;
grant insert on public.profiles to supabase_auth_admin;
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- Recreate the trigger so it points at the corrected function.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any profiles missed while signups were failing / for older users.
insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;

-- END LEGACY FILE: supabase/fix_signup_trigger.sql

-- BEGIN LEGACY FILE: supabase/e2ee_migration.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- End-to-end encryption migration â€” run in the Supabase SQL editor.
-- Idempotent and NON-BREAKING: every column is nullable and existing rows keep
-- their plaintext until the owner edits them with the vault unlocked.
--
-- What it adds:
--   1. encrypted_payload + encryption_version on prayers (and the child tables,
--      pre-added so Phase 3b needs no second migration).
--   2. vault_keys: stores ONLY the user's *wrapped* master key (ciphertext) so
--      the Prayer Vault works across devices. This is NOT the key and NOT the
--      passphrase â€” the server cannot decrypt anything with it (zero-knowledge).
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ 1. Encrypted payload columns â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- encrypted_payload holds { v, iv, ct } produced by src/lib/crypto/e2ee.ts.
-- When it is set, the plaintext columns (title, description, person_name, phone)
-- are redacted to '' on the server â€” the real values live only in the ciphertext.
alter table prayers add column if not exists encrypted_payload jsonb;
alter table prayers add column if not exists encryption_version int;

-- Child tables â€” Phase 3b (NOW ACTIVE): for unshared/private vault prayers, each
-- prayer_updates / prayer_points row is stored as ciphertext in encrypted_payload
-- with its plaintext columns redacted (see src/lib/crypto/prayerCrypto.js
-- encryptChildForStorage). Shared prayers keep these rows in plaintext so the
-- sync_* fan-out can read them. No new RLS is needed â€” owners already manage
-- their own child rows (supabase/rls_audit.sql).
alter table prayer_updates add column if not exists encrypted_payload jsonb;
alter table prayer_updates add column if not exists encryption_version int;
alter table prayer_points  add column if not exists encrypted_payload jsonb;
alter table prayer_points  add column if not exists encryption_version int;

-- â”€â”€ 2. Cross-device vault key sync â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- `record` is the wrapped-master-key bundle: the AES master key encrypted by a
-- passphrase-derived key AND by a recovery-code-derived key, plus the PBKDF2
-- salts. Useless without the passphrase or recovery code, so it is safe at rest.
create table if not exists vault_keys (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  record     jsonb not null,
  updated_at timestamptz default now()
);

alter table vault_keys enable row level security;

drop policy if exists "Users manage own vault key" on vault_keys;
create policy "Users manage own vault key" on vault_keys
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- END LEGACY FILE: supabase/e2ee_migration.sql

-- BEGIN LEGACY FILE: supabase/e2ee_default.sql
-- â”€â”€ Default end-to-end encryption: crypto key tables + community payloads â”€â”€â”€â”€â”€
-- Phase 1 of the "encryption by default" model. Personal prayer content is
-- already encrypted client-side with an account content key (ACK); this file
-- adds the SERVER-SIDE storage the community/group encryption (Phase 2) needs,
-- plus each user's asymmetric identity keypair used to wrap group keys.
--
-- The server never stores a readable content key or an unwrapped private key:
--   â€¢ user_crypto_keys.encrypted_private_key  â€” private key wrapped by the ACK
--   â€¢ group_member_keys.encrypted_group_key   â€” group key wrapped to a member's
--                                                RSA public key
-- Only ciphertext + public keys live here. Idempotent â€” safe to re-run.

-- â”€â”€ Per-user identity keypair â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- public_key_jwk        â€” RSA-OAEP public key, readable by any authenticated
--                         user (via the public_keys view) so group keys can be
--                         wrapped to it. Never sensitive.
-- encrypted_private_key â€” the RSA private key (pkcs8) encrypted with the user's
--                         account content key. Readable ONLY by its owner.
create table if not exists user_crypto_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_key_jwk jsonb not null,
  encrypted_private_key jsonb,
  key_version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_crypto_keys enable row level security;

-- Owner-only access to the full row (which includes encrypted_private_key).
do $$ begin
  create policy "own crypto key select" on user_crypto_keys
    for select using (user_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own crypto key insert" on user_crypto_keys
    for insert with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own crypto key update" on user_crypto_keys
    for update using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Public keys are readable by every authenticated user. A view (owner rights,
-- so it bypasses the table's owner-only RLS) exposes ONLY the non-sensitive
-- columns â€” encrypted_private_key is never selectable through it.
create or replace view public_keys as
  select user_id, public_key_jwk from user_crypto_keys;
grant select on public_keys to authenticated;

-- â”€â”€ Group content key versions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- One row per (group, version). Forward-only rotation bumps `version`; existing
-- content keeps its own key_version and stays readable to members who still hold
-- that wrapped key. The key material itself is NOT stored here â€” only the fact a
-- version exists and who created it. Members hold wrapped copies in
-- group_member_keys.
create table if not exists group_key_versions (
  group_id uuid references groups(id) on delete cascade,
  version int not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  primary key (group_id, version)
);

alter table group_key_versions enable row level security;

do $$ begin
  create policy "members read key versions" on group_key_versions
    for select using (group_id in (select get_my_group_ids()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "members create key versions" on group_key_versions
    for insert with check (
      group_id in (select get_my_group_ids()) and created_by = auth.uid()
    );
exception when duplicate_object then null; end $$;

-- â”€â”€ Wrapped group keys (per member, per version) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- encrypted_group_key â€” the group content key wrapped (RSA-OAEP) to this
-- member's public key. Readable ONLY by that member; nobody can read another
-- member's wrapped key.
create table if not exists group_member_keys (
  group_id uuid references groups(id) on delete cascade,
  key_version int not null,
  user_id uuid references auth.users(id) on delete cascade,
  encrypted_group_key jsonb not null,
  created_at timestamptz default now(),
  primary key (group_id, key_version, user_id)
);

alter table group_member_keys enable row level security;

-- A member can read only their OWN wrapped group key.
do $$ begin
  create policy "read own wrapped group key" on group_member_keys
    for select using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Any member of the group may create wrapped-key rows for co-members. This is
-- how the group key is handed to a member: an existing key-holder wraps it to
-- the newcomer's public key and inserts the row. (The newcomer still can't read
-- OTHER members' rows â€” only their own, per the select policy above.)
do $$ begin
  create policy "members wrap keys for the group" on group_member_keys
    for insert with check (group_id in (select get_my_group_ids()));
exception when duplicate_object then null; end $$;

-- A member can remove their own wrapped key (leaving), and group admins can
-- revoke a removed member's access.
do $$ begin
  create policy "revoke wrapped group keys" on group_member_keys
    for delete using (
      user_id = auth.uid() or group_id in (select get_my_admin_group_ids())
    );
exception when duplicate_object then null; end $$;

-- â”€â”€ Encrypted payload columns on community content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Phase 2 moves sensitive community content (title, description, prayer points,
-- updates, testimonies, guidance) into encrypted_payload and blanks the
-- plaintext columns. Added now so the client can start writing them; legacy
-- plaintext rows (no encrypted_payload) still read during the migration window.
alter table community_prayers add column if not exists encrypted_payload jsonb;
alter table community_prayers add column if not exists encryption_version int;
alter table community_prayers add column if not exists key_version int default 1;

alter table community_updates add column if not exists encrypted_payload jsonb;
alter table community_updates add column if not exists encryption_version int;
alter table community_updates add column if not exists key_version int default 1;

alter table testimonies add column if not exists encrypted_payload jsonb;
alter table testimonies add column if not exists encryption_version int;
alter table testimonies add column if not exists key_version int default 1;

-- END LEGACY FILE: supabase/e2ee_default.sql

-- BEGIN LEGACY FILE: supabase/e2ee_testimonies.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Phase 3c â€” Testimony E2EE migration. Run in the Supabase SQL editor
-- BEFORE deploying the matching client (the app selects `prayer_testimonies`,
-- so the table + FK must exist first). Idempotent and NON-BREAKING: the old
-- client never touches this table, and every existing row keeps its plaintext.
--
-- Personal testimonies used to live on `prayers.testimonies` (a jsonb[] column
-- appended server-side by the answer_prayer RPC in offline_conflict_hardening.sql)
-- and, before that, the scalar `prayers.testimony`. Both were the LAST private
-- prayer content stored server-side in plaintext for vault users. This migration
-- moves them to their own child table so that:
--   â€¢ an append is a plain row INSERT â€” conflict-free without the RPC hack, so the
--     offline concurrent-loss guarantee is preserved by construction; and
--   â€¢ each row can be E2E-encrypted for PRIVATE prayers exactly like
--     prayer_updates / prayer_points (Phase 3b) â€” content redacted to '' with the
--     ciphertext in encrypted_payload (see src/lib/crypto/prayerCrypto.js).
--
-- DEPRECATION: after this runs, `answer_prayer`, `prayers.testimonies` and
-- `prayers.testimony` are READ-ONLY LEGACY. The client stops writing them and
-- reads them only as a fallback (deduped by id in utils/prayer.js testimonyList).
-- They are left in place so an un-refreshed old client still works during
-- rollout; drop them in a follow-up migration one release later.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ 1. Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Mirrors the prayer_updates shape + the encrypted_payload / encryption_version
-- columns already carried by the Phase 3b child tables. Cascade-deletes with the
-- parent prayer.
create table if not exists prayer_testimonies (
  id                 uuid primary key default gen_random_uuid(),
  prayer_id          uuid not null references prayers(id) on delete cascade,
  author_name        text default '',
  content            text default '',
  encrypted_payload  jsonb,
  encryption_version int,
  created_at         timestamptz default now()
);

create index if not exists prayer_testimonies_prayer_id_idx on prayer_testimonies(prayer_id);

-- â”€â”€ 2. RLS: owner-via-parent (copied from the prayer_updates policy) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table prayer_testimonies enable row level security;

drop policy if exists "Users manage own testimonies" on prayer_testimonies;
create policy "Users manage own testimonies" on prayer_testimonies
  for all
  using (prayer_id in (select id from prayers where user_id = auth.uid()))
  with check (prayer_id in (select id from prayers where user_id = auth.uid()));

-- â”€â”€ 3. Backfill existing testimonies (idempotent, PLAINTEXT) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- These legacy testimonies were never encrypted, so they are copied as plaintext.
-- The app re-encrypts on the next save of a private prayer (nothing forces it).

-- 3a. jsonb[] array entries â†’ rows, keyed on their existing id so re-runs and the
--     legacy-column reader dedupe against each other.
insert into prayer_testimonies (id, prayer_id, content, created_at)
select
  (t->>'id')::uuid,
  p.id,
  t->>'content',
  coalesce((t->>'created_at')::timestamptz, p.answered_at, now())
from prayers p, unnest(coalesce(p.testimonies, '{}')) as t
where t ? 'id' and (t->>'id') is not null
on conflict (id) do nothing;

-- 3b. legacy scalar prayers.testimony â†’ row, with a DETERMINISTIC id derived from
--     the prayer id so re-running never duplicates it.
insert into prayer_testimonies (id, prayer_id, content, created_at)
select
  md5(p.id::text || ':legacy-testimony')::uuid,
  p.id,
  p.testimony,
  coalesce(p.answered_at, p.updated_at, now())
from prayers p
where p.testimony is not null and p.testimony <> ''
on conflict (id) do nothing;

-- END LEGACY FILE: supabase/e2ee_testimonies.sql

-- BEGIN LEGACY FILE: supabase/push_notifications.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Push notifications: subscriptions table + scheduled reminder job
-- Run this in the Supabase SQL editor. Prerequisite for the cron block at the
-- bottom: run supabase/_cron_secrets.sql once (stores project_url +
-- notify_fn_secret in Vault; the cron reads them at run time).
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- 1. Web Push subscriptions (one row per device/browser). reminder_time, lang
--    and tz_offset are the source of truth the scheduler reads (settings are
--    otherwise localStorage-only on the client).
create table if not exists public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  endpoint      text not null unique,
  p256dh        text not null,
  auth          text not null,
  reminder_time text not null default '07:00',   -- local "HH:MM"
  tz_offset     int  not null default 0,         -- minutes to add to UTC for local time
  lang          text not null default 'en',
  enabled       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);
create index if not exists push_subscriptions_enabled_idx on public.push_subscriptions(enabled) where enabled;

alter table public.push_subscriptions enable row level security;

-- Users manage only their own subscriptions. The Edge Function uses the
-- service-role key, which bypasses RLS, so it can read every row.
drop policy if exists "own push subs" on public.push_subscriptions;
create policy "own push subs" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Scheduled job â€” runs every 15 minutes and invokes the send-daily-reminder
--    Edge Function, which decides which subscriptions are due in their local
--    timezone. Requires the pg_cron and pg_net extensions. The follow-up
--    reminder has its own, independently-scheduled function/cron â€” see
--    supabase/follow_up_reminders.sql.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any previous schedule with the same name, then (re)create it.
-- âš ï¸  Prerequisite: run supabase/_cron_secrets.sql once (stores project_url +
--     notify_fn_secret in Vault). The cron body below reads them at run time â€”
--     no placeholders to substitute here.
select cron.unschedule('send-daily-reminder')
  where exists (select 1 from cron.job where jobname = 'send-daily-reminder');

select cron.schedule(
  'send-daily-reminder',
  '*/15 * * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/send-daily-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'notify_fn_secret')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- END LEGACY FILE: supabase/push_notifications.sql

-- BEGIN LEGACY FILE: supabase/follow_up_reminders.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Follow-up reminders: a second, independently-scheduled push reminder that
-- encourages the user to reach out to the people (or themselves) they've
-- prayed for and log the answer on the prayer. Delivered by its own
-- send-follow-up-reminder Edge Function + cron, separate from the daily
-- reminder's â€” run this after supabase/push_notifications.sql, then deploy
-- send-follow-up-reminder.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

alter table public.push_subscriptions
  add column if not exists follow_up_enabled boolean not null default false,
  add column if not exists follow_up_days int not null default 7,
  add column if not exists follow_up_time text not null default '07:00',  -- local "HH:MM", independent of reminder_time
  add column if not exists last_follow_up_sent_at timestamptz;            -- cadence anchor (stamped on enable / on send)

-- Scheduled job â€” runs every 15 minutes and invokes the send-follow-up-reminder
-- Edge Function. Requires the pg_cron and pg_net extensions (already enabled
-- by push_notifications.sql).
-- âš ï¸  Prerequisite: run supabase/_cron_secrets.sql once (stores project_url +
--     notify_fn_secret in Vault). The cron body reads them at run time.
select cron.unschedule('send-follow-up-reminder')
  where exists (select 1 from cron.job where jobname = 'send-follow-up-reminder');

select cron.schedule(
  'send-follow-up-reminder',
  '*/15 * * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/send-follow-up-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'notify_fn_secret')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- END LEGACY FILE: supabase/follow_up_reminders.sql

-- BEGIN LEGACY FILE: supabase/follow_up_time.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Follow-up reminder time + cadence anchor.
--
-- 1) The follow-up push gets its own delivery time (default 07:00) instead
--    of riding on the daily reminder's reminder_time.
-- 2) Cadence semantics change alongside: a row with no last_follow_up_sent_at
--    is no longer sent immediately â€” the client stamps the anchor when the
--    user enables follow-ups (and the scheduler stamps legacy rows on first
--    sight), so the first follow-up arrives one full follow_up_days later
--    and the "next reminder" shown in Settings tracks the chosen frequency.
--
-- Run this in the Supabase SQL editor (safe to re-run), then redeploy:
--   supabase functions deploy send-follow-up-reminder --no-verify-jwt
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

alter table public.push_subscriptions
  add column if not exists follow_up_time text not null default '07:00';  -- local "HH:MM"

-- user_settings is created later in this consolidated baseline with
-- follow_up_time already present. The original hand-run file altered an
-- existing production table, but replaying that ALTER here would run before
-- the table exists on a clean database.

-- END LEGACY FILE: supabase/follow_up_time.sql

-- BEGIN LEGACY FILE: supabase/prayer_scheduling.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Prayer scheduling: one-time & recurring prayers, time-of-day slots,
-- per-occurrence overrides, per-prayer completions, category rotation and
-- group prayer calendars (commitments). Run in the Supabase SQL editor.
--
-- `schedule` is a small client-interpreted jsonb object (see src/lib/schedule.js):
--   { "type": "once", "date": "2026-07-14", "slot": "morning" }
--   { "type": "recurring", "freq": "daily|weekly|interval|monthly|yearly",
--     "weekDays": [2,5], "interval": 3, "dayOfMonth": 15, "month": 7, "day": 14,
--     "startDate": "2026-07-04", "slot": "evening",
--     "end": { "kind": "never|date|count|answered", "date": "...", "count": 21 },
--     "plan": { "id": "upperRoom", "startDate": "2026-07-04" } }
--
-- Scheduling metadata deliberately stays OUTSIDE the E2EE envelope (like
-- week_days today): it reveals timing, never content. Prayers without a
-- `schedule` keep the legacy category week_days behaviour.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

alter table prayers add column if not exists schedule jsonb default null;
-- Per-occurrence exceptions keyed by local date: {"2026-07-14": {"skip": true}}
-- or {"2026-07-14": {"movedTo": "2026-07-16"}}. Kept on the row (not a child
-- table) so the offline mutation queue and snapshot carry it for free.
alter table prayers add column if not exists schedule_overrides jsonb not null default '{}';
-- Denormalised "last prayed" timestamp for rotation fairness + catch-up UI.
alter table prayers add column if not exists last_prayed_at timestamptz;

-- Category rotation: {"perDay": 5} â†’ the app prays through the category's
-- active prayers N at a time, round-robin by day, instead of all at once.
alter table categories add column if not exists rotation jsonb default null;

-- â”€â”€ Per-prayer completions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- One row per prayer per local day it was prayed. Powers the catch-up list,
-- calendar history and rotation fairness. Client-generated ids keep offline
-- replays idempotent (mirrors the prayer_testimonies pattern).
create table if not exists prayer_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  prayer_id uuid references prayers(id) on delete cascade not null,
  day date not null,
  slot text default null,
  created_at timestamptz default now(),
  unique (prayer_id, day)
);

alter table prayer_completions enable row level security;
create policy "Users manage own completions" on prayer_completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_completions_user_day on prayer_completions(user_id, day desc);

-- â”€â”€ Group prayer calendar (commitments) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- A member claims a day (prayer-chain style) for a community prayer: "I'll
-- pray for this on the 18th". Uses get_my_group_ids() (community_schema.sql)
-- to avoid RLS recursion, same as every other community table.
create table if not exists prayer_commitments (
  id uuid primary key default gen_random_uuid(),
  community_prayer_id uuid references community_prayers(id) on delete cascade not null,
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_name text default '',
  day date not null,
  slot text default null,
  created_at timestamptz default now(),
  unique (community_prayer_id, user_id, day)
);

alter table prayer_commitments enable row level security;
create policy "Members read group commitments" on prayer_commitments
  for select using (group_id in (select get_my_group_ids()));
create policy "Members add own commitments" on prayer_commitments
  for insert with check (user_id = auth.uid() and group_id in (select get_my_group_ids()));
create policy "Users remove own commitments" on prayer_commitments
  for delete using (user_id = auth.uid());
create index if not exists idx_commitments_prayer on prayer_commitments(community_prayer_id, day);
create index if not exists idx_commitments_user on prayer_commitments(user_id, day);

-- END LEGACY FILE: supabase/prayer_scheduling.sql

-- BEGIN LEGACY FILE: supabase/split_reminder_crons.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Upgrade: splits the old combined `send-reminders` Edge Function/cron into
-- two independently-scheduled ones â€” `send-daily-reminder` and
-- `send-follow-up-reminder`. Run this once against a project that already
-- executed the earlier versions of push_notifications.sql / follow_up_
-- reminders.sql (i.e. already has a `send-reminders` cron job).
--
-- After running this:
--   1. Deploy the two new functions:
--        npx supabase functions deploy send-daily-reminder --no-verify-jwt
--        npx supabase functions deploy send-follow-up-reminder --no-verify-jwt
--   2. Delete the old one so it can't run against a stale deployment:
--        npx supabase functions delete send-reminders
--
-- âš ï¸  Prerequisite: run supabase/_cron_secrets.sql once (stores project_url +
--     notify_fn_secret in Vault). The cron bodies read them at run time.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

select cron.unschedule('send-reminders')
  where exists (select 1 from cron.job where jobname = 'send-reminders');

select cron.unschedule('send-daily-reminder')
  where exists (select 1 from cron.job where jobname = 'send-daily-reminder');

select cron.schedule(
  'send-daily-reminder',
  '*/15 * * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/send-daily-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'notify_fn_secret')
    ),
    body    := '{}'::jsonb
  );
  $$
);

select cron.unschedule('send-follow-up-reminder')
  where exists (select 1 from cron.job where jobname = 'send-follow-up-reminder');

select cron.schedule(
  'send-follow-up-reminder',
  '*/15 * * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/send-follow-up-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'notify_fn_secret')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- END LEGACY FILE: supabase/split_reminder_crons.sql

-- BEGIN LEGACY FILE: supabase/content_language.sql
-- Source-language metadata for prayer content (2026-07 persona refinement).
--
-- Purely ADDITIVE: a nullable text column on each content-bearing table. New
-- writes stamp the author's active content/interface language (e.g. 'fr');
-- existing rows stay NULL and keep working â€” the client falls back to its
-- on-device language heuristic for them. The column is metadata (a BCP-47-ish
-- app language code), never prayer content, so it lives OUTSIDE the E2EE
-- payload exactly like scheduling metadata.
--
-- No RLS changes: every policy on these tables is row-scoped, and adding a
-- column alters none of them. None of these six tables uses column-level
-- GRANTs either, so no privilege has to be re-granted for the new column.
--
-- â”€â”€ RELEASE ORDER: RUN THIS *BEFORE* DEPLOYING THE CLIENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Not optional, and not reversible after the fact. The client writes
-- content_language on every prayer/update/testimony create. Against a database
-- without the column PostgREST answers 400, which the offline queue classifies
-- as a PERMANENT failure (see isPermanentError in src/lib/queueCore.js) and
-- DROPS the mutation â€” so a client deployed ahead of this migration would
-- silently lose prayers written in the gap.
--
-- The reverse order is completely safe: the column is nullable, unused by the
-- currently-deployed client, and adding it changes no existing behaviour. So:
--   1. run this file in the Supabase SQL editor (safe to re-run: IF NOT EXISTS)
--   2. verify (see the query at the bottom)
--   3. then deploy the client
--
-- Existing rows stay NULL forever unless their author edits them; nothing
-- backfills, and no existing value is ever made mandatory.

alter table public.prayers            add column if not exists content_language text;
alter table public.prayer_updates     add column if not exists content_language text;
alter table public.prayer_testimonies add column if not exists content_language text;
alter table public.community_prayers  add column if not exists content_language text;
alter table public.community_updates  add column if not exists content_language text;
alter table public.testimonies        add column if not exists content_language text;

-- Verification â€” expect 6 rows, every one is_nullable = YES, data_type = text.
-- If this returns fewer than 6, DO NOT deploy the client yet.
--
--   select table_name, data_type, is_nullable
--   from information_schema.columns
--   where table_schema = 'public'
--     and column_name = 'content_language'
--     and table_name in ('prayers', 'prayer_updates', 'prayer_testimonies',
--                        'community_prayers', 'community_updates', 'testimonies')
--   order by table_name;

-- END LEGACY FILE: supabase/content_language.sql

-- BEGIN LEGACY FILE: supabase/rich_media_updates.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Rich updates & testimonies: media attachments (photos / audio / video) and
-- links on personal + community updates and testimonies.
--
-- Run in the Supabase SQL editor. Idempotent â€” safe to re-run.
--
-- Design:
--   â€¢ Each update/testimony row gains an `attachments jsonb` column holding an
--     array of { id, type, path, mime, name, size, key, iv } (media) or
--     { id, type: 'link', url } (links).
--   â€¢ Media blobs live in a PRIVATE `attachments` storage bucket, ALWAYS
--     encrypted client-side with a per-file AES-GCM key before upload â€” the
--     bucket never stores readable media, so members-wide read access leaks
--     nothing. The per-file key travels in the row's attachment metadata,
--     which is E2E-encrypted (account key / group key) whenever the row is;
--     for legacy plaintext rows it is protected by the same RLS as the text.
--   â€¢ For E2EE rows the `attachments` column itself is redacted to '[]' (the
--     real metadata lives inside encrypted_payload), mirroring text/content.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ 1. attachments column on every update/testimony table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table prayer_updates      add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table prayer_testimonies  add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table community_updates   add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table testimonies         add column if not exists attachments jsonb not null default '[]'::jsonb;

-- â”€â”€ 2. sync_add_update learns attachments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Drop the old 5-arg overload FIRST: create-or-replace with a new defaulted
-- arg would otherwise leave two candidates and break PostgREST RPC resolution
-- with PGRST203 (same trap fix_sync_overloads.sql cleaned up before).
drop function if exists sync_add_update(uuid, uuid, text, text, boolean);

create or replace function sync_add_update(
  p_id uuid,
  p_source uuid,
  p_text text,
  p_author text,
  p_anon boolean,
  p_attachments jsonb default '[]'::jsonb
)
returns prayer_updates language plpgsql security definer as $$
declare new_row prayer_updates;
begin
  if not can_sync_prayer(p_source) then raise exception 'not allowed to update this prayer'; end if;

  insert into prayer_updates (id, prayer_id, text, author_name, is_anonymous, attachments)
  values (p_id, p_source, p_text, p_author, p_anon, coalesce(p_attachments, '[]'::jsonb))
  on conflict (id) do nothing;
  select * into new_row from prayer_updates where id = p_id;

  insert into community_updates (id, community_prayer_id, user_id, author_name, text, is_anonymous, attachments)
  select md5(p_id::text || cp.id::text)::uuid, cp.id, auth.uid(), p_author, p_text, p_anon, coalesce(p_attachments, '[]'::jsonb)
  from community_prayers cp where cp.source_prayer_id = p_source
  on conflict (id) do nothing;

  return new_row;
end;
$$;

-- â”€â”€ 3. Private storage bucket for encrypted media â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- Objects are keyed <user_id>/<attachment_id>: users write only into their own
-- folder; any authenticated user may READ (every object is client-side
-- ciphertext â€” without the per-file key from the owning row, a download is
-- noise); only the uploader may delete.
drop policy if exists "attachments_insert_own_folder" on storage.objects;
create policy "attachments_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "attachments_read_authenticated" on storage.objects;
create policy "attachments_read_authenticated" on storage.objects
  for select to authenticated
  using (bucket_id = 'attachments');

drop policy if exists "attachments_delete_own_folder" on storage.objects;
create policy "attachments_delete_own_folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

-- END LEGACY FILE: supabase/rich_media_updates.sql

-- BEGIN LEGACY FILE: supabase/attachment_management.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Attachment/content management: let an author delete a single media
-- attachment or the text from an already-posted update or testimony â€” and
-- delete the whole row once nothing remains, so no author+date shell lingers.
--
-- Run in the Supabase SQL editor. Idempotent â€” safe to re-run.
--
-- Design:
--   â€¢ community_updates / testimonies previously had NO UPDATE policy, so an
--     author could not shrink their row's attachments list. Authors (and only
--     authors â€” admins moderate by deleting the whole word, and could not
--     re-encrypt someone else's E2EE payload anyway) may now UPDATE their own
--     rows; the client re-encrypts the payload under the group key and
--     rewrites the row. Authors â€” and group admins (moderation) â€” may DELETE
--     whole testimonies; words got the same author-or-admin delete policy in
--     community_update_delete.sql.
--   â€¢ sync_remove_update_attachment() / sync_remove_update_text() remove one
--     attachment (matched by its json id) or blank the text of a PLAINTEXT
--     personal update AND of that update's fanned-out community mirrors
--     (sync_add_update copies plaintext updates into community_updates under
--     md5(update_id || community_prayer_id) ids). sync_delete_update() drops
--     the personal row and its mirrors once the last content is removed.
--     E2EE personal updates never fan out and keep their metadata in
--     encrypted_payload, so the client updates those rows directly instead.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ 1. Authors can edit their own community rows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
drop policy if exists "Authors can update their updates" on community_updates;
create policy "Authors can update their updates" on community_updates
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Authors can update their testimonies" on testimonies;
create policy "Authors can update their testimonies" on testimonies
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A testimony can be deleted by its author OR a group admin (moderation),
-- mirroring the words policy in community_update_delete.sql and the
-- community_prayers "Authors and admins can delete prayers" policy.
-- get_my_admin_group_ids() is SECURITY DEFINER, so it doesn't recurse on RLS.
drop policy if exists "Authors can delete their testimonies" on testimonies;
drop policy if exists "Authors and admins can delete testimonies" on testimonies;
create policy "Authors and admins can delete testimonies" on testimonies
  for delete using (
    user_id = auth.uid()
    or group_id in (select get_my_admin_group_ids())
  );

-- â”€â”€ 2. Remove one attachment from a personal update + its mirrors â”€â”€â”€â”€â”€â”€â”€â”€â”€
create or replace function sync_remove_update_attachment(p_update_id uuid, p_att_id text)
returns void language plpgsql security definer as $$
declare v_prayer uuid;
begin
  select prayer_id into v_prayer from prayer_updates where id = p_update_id;
  if v_prayer is null then return; end if;
  if not exists (select 1 from prayers where id = v_prayer and user_id = auth.uid()) then
    raise exception 'not allowed to edit this update';
  end if;

  update prayer_updates
     set attachments = coalesce(
       (select jsonb_agg(a) from jsonb_array_elements(attachments) a where a->>'id' <> p_att_id),
       '[]'::jsonb)
   where id = p_update_id;

  update community_updates cu
     set attachments = coalesce(
       (select jsonb_agg(a) from jsonb_array_elements(cu.attachments) a where a->>'id' <> p_att_id),
       '[]'::jsonb)
   where cu.id in (
     select md5(p_update_id::text || cp.id::text)::uuid
     from community_prayers cp where cp.source_prayer_id = v_prayer
   );
end;
$$;

-- â”€â”€ 3. Blank the text of a personal update + its mirrors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create or replace function sync_remove_update_text(p_update_id uuid)
returns void language plpgsql security definer as $$
declare v_prayer uuid;
begin
  select prayer_id into v_prayer from prayer_updates where id = p_update_id;
  if v_prayer is null then return; end if;
  if not exists (select 1 from prayers where id = v_prayer and user_id = auth.uid()) then
    raise exception 'not allowed to edit this update';
  end if;

  update prayer_updates set text = '' where id = p_update_id;

  update community_updates cu set text = ''
   where cu.id in (
     select md5(p_update_id::text || cp.id::text)::uuid
     from community_prayers cp where cp.source_prayer_id = v_prayer
   );
end;
$$;

-- â”€â”€ 4. Delete a personal update + its mirrors (last content removed) â”€â”€â”€â”€â”€â”€
create or replace function sync_delete_update(p_update_id uuid)
returns void language plpgsql security definer as $$
declare v_prayer uuid;
begin
  select prayer_id into v_prayer from prayer_updates where id = p_update_id;
  if v_prayer is null then return; end if;
  if not exists (select 1 from prayers where id = v_prayer and user_id = auth.uid()) then
    raise exception 'not allowed to edit this update';
  end if;

  delete from community_updates cu
   where cu.id in (
     select md5(p_update_id::text || cp.id::text)::uuid
     from community_prayers cp where cp.source_prayer_id = v_prayer
   );

  delete from prayer_updates where id = p_update_id;
end;
$$;

-- END LEGACY FILE: supabase/attachment_management.sql

-- BEGIN LEGACY FILE: supabase/update_text_edit.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Author edit of a personal update's TEXT, kept consistent with its fanned-out
-- community mirrors â€” the write-side twin of sync_remove_update_text() in
-- attachment_management.sql. Personal testimonies never fan out (edited with a
-- direct table write), and E2EE personal updates carry their text inside
-- encrypted_payload (re-encrypted client-side), so only PLAINTEXT updates need
-- this RPC.
--
-- Run in the Supabase SQL editor. Idempotent â€” safe to re-run.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

create or replace function sync_set_update_text(p_update_id uuid, p_text text)
returns void language plpgsql security definer as $$
declare v_prayer uuid;
begin
  select prayer_id into v_prayer from prayer_updates where id = p_update_id;
  if v_prayer is null then return; end if;
  -- Author-only: the update must belong to a prayer this user owns.
  if not exists (select 1 from prayers where id = v_prayer and user_id = auth.uid()) then
    raise exception 'not allowed to edit this update';
  end if;

  update prayer_updates set text = p_text where id = p_update_id;

  -- sync_add_update copies plaintext updates into community_updates under
  -- md5(update_id || community_prayer_id) ids â€” keep those mirrors in step.
  update community_updates cu set text = p_text
   where cu.id in (
     select md5(p_update_id::text || cp.id::text)::uuid
     from community_prayers cp where cp.source_prayer_id = v_prayer
   );
end;
$$;

-- END LEGACY FILE: supabase/update_text_edit.sql

-- BEGIN LEGACY FILE: supabase/scripture_guidance.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Persist ScriptureFirstStep's AI guidance on the prayer itself, so it can be
-- recalled later without firing a new AI request. Idempotent and
-- NON-BREAKING â€” nullable column, matches supabase/e2ee_migration.sql.
--
-- For a PRIVATE (vault-unlocked) prayer, this column is redacted to null and
-- the guidance instead travels inside the prayer's existing encrypted_payload
-- alongside title/description (see SENSITIVE_JSON_FIELDS in
-- src/lib/crypto/prayerCrypto.js). Shared / legacy / no-vault prayers store
-- the guidance object here in plaintext, exactly like title/description do.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

alter table prayers add column if not exists scripture_guidance jsonb;

-- END LEGACY FILE: supabase/scripture_guidance.sql

-- BEGIN LEGACY FILE: supabase/pin_prayers.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Pin prayers to the top of personal lists. Run in the Supabase SQL editor.
-- `pinned` is personal organisation on the user's own prayer row; existing RLS
-- on `prayers` (owner can update their rows) already covers reads/writes.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

alter table prayers add column if not exists pinned boolean not null default false;

-- END LEGACY FILE: supabase/pin_prayers.sql

-- BEGIN LEGACY FILE: supabase/group_admin_management.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Multi-admin management for prayer groups â€” run in the Supabase SQL editor.
-- Idempotent and safe to re-run.
--
-- Goal: let an existing group admin promote a member to admin, demote a
-- non-owner admin, and remove members â€” WITHOUT ever letting a client bypass
-- authorization by writing group_members directly. All authorization lives in
-- SECURITY DEFINER functions below; there is deliberately NO client-facing
-- UPDATE policy on group_members, so direct role changes stay blocked by RLS.
--
-- Ownership is derived from groups.created_by (the immutable owner). We do NOT
-- introduce an "owner" role value â€” role is only ever 'member' or 'admin'.
--
-- â”€â”€ Deadlock note â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- PART 1 (functions + grants) takes NO table locks and is the essential part.
-- PART 2 (the role check-constraint + retiring the old DELETE policy) needs a
-- brief AccessExclusiveLock on group_members, which can contend with live app
-- reads (PostgREST/Realtime) and â€” under load â€” deadlock. If PART 2 errors with
-- "deadlock detected" it is transient and nothing was applied: just re-run it
-- (ideally in a quiet moment). Running PART 1 and PART 2 as SEPARATE executions
-- keeps the exclusive lock window tiny. lock_timeout below also makes any lock
-- wait fail fast instead of hanging.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PART 1 â€” functions (no table locks) â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ Secure role management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Promote/demote a member. Runs as definer (bypasses RLS) but enforces every
-- authorization rule itself: UI visibility is never trusted as authorization.
-- The acting user is always auth.uid() â€” a client can never supply it.
--
-- Raises stable single-token messages the client maps to localized strings:
--   not_authenticated Â· invalid_role Â· cannot_change_own_role Â· not_group_admin
--   target_not_member Â· creator_cannot_be_demoted Â· must_retain_admin
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

  -- Unknown group â†’ report as an authorization failure (don't leak existence).
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

  -- 8. Idempotent: role already at the requested value â†’ return it unchanged.
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

-- â”€â”€ Secure member removal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Newly promoted admins inherit member removal, so it is guarded here rather
-- than by a broad DELETE policy. An admin cannot remove the creator, cannot
-- remove themselves (that is "leave group"), and cannot remove the last admin.
--
-- Raises stable tokens: not_authenticated Â· cannot_remove_self Â· not_group_admin
--   target_not_member Â· creator_cannot_be_removed Â· must_retain_admin
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

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â• PART 2 â€” group_members table changes (brief exclusive lock) â•â•â•
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
-- updates from the client remain denied. Do NOT add one â€” role changes must go
-- through set_group_member_role().

-- END LEGACY FILE: supabase/group_admin_management.sql

-- BEGIN LEGACY FILE: supabase/group_invitation_visibility.sql
-- Let invitees read the name of a group they've been invited to, so the
-- invitation card can show the real group name instead of a placeholder "?".
-- The base "Members can read their groups" policy excludes not-yet-members,
-- which left group_invitations.groups(name) null for the person being invited.
-- Safe from RLS recursion: group_invitations' own SELECT policy is a plain
-- column check (invited_user_id = auth.uid()) and never references groups.
-- Run in the Supabase SQL editor.
drop policy if exists "Invitees can read groups they're invited to" on groups;
create policy "Invitees can read groups they're invited to" on groups
  for select using (
    id in (select group_id from group_invitations where invited_user_id = auth.uid())
  );

-- END LEGACY FILE: supabase/group_invitation_visibility.sql

-- BEGIN LEGACY FILE: supabase/group_rename.sql
-- Allow group admins to rename their group. Run in the Supabase SQL editor.
-- (groups previously had only SELECT + INSERT policies, so updates were blocked.)
drop policy if exists "Admins can update their group" on groups;
create policy "Admins can update their group" on groups
  for update using (id in (select get_my_admin_group_ids()))
  with check (id in (select get_my_admin_group_ids()));

-- END LEGACY FILE: supabase/group_rename.sql

-- BEGIN LEGACY FILE: supabase/community_update_delete.sql
-- Allow a member update ("word") on a community prayer to be deleted by its
-- author or by a group admin. Mirrors the community_prayers delete policy
-- ("Authors and admins can delete prayers"). Without this, community_updates
-- had SELECT + INSERT policies but no DELETE, so no one could remove a word.
-- get_my_admin_group_ids() is SECURITY DEFINER, so it doesn't recurse on RLS.
-- Run in the Supabase SQL editor.
drop policy if exists "Authors and admins can delete updates" on community_updates;
create policy "Authors and admins can delete updates" on community_updates
  for delete using (
    user_id = auth.uid()
    or community_prayer_id in (
      select id from community_prayers where group_id in (select get_my_admin_group_ids())
    )
  );

-- END LEGACY FILE: supabase/community_update_delete.sql

-- BEGIN LEGACY FILE: supabase/group_plans.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- GROUP prayer plans â€” a plan a whole group is walking through together.
--
-- Run this in the Supabase SQL editor (safe to re-run; upgrades in place).
-- Depends on: community_schema.sql (groups, group_members, get_my_group_ids,
-- get_my_admin_group_ids).
--
-- Unlike plan_invitations (transient, one row per invited person, deleted on
-- accept/decline), a group plan is a PERSISTENT, group-scoped record: "this
-- group is praying <plan_id>, starting <start_date>". It stays visible to every
-- member â€” including people who join the group LATER â€” so they can see it and
-- join in. A guided plan lives entirely client-side (src/content/prayerPlans.js),
-- so this row carries only the short content id + a start date; no prayer
-- content, hence no end-to-end encryption to handle here.
--
-- group_plan_members records who has joined the shared plan, so the group can
-- see a warm "who's praying" count. Joining also starts the same guided plan on
-- the member's own calendar (client-side), but that personal prayer is E2EE and
-- never referenced here.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ 1. The group's adopted plans â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.group_plans (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  plan_id     text not null,                        -- content id, e.g. 'fast3'
  start_date  date not null,                        -- the day the group begins
  added_by    uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  -- One live record per plan per group; re-adopting the same plan is a no-op.
  unique (group_id, plan_id)
);

create index if not exists group_plans_group_idx on public.group_plans (group_id);

-- â”€â”€ 2. Who has joined each group plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- group_id is denormalized from group_plans so RLS + realtime can scope by group
-- with a single column (the insert policy verifies it matches the plan's group).
create table if not exists public.group_plan_members (
  group_plan_id  uuid not null references public.group_plans(id) on delete cascade,
  group_id       uuid not null references public.groups(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (group_plan_id, user_id)
);

create index if not exists group_plan_members_group_idx on public.group_plan_members (group_id);

alter table public.group_plans        enable row level security;
alter table public.group_plan_members enable row level security;

-- Explicit privileges (do not rely on Supabase default grants). RLS below still
-- scopes every row. No UPDATE: adopting is an idempotent insert-or-nothing.
grant select, insert, delete on public.group_plans        to authenticated;
grant select, insert, delete on public.group_plan_members to authenticated;

-- â”€â”€ 3. Row Level Security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- group_plans: every member of the group can see its shared plans.
drop policy if exists "Members can read group plans" on public.group_plans;
create policy "Members can read group plans" on public.group_plans
  for select using (group_id in (select get_my_group_ids()));

-- Any member may start a shared plan for a group they belong to.
drop policy if exists "Members can start group plans" on public.group_plans;
create policy "Members can start group plans" on public.group_plans
  for insert with check (
    added_by = auth.uid() and group_id in (select get_my_group_ids())
  );

-- The member who started it, or any group admin, can end it (cascades to members).
drop policy if exists "Starter or admin can end group plans" on public.group_plans;
create policy "Starter or admin can end group plans" on public.group_plans
  for delete using (
    added_by = auth.uid() or group_id in (select get_my_admin_group_ids())
  );

-- group_plan_members: everyone in the group can see who's praying (the count).
drop policy if exists "Members can read group plan members" on public.group_plan_members;
create policy "Members can read group plan members" on public.group_plan_members
  for select using (group_id in (select get_my_group_ids()));

-- You may only add yourself, and only to a plan that belongs to a group you're
-- in; the denormalized group_id must match the plan's real group (no spoofing).
drop policy if exists "Members can join group plans" on public.group_plan_members;
create policy "Members can join group plans" on public.group_plan_members
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.group_plans gp
      where gp.id = group_plan_id
        and gp.group_id = group_plan_members.group_id
        and gp.group_id in (select get_my_group_ids())
    )
  );

-- You can leave a plan (remove your own participation) at any time.
drop policy if exists "Members can leave group plans" on public.group_plan_members;
create policy "Members can leave group plans" on public.group_plan_members
  for delete using (user_id = auth.uid());

-- â”€â”€ 4. Realtime â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Publish both tables so the group view live-updates when a plan is started/
-- ended or someone joins (RLS still scopes each subscriber to their groups).
do $$
begin
  alter publication supabase_realtime add table public.group_plans;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.group_plan_members;
exception when duplicate_object then null;
end $$;

-- â”€â”€ 5. Reload the PostgREST schema cache â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Pick up the new tables + FKs immediately so fetches work right after the
-- migration (a stale cache is a common cause of "it never shows up").
notify pgrst, 'reload schema';

-- END LEGACY FILE: supabase/group_plans.sql

-- BEGIN LEGACY FILE: supabase/plan_invitations.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Invite friends or groups to a GUIDED PRAYER PLAN.
--
-- Run this in the Supabase SQL editor (safe to re-run; upgrades in place).
-- Depends on: community_schema.sql (groups, group_members, friendships,
-- get_my_group_ids) and notifications.sql (notifications table +
-- create_notification()).
--
-- A guided plan lives entirely CLIENT-SIDE (src/content/prayerPlans.js); a plan
-- invitation therefore carries only a short content identifier (plan_id, e.g.
-- 'fast3') plus a proposed start date. It stores NO prayer content, so â€” unlike
-- community prayers â€” there is no end-to-end-encryption to handle here, and the
-- row fits the "notifications point at content, they never copy it" contract.
--
-- Modeled on group_invitations (community_schema.sql) and the notification
-- trigger pattern (notifications.sql).
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ 1. Invitations table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.plan_invitations (
  id               uuid primary key default gen_random_uuid(),
  plan_id          text not null,                       -- content id, e.g. 'fast3'
  start_date       date not null,                       -- proposed local start day
  invited_user_id  uuid not null references auth.users(id) on delete cascade,
  invited_by       uuid references auth.users(id) on delete cascade,
  -- Context only: set when the invitation came from selecting a whole group, so
  -- the invitee can be told "â€¦and the rest of <group>". Null for a direct
  -- friend invite. Not a membership requirement.
  group_id         uuid references public.groups(id) on delete set null,
  created_at       timestamptz not null default now(),
  -- Re-inviting the same person to the same plan is an idempotent no-op.
  unique (plan_id, invited_by, invited_user_id),
  check (invited_by <> invited_user_id)
);

create index if not exists plan_invitations_invited_user_idx
  on public.plan_invitations (invited_user_id);
create index if not exists plan_invitations_inviter_idx
  on public.plan_invitations (invited_by);

alter table public.plan_invitations enable row level security;

-- Explicit privileges (do not rely solely on Supabase default grants). The
-- narrow client surface: read your own rows, create invitations, delete
-- (accept/decline/cancel). RLS policies below still scope every row.
grant select, insert, delete on public.plan_invitations to authenticated;

-- â”€â”€ 2. Row Level Security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Sender and recipient can both see the invitation.
drop policy if exists "Inviter and invitee can see plan invitations" on public.plan_invitations;
create policy "Inviter and invitee can see plan invitations" on public.plan_invitations
  for select using (
    invited_user_id = auth.uid() or invited_by = auth.uid()
  );

-- You may only invite someone you can actually reach: a friend, or someone who
-- shares a group with you. This blocks inviting arbitrary strangers by id.
drop policy if exists "Reachable users can be invited to a plan" on public.plan_invitations;
create policy "Reachable users can be invited to a plan" on public.plan_invitations
  for insert with check (
    invited_by = auth.uid()
    and invited_user_id <> auth.uid()
    and (
      exists (
        select 1 from public.friendships f
        where (f.user_id = auth.uid() and f.friend_id = invited_user_id)
           or (f.user_id = invited_user_id and f.friend_id = auth.uid())
      )
      or invited_user_id in (
        select gm.user_id from public.group_members gm
        where gm.group_id in (select get_my_group_ids())
      )
    )
  );

-- The invitee accepts/declines by deleting the row; the sender may cancel it.
drop policy if exists "Invitee can dismiss plan invitations" on public.plan_invitations;
create policy "Invitee can dismiss plan invitations" on public.plan_invitations
  for delete using (invited_user_id = auth.uid());

drop policy if exists "Inviter can cancel plan invitations" on public.plan_invitations;
create policy "Inviter can cancel plan invitations" on public.plan_invitations
  for delete using (invited_by = auth.uid());

-- â”€â”€ 3. Allow the new notification type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- notifications is created later in this consolidated baseline. Its clean
-- definition below already includes the final 'plan_invitation' value, so the
-- original production-only constraint alteration must not run before the
-- table exists.

-- â”€â”€ 4. Notification trigger â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Plan invitation received â†’ notify the invitee (never the actor). Uses the
-- central, preference-aware, self-excluding create_notification() helper.
-- Content-free: metadata carries only the plan id + optional group context.
create or replace function public.tg_notify_plan_invitation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.create_notification(
    new.invited_user_id, new.invited_by, 'plan_invitation', new.group_id,
    'plan_invitation', new.id,
    jsonb_build_object('plan_id', new.plan_id, 'group_id', new.group_id),
    'plan-invitation:' || new.id::text || ':' || new.invited_user_id::text
  );
  return new;
exception when others then
  raise warning 'tg_notify_plan_invitation: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_plan_invitation on public.plan_invitations;
create trigger notify_plan_invitation after insert on public.plan_invitations
  for each row execute function public.tg_notify_plan_invitation();

-- â”€â”€ 5. Realtime â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Publish the table so the pending-invitations nav badge live-updates when an
-- invitation arrives or is cleared (RLS still scopes each user to their rows).
do $$
begin
  alter publication supabase_realtime add table public.plan_invitations;
exception when duplicate_object then null;
end $$;

-- â”€â”€ 6. Reload the PostgREST schema cache â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Force the API layer to pick up the new table + foreign keys immediately, so
-- the invitee's fetch works right after this migration (a stale cache is a
-- common cause of "the invitation never shows up" straight after a migration).
notify pgrst, 'reload schema';

-- END LEGACY FILE: supabase/plan_invitations.sql

-- BEGIN LEGACY FILE: supabase/verse_cache.sql
-- Shared cache of resolved Bible passage text, so a verse fetched once (from
-- YouVersion or, with consent, the AI fallback) is reused by every user and
-- device instead of being re-fetched and re-billed per person.
--
-- This holds ONLY public Scripture text â€” never private prayer content â€” so a
-- world-readable policy is safe. Keyed by (lang, reference); `source` labels the
-- origin ('youversion' | 'ai') so the reader can stay honest about AI-sourced text.
create table if not exists verse_cache (
  lang       text        not null,
  reference  text        not null,
  text       text        not null,
  source     text        not null default 'ai',
  created_at timestamptz not null default now(),
  primary key (lang, reference)
);

alter table verse_cache enable row level security;

-- Public Scripture text: any authenticated user may read the shared cacheâ€¦
drop policy if exists "Public read verse cache" on verse_cache;
create policy "Public read verse cache" on verse_cache
  for select using (true);

-- â€¦and contribute a newly-resolved passage. No update/delete policy: entries are
-- immutable Scripture text, write-once.
drop policy if exists "Authenticated insert verse cache" on verse_cache;
create policy "Authenticated insert verse cache" on verse_cache
  for insert to authenticated with check (true);

-- END LEGACY FILE: supabase/verse_cache.sql

-- BEGIN LEGACY FILE: supabase/community_translation_cache.sql
-- Group-scoped shared cache for on-demand community translations.
--
-- Before: every member who tapped "See translation" on a shared request re-ran
-- (and re-paid for) the same AI translation. Now the first member's translation
-- is reused by the rest of the group.
--
-- Privacy: this is safe precisely because it's scoped to a single group â€” the
-- same members who can already read the original request are the only ones who
-- can read (or contribute) its translation. Private personal prayers are NEVER
-- written here; they keep their own per-user cache (`translations`).
create table if not exists community_translations (
  group_id        uuid        not null references groups(id) on delete cascade,
  lang            text        not null,
  source_hash     text        not null,      -- FNV-1a of original_text (see utils/hash.js)
  original_text   text        not null,      -- kept to verify against hash collisions
  translated_text text        not null,
  created_at      timestamptz not null default now(),
  primary key (group_id, lang, source_hash)
);

alter table community_translations enable row level security;

-- Only members of the group may read its cached translationsâ€¦
drop policy if exists "Members read group translations" on community_translations;
create policy "Members read group translations" on community_translations
  for select using (group_id in (select get_my_group_ids()));

-- â€¦and only members may contribute one.
drop policy if exists "Members write group translations" on community_translations;
create policy "Members write group translations" on community_translations
  for insert to authenticated with check (group_id in (select get_my_group_ids()));

-- END LEGACY FILE: supabase/community_translation_cache.sql

-- BEGIN LEGACY FILE: supabase/user_settings.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Account-level user settings â€” one row per user.
-- Run this in the Supabase SQL editor (safe to re-run; upgrades in place).
--
-- Language, appearance, AI consent and reminder preferences used to live only
-- in each browser's localStorage (plus a per-device push_subscriptions row),
-- so every browser drifted independently: different language, different
-- daily-verse language, different theme, different reminder toggles/times.
-- This table is the account-wide source of truth the client syncs on load and
-- on every settings change.
--
-- The notification-permission flag stays device-local (it is a per-device
-- browser fact, not a preference). The vault master key is NOT here either â€”
-- it syncs separately as a passphrase-wrapped blob in vault_keys
-- (supabase/e2ee_migration.sql), preserving zero-knowledge.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

create table if not exists public.user_settings (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  language               text,
  theme                  text,                               -- 'light' | 'dark'
  daily_reminder_enabled boolean not null default false,
  daily_reminder_time    text    not null default '07:00',   -- local "HH:MM"
  follow_up_enabled      boolean not null default false,
  follow_up_days         int     not null default 7,
  follow_up_time         text    not null default '07:00',   -- local "HH:MM"
  ai_consent_prayer      boolean not null default false,     -- AI on prayer title + last update
  ai_consent_home        boolean not null default false,     -- AI on today's category names
  updated_at             timestamptz not null default now()
);

-- Upgrade path for projects that ran the first version of this file
-- (language + reminder prefs only).
alter table public.user_settings add column if not exists theme text;
alter table public.user_settings add column if not exists ai_consent_prayer boolean not null default false;
alter table public.user_settings add column if not exists ai_consent_home boolean not null default false;
alter table public.user_settings add column if not exists follow_up_time text not null default '07:00';

alter table public.user_settings enable row level security;

drop policy if exists "own settings" on public.user_settings;
create policy "own settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- END LEGACY FILE: supabase/user_settings.sql

-- BEGIN LEGACY FILE: supabase/notifications.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- In-app notification inbox + privacy-safe Web Push delivery.
--
-- Run this in the Supabase SQL editor (safe to re-run; upgrades in place).
-- Depends on: community_schema.sql (groups, group_members, community_prayers,
-- community_updates, friend_requests, group_invitations, testimonies) and
-- push_notifications.sql (push_subscriptions) and user_settings.sql.
--
-- PRIVACY CONTRACT (mirrors supabase/functions/_shared/notify.ts): a durable
-- notification row and its Web Push payload carry ONLY identifiers and routing
-- info â€” never decrypted prayer titles, descriptions, update text, testimony
-- text or person names. All prayer content stays end-to-end encrypted; these
-- rows point at content, they never copy it.
--
-- SECURITY MODEL:
--   â€¢ Clients may SELECT their own notifications and update only seen_at/read_at
--     on them (column-level GRANT + RLS). They cannot INSERT rows, change the
--     recipient/actor, or move delivery status â€” those happen only inside the
--     SECURITY DEFINER trigger/RPC functions below (or via the service role).
--   â€¢ Every function pins search_path='' and fully-qualifies table names so a
--     malicious search_path cannot redirect it.
--   â€¢ Notification-creating triggers swallow their own errors so a notification
--     failure can never break the underlying action (sending a friend request,
--     posting an update, â€¦).
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ 1. Notifications table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),

  recipient_id  uuid not null references auth.users(id) on delete cascade,
  actor_id      uuid references auth.users(id) on delete set null,

  type          text not null,

  group_id      uuid references public.groups(id) on delete cascade,

  entity_type   text not null,
  entity_id     uuid,

  metadata      jsonb not null default '{}'::jsonb,

  dedupe_key    text,

  created_at    timestamptz not null default now(),
  seen_at       timestamptz,
  read_at       timestamptz,

  push_status   text not null default 'pending'
                  check (push_status in ('pending','processing','sent','failed','skipped')),
  push_attempts integer not null default 0,
  last_push_error text,
  pushed_at     timestamptz,

  constraint notifications_type_check check (type in (
    'friend_request','group_invitation','community_update','answered',
    'reaction_bucket','group_prayer_added','testimony','membership_change',
    'role_change','plan_invitation'
  ))
);

-- Recipient inbox, newest first.
create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);
-- Unread badge / filtered inbox.
create index if not exists notifications_unread_idx
  on public.notifications (recipient_id) where read_at is null;
-- Retry-worker scan (see claim_notifications_for_delivery).
create index if not exists notifications_push_pending_idx
  on public.notifications (push_status, created_at) where push_status in ('pending','failed');
-- Deduplication: at most one row per (recipient, dedupe_key).
create unique index if not exists notifications_dedupe_idx
  on public.notifications (recipient_id, dedupe_key) where dedupe_key is not null;

alter table public.notifications enable row level security;

-- Lock the table down, then re-grant the narrow client surface. Column-level
-- UPDATE means an authenticated user can only ever touch seen_at / read_at, even
-- though the RLS policy would otherwise allow updating the whole (own) row.
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (seen_at, read_at) on public.notifications to authenticated;

drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications
  for select using (recipient_id = auth.uid());

drop policy if exists "update own notification read state" on public.notifications;
create policy "update own notification read state" on public.notifications
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
-- No INSERT/DELETE policy â†’ clients cannot forge or delete notifications.
-- Rows are created by the SECURITY DEFINER triggers below; deletion is by
-- cascade (recipient/group removed) only.

-- Realtime: publish the table so the client inbox receives live INSERT/UPDATE
-- events (RLS still applies â€” each user only receives their own rows).
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

-- â”€â”€ 2. Account notification preferences â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- One row per (user, type, group). Precedence when resolving a notification:
--   group override (type + group_id)  â†’  type default (type, group null)  â†’
--   account default (type '_account', group null)  â†’  built-in default.
-- Quiet hours + IANA timezone live on the '_account' row (they are account-wide,
-- not per-type). Kept SEPARATE from push_subscriptions so notification-type
-- preferences are never duplicated across a user's devices.
create table if not exists public.notification_preferences (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null default '_account',
  group_id      uuid references public.groups(id) on delete cascade,
  in_app_enabled boolean not null default true,
  push_enabled   boolean not null default true,
  delivery_mode  text not null default 'immediate'
                   check (delivery_mode in ('immediate','digest','off')),
  quiet_hours_start time,
  quiet_hours_end   time,
  timezone       text,   -- IANA, e.g. 'Europe/Berlin'
  updated_at     timestamptz not null default now()
);

create unique index if not exists notification_preferences_scope_idx
  on public.notification_preferences
     (user_id, type, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid));

alter table public.notification_preferences enable row level security;
revoke all on public.notification_preferences from anon, authenticated;
grant select, insert, update, delete on public.notification_preferences to authenticated;

drop policy if exists "manage own notif prefs" on public.notification_preferences;
create policy "manage own notif prefs" on public.notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- â”€â”€ 3. Per-prayer follow subscriptions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Lets a user follow an individual community prayer for updates / answered /
-- testimony notifications (the prayer's owner is always notified of updates; a
-- follower opts in on top of that).
create table if not exists public.prayer_notification_subscriptions (
  user_id            uuid not null references auth.users(id) on delete cascade,
  community_prayer_id uuid not null references public.community_prayers(id) on delete cascade,
  notify_updates     boolean not null default true,
  notify_answered    boolean not null default true,
  notify_testimonies boolean not null default true,
  created_at         timestamptz not null default now(),
  primary key (user_id, community_prayer_id)
);

alter table public.prayer_notification_subscriptions enable row level security;
revoke all on public.prayer_notification_subscriptions from anon, authenticated;
grant select, insert, update, delete on public.prayer_notification_subscriptions to authenticated;

drop policy if exists "read own prayer follows" on public.prayer_notification_subscriptions;
create policy "read own prayer follows" on public.prayer_notification_subscriptions
  for select using (user_id = auth.uid());

-- A user may only follow prayers in groups they belong to (get_my_group_ids is
-- the same SECURITY DEFINER helper the community RLS uses â€” avoids recursion).
drop policy if exists "follow prayers in my groups" on public.prayer_notification_subscriptions;
create policy "follow prayers in my groups" on public.prayer_notification_subscriptions
  for insert with check (
    user_id = auth.uid()
    and community_prayer_id in (
      select id from public.community_prayers where group_id in (select public.get_my_group_ids())
    )
  );

drop policy if exists "update own prayer follows" on public.prayer_notification_subscriptions;
create policy "update own prayer follows" on public.prayer_notification_subscriptions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "unfollow own prayers" on public.prayer_notification_subscriptions;
create policy "unfollow own prayers" on public.prayer_notification_subscriptions
  for delete using (user_id = auth.uid());

-- â”€â”€ 4. IANA timezone columns (replace numeric offset as the primary rep) â”€â”€â”€â”€â”€
-- Kept ALONGSIDE the legacy tz_offset for backward compatibility with the
-- existing reminder schedulers. New code should prefer the IANA timezone so
-- quiet hours / digests / scheduling stay correct across DST.
alter table public.push_subscriptions add column if not exists timezone text;
alter table public.user_settings     add column if not exists timezone text;

-- â”€â”€ 5. Preference resolution (used by triggers AND the Edge Function) â”€â”€â”€â”€â”€â”€â”€â”€
create or replace function public.resolve_notification_pref(p_user uuid, p_type text, p_group uuid)
returns table (in_app boolean, push boolean, mode text, quiet_start time, quiet_end time, tz text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r_group public.notification_preferences;
  r_type  public.notification_preferences;
  r_acct  public.notification_preferences;
begin
  if p_group is not null then
    select * into r_group from public.notification_preferences
      where user_id = p_user and type = p_type and group_id = p_group limit 1;
  end if;
  select * into r_type from public.notification_preferences
    where user_id = p_user and type = p_type and group_id is null limit 1;
  select * into r_acct from public.notification_preferences
    where user_id = p_user and type = '_account' and group_id is null limit 1;

  in_app := coalesce(r_group.in_app_enabled, r_type.in_app_enabled, r_acct.in_app_enabled, true);
  push   := coalesce(r_group.push_enabled,  r_type.push_enabled,  r_acct.push_enabled,  true);
  mode   := coalesce(r_group.delivery_mode, r_type.delivery_mode, r_acct.delivery_mode, 'immediate');
  quiet_start := r_acct.quiet_hours_start;
  quiet_end   := r_acct.quiet_hours_end;
  tz          := coalesce(r_acct.timezone, (
    select s.timezone from public.user_settings s where s.user_id = p_user
  ));
  return next;
end;
$$;

-- Whether a durable notification of this type should be created at all.
create or replace function public.notif_should_create(p_user uuid, p_type text, p_group uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare pref record;
begin
  select * into pref from public.resolve_notification_pref(p_user, p_type, p_group);
  if pref.mode = 'off' then return false; end if;          -- type switched off entirely
  if pref.in_app = false and pref.push = false then return false; end if; -- nothing to deliver
  return true;
end;
$$;

-- Central, safe insert used by every event trigger. Excludes the actor, honours
-- preferences, and dedupes. Swallows any error so a notification failure can
-- never break the caller's transaction.
create or replace function public.create_notification(
  p_recipient uuid, p_actor uuid, p_type text, p_group uuid,
  p_entity_type text, p_entity_id uuid, p_metadata jsonb, p_dedupe text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_recipient is null then return; end if;
  if p_actor is not null and p_actor = p_recipient then return; end if;  -- never notify self
  if not public.notif_should_create(p_recipient, p_type, p_group) then return; end if;

  insert into public.notifications
    (recipient_id, actor_id, type, group_id, entity_type, entity_id, metadata, dedupe_key)
  values
    (p_recipient, p_actor, p_type, p_group, p_entity_type, p_entity_id,
     coalesce(p_metadata, '{}'::jsonb), p_dedupe)
  on conflict (recipient_id, dedupe_key) where dedupe_key is not null do nothing;
exception when others then
  -- Never let notification bookkeeping break the underlying action.
  raise warning 'create_notification failed (% â†’ %): %', p_type, p_recipient, sqlerrm;
end;
$$;

-- These are internal machinery â€” no client role should call them directly.
revoke all on function public.resolve_notification_pref(uuid, text, uuid) from public;
revoke all on function public.notif_should_create(uuid, text, uuid) from public;
revoke all on function public.create_notification(uuid, uuid, text, uuid, text, uuid, jsonb, text) from public;
grant execute on function public.resolve_notification_pref(uuid, text, uuid) to service_role;

-- â”€â”€ 6. Event triggers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- 6a. Friend request received.
create or replace function public.tg_notify_friend_request()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.create_notification(
    new.to_user_id, new.from_user_id, 'friend_request', null,
    'friend_request', new.id,
    jsonb_build_object('from_user_id', new.from_user_id),
    'friend-request:' || new.id::text || ':' || new.to_user_id::text
  );
  return new;
exception when others then
  raise warning 'tg_notify_friend_request: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_friend_request on public.friend_requests;
create trigger notify_friend_request after insert on public.friend_requests
  for each row execute function public.tg_notify_friend_request();

-- 6b. Group invitation received.
create or replace function public.tg_notify_group_invitation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.create_notification(
    new.invited_user_id, new.invited_by, 'group_invitation', new.group_id,
    'group_invitation', new.id,
    jsonb_build_object('group_id', new.group_id),
    'group-invitation:' || new.id::text || ':' || new.invited_user_id::text
  );
  return new;
exception when others then
  raise warning 'tg_notify_group_invitation: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_group_invitation on public.group_invitations;
create trigger notify_group_invitation after insert on public.group_invitations
  for each row execute function public.tg_notify_group_invitation();

-- 6c. Update posted on a community prayer â†’ notify the prayer's owner and any
--     followers (never the actor).
create or replace function public.tg_notify_community_update()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_group uuid;
  v_actor uuid := new.user_id;
  r record;
begin
  select user_id, group_id into v_owner, v_group
  from public.community_prayers where id = new.community_prayer_id;

  perform public.create_notification(
    v_owner, v_actor, 'community_update', v_group,
    'community_prayer', new.community_prayer_id,
    jsonb_build_object('group_id', v_group, 'community_prayer_id', new.community_prayer_id, 'update_id', new.id),
    'community-update:' || new.id::text || ':' || coalesce(v_owner::text, 'none')
  );

  for r in
    select s.user_id from public.prayer_notification_subscriptions s
    where s.community_prayer_id = new.community_prayer_id
      and s.notify_updates = true
      and s.user_id is distinct from v_owner
  loop
    perform public.create_notification(
      r.user_id, v_actor, 'community_update', v_group,
      'community_prayer', new.community_prayer_id,
      jsonb_build_object('group_id', v_group, 'community_prayer_id', new.community_prayer_id, 'update_id', new.id),
      'community-update:' || new.id::text || ':' || r.user_id::text
    );
  end loop;
  return new;
exception when others then
  raise warning 'tg_notify_community_update: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_community_update on public.community_updates;
create trigger notify_community_update after insert on public.community_updates
  for each row execute function public.tg_notify_community_update();

-- 6d. Community prayer marked answered â†’ notify followers, only on the
--     not-answered â†’ answered transition. The dedupe key makes it fire at most
--     once per follower even if the prayer is toggled answered/active/answered.
create or replace function public.tg_notify_answered()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  r record;
begin
  if new.is_answered = true and coalesce(old.is_answered, false) = false then
    for r in
      select s.user_id from public.prayer_notification_subscriptions s
      where s.community_prayer_id = new.id and s.notify_answered = true
    loop
      perform public.create_notification(
        r.user_id, v_actor, 'answered', new.group_id,
        'community_prayer', new.id,
        jsonb_build_object('group_id', new.group_id, 'community_prayer_id', new.id),
        'answered:' || new.id::text || ':' || r.user_id::text
      );
    end loop;
  end if;
  return new;
exception when others then
  raise warning 'tg_notify_answered: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_answered on public.community_prayers;
create trigger notify_answered after update of is_answered on public.community_prayers
  for each row execute function public.tg_notify_answered();

-- 6e. Meaningful group membership / role change â†’ notify the affected member
--     (never for a self-initiated join).
create or replace function public.tg_notify_membership()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if v_actor is not null and v_actor <> new.user_id then
      perform public.create_notification(
        new.user_id, v_actor, 'membership_change', new.group_id,
        'group', new.group_id,
        jsonb_build_object('group_id', new.group_id, 'role', new.role, 'change', 'added'),
        'membership-added:' || new.group_id::text || ':' || new.user_id::text
      );
    end if;
  elsif tg_op = 'UPDATE' then
    if new.role is distinct from old.role then
      perform public.create_notification(
        new.user_id, v_actor, 'role_change', new.group_id,
        'group', new.group_id,
        jsonb_build_object('group_id', new.group_id, 'role', new.role, 'previous_role', old.role, 'change', 'role'),
        'role-change:' || new.group_id::text || ':' || new.user_id::text || ':' || new.role
      );
    end if;
  end if;
  return new;
exception when others then
  raise warning 'tg_notify_membership: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_membership on public.group_members;
create trigger notify_membership after insert or update on public.group_members
  for each row execute function public.tg_notify_membership();

-- â”€â”€ 7. Delivery claiming (concurrency-safe, service-role only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- FOR UPDATE SKIP LOCKED so two workers (webhook + retry cron) never deliver the
-- same notification. Only pending/failed rows under the attempt + age caps are
-- claimable; claiming flips them to 'processing' so a duplicate invocation gets
-- an empty set (idempotency).
create or replace function public.claim_notifications_for_delivery(p_limit int default 20)
returns setof public.notifications
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.notifications n
  set push_status = 'processing'
  where n.id in (
    select id from public.notifications
    where push_status in ('pending','failed')
      and push_attempts < 5
      and created_at > now() - interval '24 hours'
    order by created_at
    for update skip locked
    limit p_limit
  )
  returning n.*;
end; $$;

create or replace function public.claim_notification(p_id uuid)
returns setof public.notifications
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.notifications n
  set push_status = 'processing'
  where n.id = p_id
    and n.push_status in ('pending','failed')
    and n.push_attempts < 5
  returning n.*;
end; $$;

-- Records the outcome of a delivery attempt.
create or replace function public.finish_notification_delivery(
  p_id uuid, p_status text, p_error text default null, p_increment boolean default true
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notifications
  set push_status   = p_status,
      last_push_error = p_error,
      push_attempts = push_attempts + case when p_increment then 1 else 0 end,
      pushed_at     = case when p_status = 'sent' then now() else pushed_at end
  where id = p_id;
end; $$;

revoke all on function public.claim_notifications_for_delivery(int) from public;
revoke all on function public.claim_notification(uuid) from public;
revoke all on function public.finish_notification_delivery(uuid, text, text, boolean) from public;
grant execute on function public.claim_notifications_for_delivery(int) to service_role;
grant execute on function public.claim_notification(uuid) to service_role;
grant execute on function public.finish_notification_delivery(uuid, text, text, boolean) to service_role;

-- â”€â”€ 8. Retry backstop (pg_cron + pg_net) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Runs every 5 minutes and asks the Edge Function to claim & deliver any
-- pending/failed notifications (< 5 attempts, < 24h old). This alone delivers
-- everything; the optional Database Webhook (see docs/notifications.md) just
-- makes the FIRST attempt near-instant. Row claiming above keeps the two from
-- double-sending.
-- âš ï¸  Prerequisite: run supabase/_cron_secrets.sql once (stores project_url +
--     notify_fn_secret in Vault). The cron body reads them at run time.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('retry-event-notifications')
  where exists (select 1 from cron.job where jobname = 'retry-event-notifications');

select cron.schedule(
  'retry-event-notifications',
  '*/5 * * * *',
  $CRON$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/send-event-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'notify_fn_secret')
    ),
    body    := '{}'::jsonb
  );
  $CRON$
);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Section 10 â€” Aggregation + digest follow-ups
--   â€¢ reaction_bucket : "I'm praying" reactions aggregated into a time bucket
--   â€¢ group_prayer_added : a new prayer shared to a group
--   â€¢ testimony : a testimony shared to a group / followed prayer
--   â€¢ digest batching : delivery_mode='digest' defers push into one summary
-- Idempotent (safe to re-run). Requires Sections 1â€“9 above.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- 10a. Digest bookkeeping column: when a digest-mode notification's push has been
--      folded into a summary, digested_at is stamped so it is never re-sent.
alter table public.notifications add column if not exists digested_at timestamptz;

-- Scan support for the digest builder.
create index if not exists notifications_digest_pending_idx
  on public.notifications (recipient_id)
  where digested_at is null and last_push_error = 'digest';

-- 10b. Type-aware default delivery mode: the "aggregated / preference-controlled"
--      types default to digest (batched push) to keep them quiet by default; all
--      other types stay immediate. Explicit preference rows always win.
create or replace function public.default_delivery_mode(p_type text)
returns text
language sql
immutable
as $$
  select case when p_type in ('group_prayer_added','testimony') then 'digest' else 'immediate' end;
$$;

-- Re-defines resolve_notification_pref (Section 5) to use the type-aware default.
create or replace function public.resolve_notification_pref(p_user uuid, p_type text, p_group uuid)
returns table (in_app boolean, push boolean, mode text, quiet_start time, quiet_end time, tz text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r_group public.notification_preferences;
  r_type  public.notification_preferences;
  r_acct  public.notification_preferences;
begin
  if p_group is not null then
    select * into r_group from public.notification_preferences
      where user_id = p_user and type = p_type and group_id = p_group limit 1;
  end if;
  select * into r_type from public.notification_preferences
    where user_id = p_user and type = p_type and group_id is null limit 1;
  select * into r_acct from public.notification_preferences
    where user_id = p_user and type = '_account' and group_id is null limit 1;

  in_app := coalesce(r_group.in_app_enabled, r_type.in_app_enabled, r_acct.in_app_enabled, true);
  push   := coalesce(r_group.push_enabled,  r_type.push_enabled,  r_acct.push_enabled,  true);
  mode   := coalesce(r_group.delivery_mode, r_type.delivery_mode, r_acct.delivery_mode,
                     public.default_delivery_mode(p_type));
  quiet_start := r_acct.quiet_hours_start;
  quiet_end   := r_acct.quiet_hours_end;
  tz          := coalesce(r_acct.timezone, (
    select s.timezone from public.user_settings s where s.user_id = p_user
  ));
  return next;
end;
$$;
revoke all on function public.resolve_notification_pref(uuid, text, uuid) from public;
grant execute on function public.resolve_notification_pref(uuid, text, uuid) to service_role;

-- 10c. Reactions ("I'm praying") aggregated into an hourly bucket â†’ notify the
--      prayer owner at most once per bucket (dedupe_key carries the bucket, so
--      later reactions in the same hour create no new row and no extra push).
--      Reaction REMOVAL never notifies (trigger is INSERT-only).
create or replace function public.tg_notify_reaction()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_group uuid;
  v_bucket text := to_char(date_trunc('hour', now() at time zone 'utc'), 'YYYYMMDDHH24');
begin
  select user_id, group_id into v_owner, v_group
  from public.community_prayers where id = new.community_prayer_id;

  perform public.create_notification(
    v_owner, new.user_id, 'reaction_bucket', v_group,
    'community_prayer', new.community_prayer_id,
    jsonb_build_object('group_id', v_group, 'community_prayer_id', new.community_prayer_id),
    'reaction-bucket:' || new.community_prayer_id::text || ':' || coalesce(v_owner::text, 'none') || ':' || v_bucket
  );
  return new;
exception when others then
  raise warning 'tg_notify_reaction: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_reaction on public.prayer_reactions;
create trigger notify_reaction after insert on public.prayer_reactions
  for each row execute function public.tg_notify_reaction();

-- 10d. New community prayer shared to a group â†’ notify every member but the
--      author (a "watched group" is a group you belong to).
create or replace function public.tg_notify_group_prayer_added()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in
    select gm.user_id from public.group_members gm
    where gm.group_id = new.group_id and gm.user_id is distinct from new.user_id
  loop
    perform public.create_notification(
      r.user_id, new.user_id, 'group_prayer_added', new.group_id,
      'community_prayer', new.id,
      jsonb_build_object('group_id', new.group_id, 'community_prayer_id', new.id),
      'group-prayer-added:' || new.id::text || ':' || r.user_id::text
    );
  end loop;
  return new;
exception when others then
  raise warning 'tg_notify_group_prayer_added: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_group_prayer_added on public.community_prayers;
create trigger notify_group_prayer_added after insert on public.community_prayers
  for each row execute function public.tg_notify_group_prayer_added();

-- 10e. Testimony shared to a group / followed prayer â†’ notify every member but
--      the author. Members âŠ‡ followers, so a "followed prayer" testimony reaches
--      followers too; metadata carries the linked prayer (may be null â†’ routes to
--      the group).
create or replace function public.tg_notify_testimony()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in
    select gm.user_id from public.group_members gm
    where gm.group_id = new.group_id and gm.user_id is distinct from new.user_id
  loop
    perform public.create_notification(
      r.user_id, new.user_id, 'testimony', new.group_id,
      'testimony', new.id,
      jsonb_build_object('group_id', new.group_id, 'community_prayer_id', new.community_prayer_id),
      'testimony:' || new.id::text || ':' || r.user_id::text
    );
  end loop;
  return new;
exception when others then
  raise warning 'tg_notify_testimony: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_testimony on public.testimonies;
create trigger notify_testimony after insert on public.testimonies
  for each row execute function public.tg_notify_testimony();

-- 10f. Digest builder RPCs (service-role only).
-- Recipients with undelivered, unread digest notifications waiting to be summarized.
create or replace function public.pending_digest_recipients(p_limit int default 200)
returns table (recipient_id uuid)
language sql
security definer
set search_path = ''
as $$
  select distinct n.recipient_id
  from public.notifications n
  where n.push_status = 'skipped'
    and n.last_push_error = 'digest'
    and n.digested_at is null
    and n.read_at is null
  limit p_limit;
$$;

-- Atomically claims one user's pending digest batch (stamps digested_at so a
-- concurrent worker gets nothing) and returns the claimed rows. The caller sends
-- ONE summary push for however many rows come back.
create or replace function public.claim_user_digest(p_recipient uuid)
returns setof public.notifications
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.notifications n
  set digested_at = now()
  where n.recipient_id = p_recipient
    and n.push_status = 'skipped'
    and n.last_push_error = 'digest'
    and n.digested_at is null
    and n.read_at is null
  returning n.*;
end; $$;

revoke all on function public.default_delivery_mode(text) from public;
revoke all on function public.pending_digest_recipients(int) from public;
revoke all on function public.claim_user_digest(uuid) from public;
grant execute on function public.pending_digest_recipients(int) to service_role;
grant execute on function public.claim_user_digest(uuid) to service_role;

-- 10g. Digest cron â€” hourly. Sends each user their batched summary (respecting
--      quiet hours, inside the Edge Function). Reuses the same function via the
--      { "digest": true } body.
--      âš ï¸  Prerequisite: run supabase/_cron_secrets.sql once (stores project_url
--          + notify_fn_secret in Vault). The cron body reads them at run time.
select cron.unschedule('digest-event-notifications')
  where exists (select 1 from cron.job where jobname = 'digest-event-notifications');

select cron.schedule(
  'digest-event-notifications',
  '0 * * * *',
  $CRON$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/send-event-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'notify_fn_secret')
    ),
    body    := '{"digest": true}'::jsonb
  );
  $CRON$
);

-- END LEGACY FILE: supabase/notifications.sql

-- BEGIN LEGACY FILE: supabase/notification_detail.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Notification detail level (privacy).
--
-- Push notifications carry NO prayer content by default. `notification_detail`
-- is a per-account opt-in that the send-daily-reminder function reads:
--   'generic' (default) â†’ "Time to pray." â€” no count, no titles, no names
--   'count'             â†’ "You have N prayer subject(s) today." (number only)
--   'titles'            â†’ reserved; currently treated exactly like 'count'
--                         (titles are NEVER placed in a payload â€” see notify.ts)
--
-- Stored on user_settings (account-level source of truth, mirrored to every
-- device row in push_subscriptions so the schedulers can read it per-send).
--
-- Run this in the Supabase SQL editor (safe to re-run), then redeploy:
--   supabase functions deploy send-daily-reminder --no-verify-jwt
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

alter table public.push_subscriptions
  add column if not exists notification_detail text not null default 'generic';

alter table public.user_settings
  add column if not exists notification_detail text not null default 'generic';

-- END LEGACY FILE: supabase/notification_detail.sql

-- BEGIN LEGACY FILE: supabase/ai_rate_limit.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Shared rate limit for the AI relay (api/anthropic.js). Replaces the proxy's
-- per-instance in-memory counter with a GLOBAL fixed-window counter in Postgres,
-- so the cap holds across every serverless instance instead of resetting on each
-- cold start. Run in the Supabase SQL editor.
--
-- The proxy calls check_ai_rate_limit with the user's own Bearer token. The
-- function is SECURITY DEFINER and keys on auth.uid(), so it can write the
-- counter even though users have no direct table access â€” and it can only ever
-- touch the caller's own row. No service-role key is needed on the server.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

create table if not exists ai_rate_limits (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  count        integer     not null default 0
);

-- Lock the table down: only the SECURITY DEFINER function (which runs as the
-- table owner and bypasses RLS) may read or write it. No policies = no direct
-- access for anon/authenticated roles.
alter table ai_rate_limits enable row level security;

-- Atomic fixed-window check. Increments the caller's counter for the current
-- window (resetting it when the window has elapsed) and returns true while the
-- count is at or below p_max â€” i.e. true = allowed, false = rate limited.
create or replace function check_ai_rate_limit(p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_now   timestamptz := now();
  v_count integer;
begin
  if v_user is null then
    return false; -- unauthenticated callers are never "allowed"
  end if;

  insert into ai_rate_limits (user_id, window_start, count)
    values (v_user, v_now, 1)
  on conflict (user_id) do update
    set
      count = case
        when ai_rate_limits.window_start < v_now - make_interval(secs => p_window_seconds)
          then 1
        else ai_rate_limits.count + 1
      end,
      window_start = case
        when ai_rate_limits.window_start < v_now - make_interval(secs => p_window_seconds)
          then v_now
        else ai_rate_limits.window_start
      end
  returning count into v_count;

  return v_count <= p_max;
end;
$$;

-- Allow the app's signed-in users to invoke the RPC (it self-scopes to auth.uid).
grant execute on function check_ai_rate_limit(integer, integer) to authenticated;

-- END LEGACY FILE: supabase/ai_rate_limit.sql

-- BEGIN LEGACY FILE: supabase/delete_account.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Right-to-erasure: let a user permanently delete their account and ALL data.
-- Run in the Supabase SQL editor (idempotent).
--
-- The function runs as its owner (security definer) so it can remove the row
-- from auth.users; every user-owned table referencing auth.users(id) with
-- `on delete cascade` (prayers, categories, prayer_updates, prayer_points,
-- vault_keys, push_subscriptions, group_members, community_prayers, â€¦) is then
-- cleared automatically. Tables without a cascade are deleted explicitly first.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

create or replace function delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = 'insufficient_privilege';
  end if;

  -- Explicitly clear tables that may not cascade from auth.users.
  delete from translations       where user_id = uid;
  delete from vault_keys         where user_id = uid;
  delete from push_subscriptions where user_id = uid;

  -- Removing the auth user cascades to everything that references it.
  delete from auth.users where id = uid;
end;
$$;

-- Only an authenticated user may call it (and it only ever deletes auth.uid()).
revoke all on function delete_account() from public, anon;
grant execute on function delete_account() to authenticated;

-- END LEGACY FILE: supabase/delete_account.sql

-- BEGIN LEGACY FILE: supabase/fix_sync_overloads.sql
-- Fix: remove the OLD sync function overloads left behind when the p_id versions
-- were added (create-or-replace with a new arg list makes a NEW function, it does
-- not drop the old one). Two overloads of the same name make PostgREST RPC calls
-- fail with PGRST203 "Could not choose the best candidate function".
-- Run in the Supabase SQL editor.
drop function if exists sync_add_point(uuid, text, jsonb);
drop function if exists sync_add_update(uuid, text, text, boolean);

-- END LEGACY FILE: supabase/fix_sync_overloads.sql

-- BEGIN LEGACY FILE: supabase/rpc_hardening.sql
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- RPC hardening â€” run in the Supabase SQL editor. Idempotent, safe to re-run.
--
-- Closes two findings from the 2026-07-28 OWASP audit:
--
--   #1  Broken access control (OWASP A01): the core community/sync RPCs in
--       community_schema.sql, migration.sql, security_hardening.sql,
--       shared_prayer_sync.sql, offline_client_ids.sql, offline_conflict_
--       hardening.sql, attachment_management.sql and update_text_edit.sql
--       were created with NO grant/revoke, so Postgres's default
--       `EXECUTE TO PUBLIC` applies and the `anon` role can call them via
--       PostgREST with only the publishable anon key. The worst case is
--       find_user_by_email(): an UNAUTHENTICATED email -> user-UUID oracle.
--
--   #2  Security misconfiguration (OWASP A05): those same SECURITY DEFINER
--       functions run without a pinned search_path (Supabase linter
--       `function_search_path_mutable`), a privilege-escalation hardening gap.
--
-- This script restricts the client-facing RPCs to `authenticated` and pins a
-- fixed search_path on every SECURITY DEFINER function that lacks one. It
-- matches functions BY NAME, so it covers every overload (e.g. the two
-- sync_add_update / sync_add_point signatures) and silently skips any function
-- a given database hasn't created yet.
--
-- It deliberately does NOT touch:
--   â€¢ trigger functions (handle_new_user, tg_notify_*) â€” not client RPCs, and
--     handle_new_user is hardened + granted to supabase_auth_admin already.
--   â€¢ the service-role notification workers (claim_*, finish_*,
--     create_notification, resolve_notification_pref, pending_digest_recipients,
--     claim_user_digest, default_delivery_mode) â€” those are intentionally
--     revoked from anon/authenticated; granting `authenticated` would LOOSEN them.
--   â€¢ already-hardened RPCs (delete_account, set_group_member_role,
--     remove_group_member, check_ai_rate_limit) â€” re-running would be harmless,
--     but they're left out to keep this focused.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ 0. BEFORE: audit the current state (read-only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Every SECURITY DEFINER function in `public`, its pinned search_path
-- ((unpinned) = MUTABLE), and its ACL. A NULL acl means default privileges,
-- i.e. EXECUTE is still granted to PUBLIC â€” so `anon` can reach it.
-- (Wrapped in a CTE so `search_path` is a real column ORDER BY can sort on;
--  Postgres rejects an output alias used inside an ORDER BY expression.)
with secdef as (
  select
    p.oid::regprocedure                                 as function,
    p.prosecdef                                         as security_definer,
    coalesce(
      (select c from unnest(p.proconfig) c where c like 'search_path=%'),
      '(unpinned)'
    )                                                   as search_path,
    p.proacl                                            as acl
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef
)
select *
from secdef
order by (search_path = '(unpinned)') desc, function::text;

-- â”€â”€ 1. RESTRICT client-facing RPCs to authenticated (+ pin search_path) â”€â”€â”€â”€â”€â”€
do $$
declare
  r record;
  -- Client-called RPCs (verified against every supabase.rpc('â€¦') caller in src).
  -- Each is SECURITY DEFINER and already self-gates on auth.uid(); locking
  -- EXECUTE to `authenticated` removes the anon attack surface (esp. #1).
  restrict_names text[] := array[
    'find_user_by_email',
    'create_group_with_member',
    'join_group_by_code',
    'answer_prayer',
    'sync_add_update',              -- both (uuid,text,text,bool) & p_id overloads
    'sync_add_point',               -- both (uuid,text,jsonb)      & p_id overloads
    'sync_remove_point',
    'sync_add_verse',
    'sync_remove_verse',
    'sync_remove_update_attachment',
    'sync_remove_update_text',
    'sync_set_update_text',
    'sync_delete_update'
  ];
begin
  for r in
    select p.oid::regprocedure as sig, p.prosecdef as secdef,
           exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c
                   where c like 'search_path=%') as has_sp
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any(restrict_names)
  loop
    if r.secdef and not r.has_sp then
      execute format('alter function %s set search_path = public', r.sig);
    end if;
    execute format('revoke all on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated', r.sig);
    raise notice 'restricted -> authenticated: %', r.sig;
  end loop;
end $$;

-- â”€â”€ 2. PIN search_path on the internal helpers (leave EXECUTE as-is) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- These are called INSIDE RLS policies / other definer bodies and return nothing
-- to anon (auth.uid() is null), so there's no access-control gain in revoking
-- anon â€” and doing so could make an anon query that touches a community table
-- error instead of returning empty. We only close the search_path gap (#2).
do $$
declare
  r record;
  helper_names text[] := array[
    'get_my_group_ids',
    'get_my_admin_group_ids',
    'can_sync_prayer',
    'can_remove_shared',
    'resolve_source_prayer'
  ];
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any(helper_names)
      and p.prosecdef
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c
                      where c like 'search_path=%')
  loop
    execute format('alter function %s set search_path = public', r.sig);
    raise notice 'pinned search_path: %', r.sig;
  end loop;
end $$;

-- â”€â”€ 3. OPTIONAL (finding #3): stop create_group_with_member trusting a
--        client-supplied user id. The client already passes its own id, so this
--        keeps the 3-arg signature but derives the actor from auth.uid() and
--        rejects a mismatched p_user_id. Uncomment to apply.
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- create or replace function create_group_with_member(
--   p_name text, p_invite_code text, p_user_id uuid
-- )
-- returns void language plpgsql security definer set search_path = public as $$
-- declare v_group_id uuid; v_uid uuid := auth.uid();
-- begin
--   if v_uid is null then raise exception 'authentication required'; end if;
--   if p_user_id is distinct from v_uid then
--     raise exception 'cannot create a group on behalf of another user';
--   end if;
--   insert into groups (name, invite_code, created_by)
--   values (p_name, p_invite_code, v_uid)
--   returning id into v_group_id;
--   insert into group_members (group_id, user_id, role)
--   values (v_group_id, v_uid, 'admin');
-- end;
-- $$;
-- revoke all on function create_group_with_member(text, text, uuid) from public, anon;
-- grant execute on function create_group_with_member(text, text, uuid) to authenticated;

-- â”€â”€ 4. AFTER: re-run section 0 to confirm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Every function above should now show a pinned `search_path=public` and an ACL
-- that no longer grants EXECUTE to PUBLIC. Also confirm the app still works end
-- to end (add a friend by email, create/join a group, add an update/point/verse,
-- mark a prayer answered) â€” all run as `authenticated`, so all still succeed.
--
-- NOTE: sync_set_update_text lives in update_text_edit.sql; if that file hasn't
-- been run in this database yet, it simply won't exist here and was skipped â€”
-- re-run this script after applying update_text_edit.sql.

-- END LEGACY FILE: supabase/rpc_hardening.sql
