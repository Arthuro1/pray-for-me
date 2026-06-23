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

-- community_prayers: group members only
create policy "Group members can read prayers" on community_prayers
  for select using (group_id in (select get_my_group_ids()));
create policy "Group members can post prayers" on community_prayers
  for insert with check (
    group_id in (select get_my_group_ids()) and user_id = auth.uid()
  );

create policy "Authors can update their prayers" on community_prayers
  for update using (user_id = auth.uid())
  with check (group_id in (select get_my_group_ids()) and user_id = auth.uid());
create policy "Authors can delete their prayers" on community_prayers
  for delete using (user_id = auth.uid());

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
