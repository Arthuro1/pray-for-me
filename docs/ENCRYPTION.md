# Encryption and recovery lifecycle

## Automatic encryption

On first authenticated use the browser generates a 256-bit AES-GCM account
content key. Personal content is encrypted before Supabase writes. The raw key
is kept per user in IndexedDB (`pfm_ak_<user-id>`) and, while unlocked, in
tab-scoped `sessionStorage` (`pfm_vault_session`). This gives transparent
same-device access. It is not a defense against XSS, malicious deployed
JavaScript, device compromise, or another person using an unlocked profile.

Sign-out clears user-scoped offline snapshots, mutation queues, in-memory data,
and legacy Workbox caches. The account key remains for the next sign-in on that
device. Account deletion removes it. Idle auto-lock is disabled by default;
explicit lock clears memory/session state.

## Optional passphrase recovery

Recovery setup does not replace or re-encrypt the account key. It wraps the same
key with AES-GCM under PBKDF2-SHA-256 derived keys (310,000 iterations): one from
the passphrase and one from the recovery code. Supabase receives only the
versioned wrapped record and salts. It never receives the passphrase, recovery
code, or raw account key.

Version 2 recovery codes use 16 bytes from `crypto.getRandomValues` (128 bits),
encode the complete bit stream with Crockford Base32, normalize to 26 characters,
and display as `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-X`. The code is displayed once;
users must store it separately. Version 1 records accept their legacy
16-character codes. A successful rotation preserves the content key, writes a
version 2 recovery wrapper, and invalidates the prior code.

Cross-device recovery requires the synced wrapped record plus either the
passphrase or recovery code. If no recovery record exists, only a device that
still has the account key can add recovery. Losing every device key and both
recovery credentials makes ciphertext unrecoverable.

## Ciphertext versions

- v1: AES-GCM IV and ciphertext, without application AAD. Read-only compatibility
  remains.
- v2: AES-GCM with canonical UTF-8 JSON AAD:
  `[schemaVersion, entityType, ownerOrGroupId, recordId, parentId, keyVersion, field]`.

New IDs are generated before encryption. Decryption reconstructs the identical
context and fails closed on owner, group, record, parent, field, or key-version
changes. Personal v1 rows are queued for a v2 rewrite only after successful
authenticated decryption; a failed or locked row is never rewritten. Community
v1 content remains readable and is upgraded on a later safe content rewrite.

The binding covers personal prayers, updates, points and testimonies; guest
drafts; identity private keys; attachment blobs/metadata; community prayers,
updates and testimonies; and wrapped group-key envelope identity.

## Encrypted translation cache

Machine translations of prayer content (personal and community) are cached so a
text is not re-translated on every view. This cache is **encrypted at rest** and
never stores the source or translated text in plaintext.

- **Lookup key — keyed HMAC.** The source text is not stored. Instead each row is
  keyed by `source_hmac = HMAC-SHA256(source)`, where the HMAC key is HKDF-derived
  (info-separated from the AES key) from the user's **account key** for the private
  cache (`translations`), or the **group key** for the shared cache
  (`community_translations`). The server can therefore look up a translation by
  source without ever seeing the source, and two different keys never collide.
- **Ciphertext.** The translated text is AES-256-GCM encrypted (stored as
  `encrypted_translation` + `nonce`) under the same account/group key, with the
  v2 AAD context bound to the scope (owner/group, `source_hmac`, target language,
  and — for community rows — the group key version).
- **Invalidation.** Because `source_hmac` is deterministic per source, editing the
  source produces a different hmac and the stale row is simply never matched again;
  an `expires_at` TTL (90 days) sweeps orphans via `cleanup_expired_translations()`.
  Community rows follow the group cascade and are superseded after key rotation
  (new translations use the current key version).
- **Legacy plaintext.** The previous plaintext `translations` /
  `community_translations` tables are dropped by the migration
  `20260804120000_encrypted_translations.sql`. The server cannot re-encrypt old
  rows (keys are client-side), so no plaintext is migrated and none survives;
  clients repopulate encrypted rows on demand.
- **In memory.** While unlocked, translations are held in a plaintext in-memory
  cache keyed by source text (the same trust boundary as decrypted prayers). It is
  cleared on sign-out, account switch, vault lock, and AI consent withdrawal.

Verse text is never sent through translation — authoritative Scripture wording
comes only from the bundle / YouVersion. See `src/lib/crypto/translationCrypto.js`
and `src/store/translationStore.js`.

## Group keys and forward secrecy

Each group key version is distributed as a per-member RSA-OAEP envelope. The
envelope includes group ID, member ID, and version. `create_group_key_version`
atomically validates membership/admin status, locks the group, checks the exact
next version, inserts the version and creator envelope, and records an
idempotency key. `remove_group_member_and_rotate` atomically removes membership
and that member's envelopes, then creates the next version and creator envelope.

The creator subsequently distributes the new envelope to remaining members via
`distribute_group_key`, which accepts current members only. A newcomer may be in
an “awaiting keys” state until an existing key holder distributes envelopes.
Removed members cannot receive new envelopes and cannot decrypt future content.
They may retain historical keys/content already received: this is forward
rotation, not retroactive erasure.

Admins can call `detect_orphaned_group_key_versions`. The repair RPC deletes
only orphan versions unused by encrypted content. A content-bound orphan is
reported for manual restoration from a legitimate member's device/backup; it is
never silently deleted.
