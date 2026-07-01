-- ════════════════════════════════════════════════════════════════════════
-- Phase 3c — Testimony E2EE migration. Run in the Supabase SQL editor
-- BEFORE deploying the matching client (the app selects `prayer_testimonies`,
-- so the table + FK must exist first). Idempotent and NON-BREAKING: the old
-- client never touches this table, and every existing row keeps its plaintext.
--
-- Personal testimonies used to live on `prayers.testimonies` (a jsonb[] column
-- appended server-side by the answer_prayer RPC in offline_conflict_hardening.sql)
-- and, before that, the scalar `prayers.testimony`. Both were the LAST private
-- prayer content stored server-side in plaintext for vault users. This migration
-- moves them to their own child table so that:
--   • an append is a plain row INSERT — conflict-free without the RPC hack, so the
--     offline concurrent-loss guarantee is preserved by construction; and
--   • each row can be E2E-encrypted for PRIVATE prayers exactly like
--     prayer_updates / prayer_points (Phase 3b) — content redacted to '' with the
--     ciphertext in encrypted_payload (see src/lib/crypto/prayerCrypto.js).
--
-- DEPRECATION: after this runs, `answer_prayer`, `prayers.testimonies` and
-- `prayers.testimony` are READ-ONLY LEGACY. The client stops writing them and
-- reads them only as a fallback (deduped by id in utils/prayer.js testimonyList).
-- They are left in place so an un-refreshed old client still works during
-- rollout; drop them in a follow-up migration one release later.
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. Table ─────────────────────────────────────────────────────────────────
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

-- ── 2. RLS: owner-via-parent (copied from the prayer_updates policy) ──────────
alter table prayer_testimonies enable row level security;

drop policy if exists "Users manage own testimonies" on prayer_testimonies;
create policy "Users manage own testimonies" on prayer_testimonies
  for all
  using (prayer_id in (select id from prayers where user_id = auth.uid()))
  with check (prayer_id in (select id from prayers where user_id = auth.uid()));

-- ── 3. Backfill existing testimonies (idempotent, PLAINTEXT) ──────────────────
-- These legacy testimonies were never encrypted, so they are copied as plaintext.
-- The app re-encrypts on the next save of a private prayer (nothing forces it).

-- 3a. jsonb[] array entries → rows, keyed on their existing id so re-runs and the
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

-- 3b. legacy scalar prayers.testimony → row, with a DETERMINISTIC id derived from
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
