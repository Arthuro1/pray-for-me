# Recovery feature handoff

Date: 2026-10-09. Implemented locally behind disabled enrollment flags. No
deployment or production database changes. The initial audit is retained in
[RECOVERY_FIRST_ARCHITECTURE.md](RECOVERY_FIRST_ARCHITECTURE.md); current protocol
and residual risks are in [ENCRYPTION.md](ENCRYPTION.md) and
[THREAT_MODEL.md](THREAT_MODEL.md).

## Product decisions

- Production origin: exactly `https://qetoret.com`; RP ID `qetoret.com`.
- New-device recovery online; enrolled-device unlock offline when the cached app
  and authenticated session remain usable.
- Allow protected-device migration with a freshly verified provider-backed passkey
  or an additional tested passkey. Emergency/legacy backups remain optional routes.
  Provider backup flags and distinct credentials do not prove second-device access.
- Lock protected devices on refresh/close and after five minutes of inactivity.
- Prioritize Android/Google Password Manager, then desktop Chrome/Edge. Test
  iCloud/Safari and installed iOS PWA separately before enabling iOS enrollment.
- Defer custom QR transfer to a reviewed protocol phase. No simulated pairing
  screen or plaintext key QR is offered.

## Implementation map

| Area | Source |
|---|---|
| Scoped lifecycle, legacy adoption and policy | `src/lib/crypto/keyManager.ts`, `accountKey.js` |
| Versioned PRF/emergency cryptography | `src/lib/crypto/passkeyRecovery.js` |
| Recovery, historical proof and protected storage | `src/lib/prayerProtection.js`, `prayerProtectionCapabilities.js` |
| Settings, locked recovery and honest statuses | `src/components/PrayerProtection.jsx`, `VaultModal.jsx`, `RecoveryPromptBanner.jsx` |
| Legacy conflict/readback handling | `src/lib/vaultSync.js`, `src/store/vaultStore.js` |
| Pending ciphertext preservation and journal reconciliation | `src/lib/mutationQueue.js`, `pendingPrayerReconciliation.js`, `src/store/prayerStore.js` |
| Server verification and validation | `api/recovery.js`, `server/recoveryService.js`, `server/recoveryValidation.js` |
| Additive RLS, single-use proofs and CAS | `supabase/migrations/20261008235230_account_key_recovery_methods.sql` |
| Database authorization/lifecycle suite | `supabase/tests/account_key_recovery.test.sql` |

Method states progress from pending registration/wrapper to readback and fresh
client decryption verification, then active. Failed writes and interrupted
cleanup stay pending. Existing methods and legacy backups remain independent.
Removal requires unlocked access, confirmation and a revision check. On a
protected browser, guards prevent removing its active local method or final
active emergency method. These are current-browser guards: a different browser
can explicitly revoke a method this device relies on. The confirmation asks the
user to keep another tested method. There is no server registry of protected
device dependencies. A cancelled registration can be removed without leaking a
recovery slot.

Unassigned legacy backups may conservatively gate a new account on a shared
browser. Do not assign or discard the old backup to make that gate disappear.
A future new-account escape must first prove no server or local encrypted history.
Verification currently checks an existing identity and one encrypted prayer where
present; it does not assert that every history row has the same key.
Atomic queue persistence preserves other tabs' unsent ciphertext. Pending edits
are reconciled before cached prayers become editable after unlocking, including
offline startup. The existing last-write-wins sync model can still conflict
between independent writers; no global edit ordering or revision history is
claimed.

## Deployment sequence

1. Keep `VITE_PRAYER_PROTECTION_ENABLED=false` and
   `RECOVERY_ENROLLMENT_ENABLED=false`.
2. Back up existing database/wrapped recovery records. Apply the additive
   migration before deploying a client that requires the legacy CAS RPC. Reapply
   preserves rows; do not replace or drop `vault_keys`.
3. Configure `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) only
   server-side. Never prefix either with `VITE_`. Use the existing Supabase URL.
   The pinned verifier requires Node >=20; local validation used Node 24.17.0.
4. Deploy the API and client readers with enrollment disabled. Missing migration
   or API must report unavailable/sync pending, never mint a replacement key or
   promise verified recovery.
5. Review old service-worker/client behavior. Old clients can still write the
   legacy vault/queue and may not respect protected storage policy. Avoid mixed-version
   protected migration until those clients are controlled.
6. Complete independent security review, full local Supabase/pgTAP validation and
   the physical-device acceptance matrix below, then enable both flags only for
   the approved environment/cohort. The current flags are global; cohort control
   requires a separate deployment or an explicit reviewed rollout mechanism.

The isolated `recovery-test` development mode enables exactly
`http://localhost:5173` / RP ID `localhost` against a separate loopback Supabase
instance. It requires explicit opt-ins, rejects hosted database URLs and refuses
production builds. Root environment files and inherited credentials are excluded.
Production remains exact-origin gated. Setup and its limitations are documented
in [RECOVERY_LOCAL_TEST.md](RECOVERY_LOCAL_TEST.md). Automated browser integration
still uses injected test capabilities and simulated authenticator/API responses.

## Acceptance evidence and outstanding gates

Recovery implementation checks on 2026-10-09, before the separate local-test
setup addition:

