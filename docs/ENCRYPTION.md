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
explicit lock clears memory/session state, removes that account's raw device
copy, and records a user-scoped lock marker. Refresh and sign-in therefore stay
locked until the passphrase or recovery flow succeeds; a successful unlock
stores the same account key on the device again.

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

Every new or changed wrapped record carries a monotonic revision and modification
timestamp. Startup reconciliation imports the newer local/server revision (or
re-pushes a newer local revision after an interrupted upload), and credential
operations re-read IndexedDB so a change made in another browser tab is not
silently replaced by a stale in-memory wrapper. Malformed wrappers fail closed.

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
drafts; prayer-session note drafts; identity private keys; attachment
blobs/metadata; community prayers, updates and testimonies; and wrapped
group-key envelope identity.

## Prayer-session note drafts

A note captured during a prayer session is personal content that may not have
reached the server yet, so its device-local draft is encrypted at rest with the
same guarantees as the guest prayer draft:

- One record per prayer in IndexedDB (`pfm_note_draft:<prayer-id>`), holding the
  note text as an AES-GCM payload and the recording as separately encrypted raw
  bytes. Nothing is written to `localStorage`.
- The key is a **non-extractable** `CryptoKey` persisted alongside the ciphertext
  by structured clone. Where that clone is unavailable the module falls back to
  memory-only rather than downgrading to plaintext at rest.
- Both fields are v2 context-bound: entity `prayer-note-draft`, owner `device`,
  record = prayer ID, field `note-text` / `note-voice`.
- Plaintext metadata is limited to the prayer ID, timestamps, commit status and
  the reserved update ID. Records expire after seven days, and an expired,
  malformed or undecryptable draft is deleted rather than trusted.

Promotion writes the note through the ordinary `addUpdate` path, so the stored
entry inherits the prayer's own protection (account-key ciphertext for a private
prayer), and the recording goes through the ordinary encrypted attachment
pipeline. The local draft is deleted only after the update genuinely exists.

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
