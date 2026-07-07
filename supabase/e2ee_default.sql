-- ── Default end-to-end encryption: crypto key tables + community payloads ─────
-- Phase 1 of the "encryption by default" model. Personal prayer content is
-- already encrypted client-side with an account content key (ACK); this file
-- adds the SERVER-SIDE storage the community/group encryption (Phase 2) needs,
-- plus each user's asymmetric identity keypair used to wrap group keys.
--
-- The server never stores a readable content key or an unwrapped private key:
--   • user_crypto_keys.encrypted_private_key  — private key wrapped by the ACK
--   • group_member_keys.encrypted_group_key   — group key wrapped to a member's
--                                                RSA public key
-- Only ciphertext + public keys live here. Idempotent — safe to re-run.

-- ── Per-user identity keypair ─────────────────────────────────────────────────
-- public_key_jwk        — RSA-OAEP public key, readable by any authenticated
--                         user (via the public_keys view) so group keys can be
--                         wrapped to it. Never sensitive.
-- encrypted_private_key — the RSA private key (pkcs8) encrypted with the user's
--                         account content key. Readable ONLY by its owner.
create table if not exists user_crypto_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_key_jwk jsonb not null,
  encrypted_private_key jsonb,
  key_version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_crypto_keys enable row level security;

-- Owner-only access to the full row (which includes encrypted_private_key).
do $$ begin
  create policy "own crypto key select" on user_crypto_keys
    for select using (user_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own crypto key insert" on user_crypto_keys
    for insert with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own crypto key update" on user_crypto_keys
    for update using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Public keys are readable by every authenticated user. A view (owner rights,
-- so it bypasses the table's owner-only RLS) exposes ONLY the non-sensitive
-- columns — encrypted_private_key is never selectable through it.
create or replace view public_keys as
  select user_id, public_key_jwk from user_crypto_keys;
grant select on public_keys to authenticated;

-- ── Group content key versions ────────────────────────────────────────────────
-- One row per (group, version). Forward-only rotation bumps `version`; existing
-- content keeps its own key_version and stays readable to members who still hold
-- that wrapped key. The key material itself is NOT stored here — only the fact a
-- version exists and who created it. Members hold wrapped copies in
-- group_member_keys.
create table if not exists group_key_versions (
  group_id uuid references groups(id) on delete cascade,
  version int not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  primary key (group_id, version)
);

alter table group_key_versions enable row level security;

do $$ begin
  create policy "members read key versions" on group_key_versions
    for select using (group_id in (select get_my_group_ids()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "members create key versions" on group_key_versions
    for insert with check (
      group_id in (select get_my_group_ids()) and created_by = auth.uid()
    );
exception when duplicate_object then null; end $$;

-- ── Wrapped group keys (per member, per version) ──────────────────────────────
-- encrypted_group_key — the group content key wrapped (RSA-OAEP) to this
-- member's public key. Readable ONLY by that member; nobody can read another
-- member's wrapped key.
create table if not exists group_member_keys (
  group_id uuid references groups(id) on delete cascade,
  key_version int not null,
  user_id uuid references auth.users(id) on delete cascade,
  encrypted_group_key jsonb not null,
  created_at timestamptz default now(),
  primary key (group_id, key_version, user_id)
);

alter table group_member_keys enable row level security;

-- A member can read only their OWN wrapped group key.
do $$ begin
  create policy "read own wrapped group key" on group_member_keys
    for select using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Any member of the group may create wrapped-key rows for co-members. This is
-- how the group key is handed to a member: an existing key-holder wraps it to
-- the newcomer's public key and inserts the row. (The newcomer still can't read
-- OTHER members' rows — only their own, per the select policy above.)
do $$ begin
  create policy "members wrap keys for the group" on group_member_keys
    for insert with check (group_id in (select get_my_group_ids()));
exception when duplicate_object then null; end $$;

-- A member can remove their own wrapped key (leaving), and group admins can
-- revoke a removed member's access.
do $$ begin
  create policy "revoke wrapped group keys" on group_member_keys
    for delete using (
      user_id = auth.uid() or group_id in (select get_my_admin_group_ids())
    );
exception when duplicate_object then null; end $$;

-- ── Encrypted payload columns on community content ────────────────────────────
-- Phase 2 moves sensitive community content (title, description, prayer points,
-- updates, testimonies, guidance) into encrypted_payload and blanks the
-- plaintext columns. Added now so the client can start writing them; legacy
-- plaintext rows (no encrypted_payload) still read during the migration window.
alter table community_prayers add column if not exists encrypted_payload jsonb;
alter table community_prayers add column if not exists encryption_version int;
alter table community_prayers add column if not exists key_version int default 1;

alter table community_updates add column if not exists encrypted_payload jsonb;
alter table community_updates add column if not exists encryption_version int;
alter table community_updates add column if not exists key_version int default 1;

alter table testimonies add column if not exists encrypted_payload jsonb;
alter table testimonies add column if not exists encryption_version int;
alter table testimonies add column if not exists key_version int default 1;