- `npm run build`, `npm run typecheck`, `npm run lint:strict` and
  `git diff --check` passed.
  The build retains the existing large-chunk warnings.
- All 16 locale files have matching keys/placeholders. The copy audit reported
  zero new findings and zero metadata errors; existing review hints remain.
- `npm run test:browser -- --maxWorkers=1 --testTimeout=30000`: all 62 tests
  passed across 16 files on the frozen source.
- `npm test -- --maxWorkers=3 --testTimeout=30000`: 3,555 tests passed and six
  existing content-fixture assertions failed (294 passing files, six failing
  files). All recovery, key lifecycle, queue, UI and server tests passed.
- Focused regressions cover original-key restoration, protected idle locking,
  account switches, delayed writes during sign-out/lock/deletion, historical
  identity/group/attachment access, pending offline edits and concurrent tabs.

The six unit failures concern unchanged content and tests; no content catalogue
or review metadata was modified by this feature:

| Test file | Existing mismatch |
|---|---|
| `src/content/resources/authorBooks.test.js` | Expects one domain for resources that already have multiple domains |
| `src/content/resources/deliveranceBooks.test.js` | Expects freedom-only membership for an existing resource also on christian-living |
| `src/content/plans/davidHeart.test.js` | Older resource whitelist excludes an existing BibleProject Psalms resource |
| `src/content/plans/prayingForUnbornChild.test.js` | An existing motherhood resource lacks a topic required by the assertion |
| `src/pages/PlansTab.test.jsx` | Expects a real unreviewed plan after the current plans were approved |
| `src/components/tests/PlanReviewVisibility.test.jsx` | Still expects the already approved Zechariah plan to be a draft |

None of these local results enable enrollment automatically.

The isolated local-test addition was separately checked with 135 passing tests
across eight capability, cryptography, recovery, UI and backend files, plus the
recovery browser integration test. Production build, typecheck and strict lint
also passed. The setup refuses incomplete local credentials and preserves
existing configuration/migrations on rerun. These checks do not prove a
physical authenticator or replacement-phone recovery.

Automated browser recovery uses real Chromium WebCrypto/IndexedDB and simulated
authenticator/API responses. It wipes raw/local key state and restores the same
encrypted prayer, RSA identity, historical group envelope/content, and attachment.
This proves the cryptographic plumbing under those doubles. It does not prove
physical authenticator behavior, provider sync, a real production session/API,
ten-year retention or interoperability on another device.

The migration and its 39 SQL authorization/lifecycle assertions passed on local
PostgreSQL 16 in an isolated database, with Supabase auth/role fixtures and a
minimal assertion adapter because pgTAP is unavailable in that container. A
second migration application preserved staged ciphertext. All fixtures rolled
back and the disposable database was removed. This earlier adapter run was
subsequently complemented by a real isolated local Supabase stack on PostgreSQL
17: all 22 migrations applied successfully and the recovery SQL file passed all
39 pgTAP assertions on 2026-10-09. Other SQL suites and physical-device behavior
were not covered by that focused run. The running development app returned
HTTP 200 and loaded in Chrome with no uncaught browser errors; the recovery API
rejected unauthenticated and unapproved-origin requests.

| Environment | Required physical evidence |
|---|---|
| Android Chrome + Google Password Manager | PRF output, UV/cancel/failure, refresh/idle lock, offline enrolled unlock, replacement-phone restore with original unavailable, independent code restore |
| Shipped Android TWA | Same journey; verify actual app origin, Digital Asset Links and installed browser/provider behavior |
| Desktop Chrome/Edge + chosen provider | Each provider/authenticator's PRF behavior and real second-profile/device restore; Windows Hello authentication alone is insufficient |
| iPhone Safari + iCloud Keychain | Fresh PRF recovery after sync to a different device; cancellation/eviction and independent code fallback |
| Installed iOS PWA | Separate storage, relaunch, sign-in roundtrip and offline test; do not infer from Safari |
| Firefox/unsupported providers | Honest unsupported state and working emergency/legacy fallback; no identity-only device protection |

Use disposable accounts containing original prayers, child updates/points,
testimonies, identity/group keys and attachments. Do not clear a person's real
storage for acceptance testing. Include wrong credentials/key/account, corrupt
wrappers, revoked methods, failed readback, storage quota/eviction, interrupted
cleanup, concurrent tabs and an account switch during every asynchronous phase.
Verify that cancellation/failure preserves working access and that no raw key,
code or PRF result appears in network bodies, logs or telemetry.

## Rollback and recovery operations

Disable both enrollment flags to stop new enrollment/protection transitions.
Keep current readers, assertions, emergency/legacy recovery and protected offline
unlock available. Do not downgrade to a client that cannot interpret the user's
only wrapper; do not remove policy or recreate raw copies as a rollback shortcut.
Never drop recovery tables, erase wrappers or revoke existing methods merely to
roll back UI. Keep server secrets configured for previously enrolled online
recovery. A later reviewed change may move users back to transparent access only
through an explicit successful unlocked transition.

Back up ciphertext and versioned wrapper metadata together. A server backup
without a usable independent secret cannot decrypt prayer history. Revocation
cannot erase keys already obtained or revoke a disconnected device immediately.
If every device and independent secret is lost, email sign-in cannot reconstruct
the original encryption key.
