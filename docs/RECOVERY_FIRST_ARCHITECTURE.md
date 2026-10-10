# Recovery-first prayer protection: initial assessment

Date: 2026-10-09. Status: initial assessment retained as design rationale.
This assessment describes the local checkout, not a deployed-system audit.
The tables and gap analysis below describe the checkout before this feature.
Implementation subsequently proceeded behind default-disabled flags. The current
behavior and release gates are in [RECOVERY_RELEASE.md](RECOVERY_RELEASE.md),
[ENCRYPTION.md](ENCRYPTION.md) and [THREAT_MODEL.md](THREAT_MODEL.md).

## Priority and acceptance gate

Preserve the original account content key and prove restoration of existing
ciphertext before building the device-unlock interface. Successful sign-in,
credential registration, local configuration or an acknowledged upload does not
prove that prayer history can be recovered after losing the original device.

The primary acceptance journey uses disposable test accounts and synthetic data:

1. Save private prayers, updates, testimonies and an encrypted attachment; create
   an identity and receive historical group-key envelopes.
2. Add a recovery method without changing the account key or existing methods.
3. Read its encrypted wrapper back from the server and independently recover the
   key; verify it against existing authenticated ciphertext.
4. In a separate browser profile/device with no raw key, session mirror, cached
   wrapper or decrypted state, sign in and obtain the server recovery record.
5. Recover the original key and decrypt the existing content, identity private
   key, historical group envelopes and attachment metadata/file.
6. Repeat with the original device unavailable. A hybrid passkey flow that still
   requires that lost phone is not evidence of lost-phone recovery.
7. Exercise failure, cancellation, revocation, storage eviction, interrupted
   sync, concurrent edits, account changes and rollback without losing access.

Never erase a person's real browser storage to perform this test. A second-device
test demonstrates the tested environment at that time, not a lifetime guarantee
about a credential provider. Encourage an independent emergency method.

## Existing architecture

| Area | Observed implementation |
|---|---|
| Account key | `src/lib/crypto/accountKey.js` provisions a random AES-256-GCM key automatically, restores a device/session key, or gates access. Recovery wraps the same key. |
| Device persistence | Raw Base64 key in user-scoped IndexedDB `pfm_ak_<user-id>`; unlocked key also in global tab-scoped `pfm_vault_session`. Raw device keys intentionally survive explicit sign-out; account deletion removes them. |
| Recovery record | One `pfm_vault` local record and one `vault_keys` row per user. V1/V2 records contain `passSalt`, `recoverySalt`, `passWrapped:{iv,data}`, `recoveryWrapped:{iv,data}` and optional `revision`/`updatedAt`. |
| Recovery encryption | PBKDF2-SHA-256 with 310,000 iterations and independent 16-byte salts; AES-GCM wrapping with 12-byte nonces. V2 recovery codes contain 128 random bits encoded as 26 Crockford Base32 characters. Legacy V1 codes remain readable. |
| Server sync | `src/lib/vaultSync.js` reads and upserts the whole wrapped record. RLS restricts the row to `auth.uid() = user_id`. The server receives wrapped keys, not the plaintext account key. |
| Authentication | Supabase Google OAuth, email/password and email-link sign-in. These establish account authorization but cannot independently reconstruct the encryption key. |
| Startup | `src/AuthenticatedApp.jsx` pulls recovery then calls `ensureAccountCryptoReady`. `LOCKED` uses existing credentials; `ORPHANED` means encrypted server state without available recovery; `UNAVAILABLE` preserves uncertainty and offers retry. |
| Explicit lock | A user-scoped lock marker blocks automatic restoration; the raw device copy is removed and the in-memory/session key cleared. Default inactivity auto-lock is off. |
| Identity/group access | RSA identity private key is encrypted under the account key; group keys arrive as RSA-OAEP envelopes. Keeping the original account key preserves the existing recovery chain. |
| Domain migration | Source names `qetoret.com`/`www.qetoret.com` and the old `praystead.com` domains. Android source targets `qetoret.com`; actual deployed app status is unverified. Origin migration has a useful read-only same-key recovery check. |

