# Encryption and recovery lifecycle

## Automatic encryption

On first authenticated use the browser generates a 256-bit AES-GCM account
content key. Personal content is encrypted before Supabase writes. The raw key
is kept per user in IndexedDB (`pfm_ak_<user-id>`) and, while unlocked, in
tab-scoped `sessionStorage` (`pfm_vault_session:<user-id>`). This gives transparent
same-device access. It is not a defense against XSS, malicious deployed
JavaScript, device compromise, or another person using an unlocked profile.

Sign-out clears user-scoped offline snapshots and in-memory data,
and legacy Workbox caches. The account key remains for the next sign-in on that
device. Account deletion removes it. Idle auto-lock is disabled by default;
explicit lock clears memory/session state, removes that account's raw device
copy, and records a user-scoped lock marker. Refresh and sign-in therefore stay
locked until the passphrase or recovery flow succeeds; a successful unlock
stores the same account key on the device again.

Wrapped recovery backups and pending account-owned mutations survive ordinary
sign-out. Account deletion removes that account's records. Older global
`pfm_vault` backups remain unassigned until the candidate key is verified against
the signed-in account's historical ciphertext; they are never uploaded as the
next person's backup. An old global raw session key is never attributed to a
new login. Missing or uncertain encryption metadata blocks key provisioning.

Pending mutations carry their account ownership. Queue persistence applies
atomic IndexedDB deltas so a stale tab cannot erase another tab's unsent
ciphertext. Terminal encrypted failures are retained for repair rather than
dropped. Journal hydration reconciles owned pending ciphertext before making
cached content editable, including offline startup after a lock. This preserves
pending sensitive fields when a later edit rewrites their encrypted bundle.
The existing sync model still uses last-write-wins records across independent
writers; this feature does not add a conflict history or globally ordered edits.

## Prayer protection and recovery

Prayer protection is the single settings destination for encryption access and
recovery. When passkey enrollment is available, a passkey is the recommended
first action. The person uses their device's authentication prompt instead of
creating another encryption password or remembering a recovery code. Existing
passphrase recovery remains available inside this destination for older accounts;
it is not a second encryption feature or a required setup step.

An emergency code is an optional additional backup for passkey recovery. It must
be saved somewhere accessible independently of the original device, such as a
password manager or a recovery file, rather than memorized. Saving the code does
not activate it: the client verifies the saved copy against the server's wrapped
key before reporting completion. Automatic device locking can use a passkey
reported as backed up by its provider or a separately tested additional passkey;
the optional emergency backup is another fallback, not a required code step.

Both the older passphrase route and the new passkey route wrap the same existing
account key. Changing recovery methods does not re-encrypt or replace prayers.
An account sign-in restores the authenticated session; accessing encrypted
content on a new device additionally requires a usable passkey, saved backup or
existing legacy recovery credential. A device with no local key may still have
passkey recovery available even if no legacy `vault_keys` record exists.

A saved usable passkey can restore the original account key without the old
passphrase or recovery code. Adding a passkey later requires an unlocked device
that still has that original key. Fingerprint, face or device PIN authorizes a
registered passkey; it cannot reconstruct a lost key or retroactively recover
old ciphertext when no usable recovery method or accessible device remains.

## Legacy passphrase recovery

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
Equal-revision divergent records remain unresolved; client clocks do not choose
a winner or discard either recovery wrapper.

Scoped legacy backups use IndexedDB `pfm_vault:<user-id>`. Publication uses the
authenticated `compare_and_swap_vault_record` RPC and an independent server
readback. Conflicts or failed readbacks remain sync-pending; the UI does not report
a cross-device backup as ready. Older clients can still write `vault_keys` using
their legacy API, so their concurrency behavior remains a rollout consideration.

Legacy cross-device recovery requires the synced wrapped record plus either the
passphrase or its recovery code. New independent methods can also restore the
same key as described below. If no usable recovery method exists, only a device
that still has the account key can add recovery. Losing every device key and all
usable recovery methods makes ciphertext unrecoverable.

## Passkey and emergency recovery (enrollment disabled by default)

`VITE_PRAYER_PROTECTION_ENABLED` and server-side
`RECOVERY_ENROLLMENT_ENABLED` must both be explicitly enabled to enroll. The
production RP ID is `qetoret.com`, with exactly `https://qetoret.com` accepted as
the browser origin. Enrollment on preview, www or old Praystead origins is not
supported. Existing enrolled readers, assertions and offline device unlock remain
available after the flags are disabled.

For isolated PC testing, `npm run dev:recovery-test` permits exactly
`http://localhost:5173` / RP ID `localhost`, only with development mode and both
explicit localhost opt-ins. Its separate environment directory and loopback
database do not inherit production credentials; production builds of that mode
are refused. Wrapper validation uses the trusted environment's RP ID, so local
and production passkey wrappers are not interchangeable. See
[RECOVERY_LOCAL_TEST.md](RECOVERY_LOCAL_TEST.md) for setup.

