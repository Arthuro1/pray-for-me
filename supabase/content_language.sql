-- Source-language metadata for prayer content (2026-07 persona refinement).
--
-- Purely ADDITIVE: a nullable text column on each content-bearing table. New
-- writes stamp the author's active content/interface language (e.g. 'fr');
-- existing rows stay NULL and keep working — the client falls back to its
-- on-device language heuristic for them. The column is metadata (a BCP-47-ish
-- app language code), never prayer content, so it lives OUTSIDE the E2EE
-- payload exactly like scheduling metadata.
--
-- No RLS changes: every policy on these tables is row-scoped, and adding a
-- column alters none of them. None of these six tables uses column-level
-- GRANTs either, so no privilege has to be re-granted for the new column.
--
-- ── RELEASE ORDER: RUN THIS *BEFORE* DEPLOYING THE CLIENT ─────────────────────
-- Not optional, and not reversible after the fact. The client writes
-- content_language on every prayer/update/testimony create. Against a database
-- without the column PostgREST answers 400, which the offline queue classifies
-- as a PERMANENT failure (see isPermanentError in src/lib/queueCore.js) and
-- DROPS the mutation — so a client deployed ahead of this migration would
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

-- Verification — expect 6 rows, every one is_nullable = YES, data_type = text.
-- If this returns fewer than 6, DO NOT deploy the client yet.
--
--   select table_name, data_type, is_nullable
--   from information_schema.columns
--   where table_schema = 'public'
--     and column_name = 'content_language'
--     and table_name in ('prayers', 'prayer_updates', 'prayer_testimonies',
--                        'community_prayers', 'community_updates', 'testimonies')
--   order by table_name;