The legacy wrapper does not carry explicit KDF parameters or authenticated
account/key identity metadata. Keep its decoder unchanged for compatibility;
design a separate versioned format for new methods.

## Recovery and lifecycle gaps to address first

These are code-review findings, not claims that exploit tests have already run.

1. **Candidate key acceptance.** Device/session import and passphrase/code unwrap
   accept a syntactically valid key without independently verifying historical
   ciphertext. A valid wrapper for an unrelated key can report successful unlock.
   `verifyRecoveryPassphrase` already performs a same-key challenge, but only the
   origin-migration flow currently uses it.
2. **Account isolation.** External auth changes clear AI/group/identity caches but
   do not synchronously invalidate the key-manager singleton. Startup accepts an
   already loaded key and can remember it under the next user ID. Cancellation
   in the authenticated shell is checked after crypto mutations.
3. **Asynchronous secret resurrection.** Session-key export/persistence is fired
   without awaiting or an operation-generation guard. A pending export can write
   after lock clears storage. Long-running unlock/reset/change operations likewise
   need account and lifecycle guards before committing state.
4. **Nontransactional recovery replacement.** Sync unconditionally upserts one
   whole row. Client revision/timestamp comparison does not prevent concurrent
   writers overwriting each other's credentials. Setup and rotation modify the
   local wrapper before verified server persistence. Reset/change discard sync
   failure, and sign-out removes the pending local wrapped record.
5. **Insufficient backup proof.** Push success is a write acknowledgement, not
   a read-back and independent recovery test. Pull can report a present server
   record even when publication of a newer local record fails. Structural parsing
   accepts nonempty strings without validating actual encoded lengths.
6. **One-time code visibility.** The recovery banner returns nothing when its
   eligibility becomes false. Setup flips `initialized` before sync completes,
   which can unmount its modal before the one-time recovery code is displayed.
7. **Incomplete lost-key evidence.** New-key prevention inventories identity
   rows and encrypted parent prayers, but not all protected child/media/local
   pending state. Unknown state must remain unavailable, never permission to
   mint a replacement key.
8. **Readiness and reminders.** Settings currently show initialized/unlocked,
   not synced/tested/second-device status. Banner dismissal is origin-wide and
   can suppress another account's reminder. Casual dismissal must not permanently
   remove essential recovery communication.

## Proposed trust boundaries and implementation order

### Phase 1: verified recovery foundation

- Bind all key state, hydration, session mirrors and asynchronous operations to
  an account ID and lifecycle generation. Lock/account change invalidates pending
  jobs immediately; stale jobs cannot install, persist or upload keys/wrappers.
  Migrate unscoped legacy state conservatively rather than attributing it to
  whichever account happens to sign in next.
- Separate candidate unwrapping from key installation. Verify a candidate against
  owner-bound existing encrypted identity/content before committing it. Fail
  closed on wrong keys, corrupted evidence and unavailable inventory; never
  rewrite historical records as part of checking a key. Preserve the original
  device key while investigating inconsistent history.
- For genuinely empty accounts, create an account-bound authenticated verification
  record with the original key. It must not be invented to justify a candidate
  key for an account that already contains encrypted data. Legacy V1 ciphertext
  is useful key-match evidence but lacks V2 owner/context binding.
- Stage recovery edits. Retain the prior working method until independent unwrap,
  server persistence/read-back and correct-key verification succeed. Handle a
  conflict explicitly; do not select a winner based solely on client clocks.
- Keep code-display modals mounted through state changes. Separate local setup,
  sync pending, synchronized, tested here and tested on another device. Re-enter
  a saved emergency code and test it without replacing the active key.
- Preserve pending recovery edits across ordinary sign-out without exposing them
  to the next account, or explicitly require resolution before discarding them.
  The account-deletion path remains distinct and intentional.

