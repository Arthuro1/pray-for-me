-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Categories
create table categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  emoji text default '🙏',
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

-- Prayer updates (évolutions)
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
  verse text default '',
  verse_text text default '',
  created_at timestamptz default now()
);

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
