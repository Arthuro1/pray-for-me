-- ════════════════════════════════════════════════════════════════════════
-- RLS audit & hardening — run in the Supabase SQL editor (idempotent).
--
-- Purpose: the base schema's RLS was not all committed to the repo, so the
-- live DB must be verified. This script (1) reports any public table missing
-- row-level security, then (2) re-asserts RLS + owner-only policies on every
-- user-owned table — including `translations`, which had no committed RLS.
--
-- Safe to re-run. It does NOT touch the community/social policies (defined in
-- community_schema.sql + security_hardening.sql); it only ENABLES RLS on those
-- so a table can never be left world-readable.
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. VERIFY: list any public table without RLS enabled ─────────────────────
-- Run this first. Every row returned is a table where ANY authenticated user
-- could read/write ALL rows. The hardening below should leave this empty for
-- the user-owned tables.
select n.nspname as schema, c.relname as table_name
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity = false
order by c.relname;

-- ── 2. ENABLE RLS on every user-owned / social table (idempotent) ────────────
do $$
declare
  t text;
  tables text[] := array[
    'categories', 'prayers', 'prayer_updates', 'prayer_points', 'prayer_testimonies',
    'translations', 'feedback', 'push_subscriptions', 'vault_keys',
    'groups', 'group_members', 'group_member_prefs', 'group_invitations',
    'community_prayers', 'community_updates', 'prayer_reactions', 'testimonies',
    'profiles', 'friendships', 'friend_requests'
  ];
begin
  foreach t in array tables loop
    if exists (select 1 from pg_tables where schemaname = 'public' and tablename = t) then
      execute format('alter table public.%I enable row level security;', t);
    end if;
  end loop;
end $$;

-- ── 3. RE-ASSERT owner-only policies on the core user-owned tables ───────────
-- `with check` is set explicitly so INSERT/UPDATE can never assign a row to
-- another user. Dropping first keeps this idempotent.

-- categories ─────────────────────────────────────────────────────────────────
drop policy if exists "Users manage own categories" on categories;
create policy "Users manage own categories" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- prayers ─────────────────────────────────────────────────────────────────────
drop policy if exists "Users manage own prayers" on prayers;
create policy "Users manage own prayers" on prayers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- prayer_updates (owned via the parent prayer) ───────────────────────────────
drop policy if exists "Users manage own updates" on prayer_updates;
create policy "Users manage own updates" on prayer_updates
  for all
  using (prayer_id in (select id from prayers where user_id = auth.uid()))
  with check (prayer_id in (select id from prayers where user_id = auth.uid()));

-- prayer_points (owned via the parent prayer) ────────────────────────────────
drop policy if exists "Users manage own points" on prayer_points;
create policy "Users manage own points" on prayer_points
  for all
  using (prayer_id in (select id from prayers where user_id = auth.uid()))
  with check (prayer_id in (select id from prayers where user_id = auth.uid()));

-- prayer_testimonies (owned via the parent prayer; Phase 3c) ─────────────────
drop policy if exists "Users manage own testimonies" on prayer_testimonies;
create policy "Users manage own testimonies" on prayer_testimonies
  for all
  using (prayer_id in (select id from prayers where user_id = auth.uid()))
  with check (prayer_id in (select id from prayers where user_id = auth.uid()));

-- translations (per-user cached machine translations; no committed RLS) ───────
-- Adjust the owner column name if the live table differs from `user_id`.
drop policy if exists "Users manage own translations" on translations;
create policy "Users manage own translations" on translations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 4. RE-VERIFY ─────────────────────────────────────────────────────────────
-- Re-run the query from section 1; the user-owned tables should no longer
-- appear. (Community tables rely on their own policies — verify those exist
-- with: select tablename, policyname from pg_policies where schemaname='public';)
