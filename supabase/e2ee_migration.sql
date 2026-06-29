-- ════════════════════════════════════════════════════════════════════════
-- End-to-end encryption migration — run in the Supabase SQL editor.
-- Idempotent and NON-BREAKING: every column is nullable and existing rows keep
-- their plaintext until the owner edits them with the vault unlocked.
--
-- What it adds:
--   1. encrypted_payload + encryption_version on prayers (and the child tables,
--      pre-added so Phase 3b needs no second migration).
--   2. vault_keys: stores ONLY the user's *wrapped* master key (ciphertext) so
--      the Prayer Vault works across devices. This is NOT the key and NOT the
--      passphrase — the server cannot decrypt anything with it (zero-knowledge).
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. Encrypted payload columns ─────────────────────────────────────────────
-- encrypted_payload holds { v, iv, ct } produced by src/lib/crypto/e2ee.ts.
-- When it is set, the plaintext columns (title, description, person_name, phone)
-- are redacted to '' on the server — the real values live only in the ciphertext.
alter table prayers add column if not exists encrypted_payload jsonb;
alter table prayers add column if not exists encryption_version int;

-- Child tables (used in Phase 3b: updates, points). Added now for forward-compat.
alter table prayer_updates add column if not exists encrypted_payload jsonb;
alter table prayer_updates add column if not exists encryption_version int;
alter table prayer_points  add column if not exists encrypted_payload jsonb;
alter table prayer_points  add column if not exists encryption_version int;

-- ── 2. Cross-device vault key sync ───────────────────────────────────────────
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