Each new method wraps the original account key independently in
`account_key_recovery_methods`. The unified settings interface replaces the old
Prayer Vault entry, while retaining existing legacy wrappers for compatibility.
The version 1 method format is separate from legacy vault versions. It uses
AES-256-GCM with a fresh 12-byte nonce and AAD containing the format, account,
method and KDF context.
Passkey PRF output remains client-side, feeding HKDF-SHA-256 with a random 32-byte
salt and domain separation. Emergency-only recovery uses a fresh 128-bit code,
PBKDF2-SHA-256 with 600,000 iterations and a 32-byte salt. No encryption
passphrase is needed for these new methods. Code, raw key and PRF output are never
sent to the server.

The server uses pinned SimpleWebAuthn verification for registration/assertions,
including exact origin, RP ID, signature, user verification, ownership, expiry
and single-use challenge enforcement. Server-only credentials, challenges and
durable account rate limits have no anonymous or authenticated-client grants.
Owner RLS permits reading available encrypted method records. Every mutation uses
an expected revision, and zero-counter authenticators use credential revision CAS.

Registration alone leaves a method pending. The client must read its wrapper
back, unwrap via a new assertion or re-entered saved code, and prove the original
key before activation. Restoration verifies the existing encrypted identity
private key and a historical encrypted prayer where present before installing a
candidate. This is key-match evidence, not an audit of every stored item. A
server without the secret cannot certify decryption: verification metadata is
explicitly client-reported. The UI distinguishes a recorded recovery check from
"Tested on this device" in the current unlocked session. Provider backup flags
are authenticated metadata about the credential, not evidence that prayer
recovery has been tested on another device. The interface reports that metadata
separately and advises a real second-device recovery test. Access on a replacement
device also depends on the provider account and support for the same passkey PRF.

## Protected device access

Enabling protected access requires a currently usable passkey PRF wrapper and a
recovery fallback: a provider-reported backed-up passkey, a distinct additional
passkey checked against the same account key, or an independently re-tested
optional emergency backup. No passphrase or recovery code is required for the
passkey routes. A same-device passkey check proves access to the current key,
not recovery after losing that device; backup metadata and additional passkeys
must not be described as proof of a successful second-device restore.
Account-scoped Web Locks serialize protection enable/disable/revocation across
tabs; transitions fail closed when unavailable.

The encrypted local wrapper and random authenticated witness are written/read
back before the durable `pfm_device_protected_<user-id>` policy is enabled. Raw
IndexedDB/session copies are then drained, deleted and checked. The local
`cleanupVerified` state is set only after readback; interruption reports
verification required. Protected policy blocks raw hydration, remembering,
session mirroring and automatic replacement-key provisioning even with all
enrollment flags off. Refresh/close locks; protected accounts also lock after
five minutes of inactivity, with wall-clock expiry checked on resume. An unlock
does not recreate raw copies. Other open current-version tabs receive storage
policy/lock events. Older clients that ignore this policy remain a rollout risk.

New-device recovery requires network access. A previously enrolled device can
unlock offline using PRF and its authenticated local witness, provided its app and
authenticated account session remain available. Online unlock checks server
revocation; a disconnected device cannot learn revocation immediately. The OS
chooses fingerprint, face, device PIN or another verification method; Qetoret
receives no biometric templates and makes no hardware-backing guarantee.

Lost credential providers, storage eviction and copied offline wrappers remain
risks. Revocation prevents future service use but cannot erase keys or wrappers
already copied. Losing every device and every independent recovery secret remains
irreversible. Custom QR transfer is deferred until a separately reviewed pairing
protocol is available. See [RECOVERY_RELEASE.md](RECOVERY_RELEASE.md).

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

A personal row this device cannot decrypt (`_locked`) is never re-encrypted —
not by an edit, not by saved guidance, not by the device cache. Its fields in
memory are redacted placeholders; an edit to it writes metadata only (a pin, a
schedule), and the cache keeps the ciphertext it arrived with.

## Carried group requests

"Carry this prayer" saves a copy of a group request into the carrier's own list
(`prayers.community_origin_id`). The group's original stays under the group key
in `community_prayers`. The copy — its snapshot of the title, description and
prayer points, and the circle the carrier places it in — is stored under the
carrier's **account key**, like their own prayers (personal-prayer /
prayer-point contexts, owner = the carrier). Its points get fresh ids, because
the group copy's point ids are the author's own rows.

- On load the copy mirrors the group's current text in memory only; nothing is
  written back. A copy this device cannot open stays locked and mirrors only the
  group's answered state, so group text is never held beside ciphertext the
  device cannot re-encrypt.
- The carrier's circle never reaches a community table or RPC, the group or the
  author (`src/store/noPlaintextLeak.test.js`).
- Copies carried before this change were written in plaintext. The vault
  migration (Privacy center → "Protect them") now counts and encrypts them with
  the rest of the private history; it no longer skips `community_origin_id`.
- A carrier with no account key in memory still carries the prayer as a
  plaintext row, exactly like any prayer saved then; it cannot hold a circle
  until the migration encrypts it.

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
