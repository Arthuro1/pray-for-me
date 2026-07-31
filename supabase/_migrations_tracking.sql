-- ─────────────────────────────────────────────────────────────────────────────
-- Schema-migration tracking.  RUN THIS FIRST (once per environment).
--
-- The problem this solves: the 40+ SQL files in this folder are applied by hand
-- in the Supabase SQL editor, and "which ones are live in prod" has been tracked
-- only in a developer's head / notes. This table makes prod state *queryable
-- from the database itself* — the single source of truth, not memory.
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
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.schema_migrations (
  filename    text primary key,       -- e.g. 'content_language.sql'
  applied_at  timestamptz not null default now(),
  note        text                     -- optional: 'backfilled', PR link, etc.
);

comment on table public.schema_migrations is
  'One row per applied supabase/*.sql migration. Source of truth for what is live in this environment. See docs/DEPLOY.md.';

-- Metadata only — no anon/authenticated access. RLS on with no policies means
-- the table is invisible to app users; the service role (SQL editor, Edge
-- Functions) bypasses RLS and can read/write it.
alter table public.schema_migrations enable row level security;

-- ── One-time backfill ────────────────────────────────────────────────────────
-- If some migrations are already applied in this environment, record them so the
-- table reflects reality from day one. Uncomment and keep ONLY the files that are
-- genuinely already live here (see docs/DEPLOY.md for the full list), then run:
--
--   insert into public.schema_migrations (filename, note) values
--     ('community_schema.sql', 'backfilled'),
--     ('migration.sql',        'backfilled'),
--     ('e2ee_migration.sql',   'backfilled')
--     -- …add every file already applied in this environment…
--   on conflict (filename) do nothing;

-- ── Footer template (paste at the end of each migration file) ─────────────────
--   insert into public.schema_migrations (filename)
--   values ('THIS_FILE_NAME.sql')
--   on conflict (filename) do nothing;

insert into public.schema_migrations (filename)
values ('_migrations_tracking.sql')
on conflict (filename) do nothing;
