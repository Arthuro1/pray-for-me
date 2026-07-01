-- Group-scoped shared cache for on-demand community translations.
--
-- Before: every member who tapped "See translation" on a shared request re-ran
-- (and re-paid for) the same AI translation. Now the first member's translation
-- is reused by the rest of the group.
--
-- Privacy: this is safe precisely because it's scoped to a single group — the
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

-- Only members of the group may read its cached translations…
drop policy if exists "Members read group translations" on community_translations;
create policy "Members read group translations" on community_translations
  for select using (group_id in (select get_my_group_ids()));

-- …and only members may contribute one.
drop policy if exists "Members write group translations" on community_translations;
create policy "Members write group translations" on community_translations
  for insert to authenticated with check (group_id in (select get_my_group_ids()));