### Phase 2: additive encrypted recovery methods

Propose a separate `account_key_recovery_methods` table; do not repurpose or delete
`vault_keys`. Each independent method has an immutable ID, server-owned account
ownership, method/format version, key ID, KDF/algorithm parameters, wrapped key,
nonce, credential ID where relevant, public PRF/HKDF salts/context, revision,
creation/test/revocation metadata. Verification metadata distinguishes same-device
tests from second-device tests; client reports must not masquerade as server proof
that the server has decrypted anything.

- Enable RLS, revoke anonymous access and explicitly grant only needed privileges.
  Owner-checked RPCs derive ownership from `auth.uid()` and never accept a foreign
  owner. Use server transactions and expected revisions for edits/revocation.
- Keep credentials, single-use challenges and rate-limit state separate. Bind
  challenges to account, operation, credential and expected revision; expire and
  consume them atomically. Restrict RPC execution and security-definer search paths.
- Store no raw account key, PRF output, recovery code or passphrase. Authenticate
  wrapper metadata with domain-separated AES-GCM additional data. New wrappers
  specify their KDF parameters rather than relying on future code defaults.
- Old clients continue using legacy `vault_keys`; they cannot overwrite independent
  passkey wrappers. Any legacy-write concurrency migration needs explicit coverage
  for old clients still holding stale records.
- A stolen authenticated session may cause denial of service unless additional
  authorization is enforced. Ownership RLS alone is not proof of account-key
  possession. Enrollment in the honest client requires the verified original key;
  server challenge/signature validation does not prove the client recovered it.

### Phase 3: passkey recovery, then genuine device unlock

Use a maintained WebAuthn verifier for registration/assertions. The server verifies
single-use challenges, exact approved origins/RP ID, signatures, ownership and user
verification. Sanitize serialized extension results: PRF output stays in the
browser and must not be included in WebAuthn request bodies or telemetry.

Confirm usable PRF output with an assertion; derive a separate AES-GCM wrapping key
using HKDF-SHA-256 with random salt and domain-separated account/method/version
context. Wrap the existing key, upload/read back, then recover through a new
assertion. Registration, backup-eligibility flags or provider synchronization
alone do not establish second-device encrypted recovery.

Only after recovery is safe should device protection remove raw IndexedDB/session
restoration paths. The protected policy is user-scoped, fails closed, survives
refresh, and applies to all import/remember/hydrate/reset paths. Until that migration
commits, preserve working access and do not call an identity-only prompt device
encryption. Whether to retain an unlocked session key at all depends on the chosen
lock policy. Check other open tabs and old service-worker clients before claiming
all raw copies have been removed.

Neither the UI nor the WebAuthn API can promise a specific fingerprint sensor or
hardware backing. The operating system chooses fingerprint, face, PIN or another
supported verification method. No biometric images or templates enter Qetoret.

### Phase 4: reviewed device transfer

Defer custom QR pairing until a suitable reviewed protocol and its account/session
bindings, ephemeral key agreement, explicit trusted-device approval, short expiry,
replay prevention and both-party key confirmation are designed and reviewed.
QR codes contain pairing metadata, never plaintext keys. A browser profile ID is
not authenticated device identity. Until implemented, offer only working legacy
recovery and honest guidance to use an existing device to set it up.

## Compatibility and release evidence

Browser support is determined by the actual authenticator/credential/provider,
not a user-agent list. Feature detection can offer a test; successful PRF output
and key restoration determine eligibility. No physical-device passkey tests have
been performed for this assessment.

