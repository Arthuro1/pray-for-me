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
