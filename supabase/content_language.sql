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
-- column alters none of them.
--
-- Run once in the Supabase SQL editor (safe to re-run: IF NOT EXISTS).

alter table public.prayers            add column if not exists content_language text;
alter table public.prayer_updates     add column if not exists content_language text;
alter table public.prayer_testimonies add column if not exists content_language text;
alter table public.community_prayers  add column if not exists content_language text;
alter table public.community_updates  add column if not exists content_language text;
alter table public.testimonies        add column if not exists content_language text;