| Environment | Required evidence before enabling |
|---|---|
| Android Chrome | Registration, UV/PRF assertion, relaunch lock, cancellation, and recovery on a second device with original phone unavailable |
| Android TWA | Same tests in the shipped app; deployed origin, Digital Asset Links and credential behavior verified separately from Chrome |
| iPhone Safari | Actual provider PRF output, relaunch behavior and same-provider/other-device recovery |
| Installed iOS PWA | Test separately from Safari, including storage eviction and sign-in round trip |
| Desktop Chrome | Supported provider and security-key combinations tested individually |
| Edge/Windows Hello | Verify PRF availability; Hello authentication alone does not establish encrypted-key recovery |
| Desktop Firefox | Test actual PRF behavior; preserve passphrase/code fallback if unsupported |

Production RP ID and origin allowlist require confirmation. Do not derive the
trusted allowlist from a request Host header or silently accept preview domains.
Old `praystead.com` credentials do not automatically work under `qetoret.com`.

Release flags must default off separately for passkey enrollment, protected local
storage and transfer. Apply additive migrations before clients. Ship first to
disposable accounts, then a limited opted-in cohort after external security review
and the physical-device matrix. Do not claim production readiness from unit doubles.

Rollback disables enrollment while retaining readers/unlock/recovery for every
already enrolled method. Do not revert to an older client that cannot read the
only remaining key wrapper or silently recreate raw device copies. Never drop
wrappers or revoke legacy credentials as a rollback step.

Residual risks include XSS/malicious deployed JavaScript while unlocked,
compromised devices, server deletion/rollback, stolen recovery codes, provider or
passkey loss, credential-sync changes and unsupported platforms. Revocation stops
future authorized service use but cannot erase a wrapper/key already copied by an
attacker. Loss of all independent recovery secrets remains unrecoverable under
end-to-end encryption; email identity proof alone cannot reverse that.

## Decisions collected during implementation

The user chose the full feature behind disabled flags, confirmed the production
origin as `https://qetoret.com`, and required a tested emergency code or independent
second-device recovery before device protection. This implementation requires the
tested emergency code; it does not claim second-device verification from a
same-device assertion. The user confirmed online new-device recovery and offline
unlock on an already enrolled device, and selected locking on refresh/close plus
five minutes of inactivity. Device selection was delegated: prioritize Android
with Google Password Manager, then desktop Chrome/Edge; iOS needs separate
provider and PWA acceptance. The deployed Android app status remains unconfirmed.

Original questions:

1. Preferred lost-phone pathway: tested synced passkey plus independent emergency
   code, or trusted-device recovery plus code? Email-only restoration would require
   a different trust model and a separate product decision.
2. First-release device/provider combinations and physical devices available for
   testing, especially a true second device.
3. Protected-device lock policy: tab close, inactivity timeout, or explicit lock;
   determine refresh and multi-tab behavior as part of that choice.
4. Recovery-foundation-first delivery or the full feature behind disabled flags.
5. Exact production origins and whether the deployed Android app has migrated.
6. Whether online recovery is acceptable, and whether local unlock must work
   offline; these are different capabilities and need distinct acceptance tests.

## Baseline verification performed

Executed before implementation:

```text
npm.cmd test -- src/lib/crypto/keyManager.test.js src/lib/crypto/accountKey.test.js src/lib/vaultSync.test.js src/store/vaultStore.test.js src/store/vaultStore.privacy.test.js src/store/authStore.privacy.test.js
```

Result: 6 test files passed, 52 tests passed. These existing tests do not prove
the missing recovery, account-switch or asynchronous-race guarantees above.
No new implementation, database migration, browser/device acceptance, build,
lint or typecheck verification is claimed by this assessment.

## Primary references

- [WebAuthn Level 3: PRF extension](https://w3c.github.io/webauthn/#prf-extension)
- [WebAuthn relying-party registration and verification](https://w3c.github.io/webauthn/#sctn-rp-operations)
- [SimpleWebAuthn PRF guidance and credential-loss limitations](https://simplewebauthn.dev/docs/advanced/prf)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)

The lightweight Supabase changelog endpoint could not be fetched during this
assessment; the main [changelog](https://supabase.com/changelog) and current RLS
documentation were available. Recheck relevant changes before implementation.
