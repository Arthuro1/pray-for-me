# Security review and implementation report

Review date: 2026-08-01. Scope: repository `main` at the start of this work and
the changes described below.

## Findings verification

| Review finding | Verification | Outcome |
|---|---|---|
| Broad Supabase `NetworkFirst` cache | Confirmed. One Workbox rule matched the Supabase origin without separating authenticated endpoints. | Removed; Supabase requests are unmanaged/network-only, legacy cache is purged on activation and sign-out. |
| Recovery entropy loss | Confirmed. The readable encoding did not preserve the intended full bit stream. | Version 2 encodes all 128 random bits into 26 Crockford characters; v1 records remain supported. |
| AES-GCM lacked record binding | Confirmed across personal, community, guest, attachment, and key call sites. | Version 2 canonical AAD is required; v1 read/migrate compatibility remains. |
| Group key version and creator envelope were separate writes | Confirmed; failures/concurrency could orphan a version. | Transactional, locked, exact-next-version, idempotent RPCs now create/rotate/remove. |
| CI did not enforce TS/strict lint/all gates | Confirmed. TS was not typechecked and warnings were allowed. | Strict zero-warning lint, TS config, unit/browser/build sequence, artifacts, cancellation, summaries, and DB job added. |
| Supabase setup was manually ordered SQL | Confirmed. | Historical SQL consolidated into a clean-install baseline with timestamped forward migrations and pgTAP checks. |
| AI proxy was an authenticated general relay | Partially confirmed. Auth, model cap, payload cap, and minute rate limit existed, but clients controlled system/messages and there was no daily/global quota. | Four structured server tasks, server prompts/model/budgets, daily user/global reservation, breaker, and privacy-safe tests added. |
| Community safety lacked enforceable controls | Confirmed. Admin deletion existed, but reporting, blocking, and DB-level spam controls did not. | Identifier-only reports, moderator visibility, blocking RLS, write triggers, local sensitive-contact warning, and UI report/block actions added. |

## Implemented risk reductions

- Cross-account cache replay is removed without disabling encrypted IndexedDB
  snapshots, mutation replay, locale assets, or application-shell caching.
- Recovery uses documented 128-bit entropy, deterministic normalization, legacy
  reads, rotation invalidation, and test vectors.
- Ciphertext copied between records/users/groups/parents/fields fails AES-GCM
  authentication. Safe personal v1 rewrites occur only after successful decrypt.
- Group key concurrency and failure paths cannot commit a version without the
  creator envelope. Removed members lose all server envelopes and future access;
  historical access is explicitly not claimed revoked.
- RLS and Data API grants are explicit. Direct group-key/quota/rate-limit writes
  are denied; protected mutations use definer RPCs with pinned search paths.
- Profile updates now enforce ownership in both `USING` and `WITH CHECK`.
  Published identity keys are synchronized into an authenticated-read-only RLS
  table, and the compatibility view executes with the caller's privileges.
- AI requests cannot select arbitrary prompts, messages, roles, model, or output
  size. Development and production use the same authenticated server handler;
  provider errors are redacted and shared quota failure stops requests.
- Community content writes fail closed when a group key is unavailable. Partial
  key-envelope fan-out is retried, and a member's legacy plaintext/v1 rows are
  resumably rewritten to record-bound v2 with visible progress.
- Account-key bootstrap treats an unavailable server check as unknown and blocks
  behind a retry screen; it never interprets a network/database failure as safe
  permission to generate replacement key material.
- CI actions and the Supabase CLI are immutable-version pinned, and CodeQL scans
  JavaScript/TypeScript on pull requests, protected branches, and a weekly timer.
- Security ownership, PR review prompts, dependency updates, vulnerability
  reporting, release notes, migration, rollback, backup/restore, privacy incident,
  key compromise, monitoring, and community moderation procedures are committed.

## Compatibility and migration implications

- Recovery record v1 and ciphertext v1 remain readable. Recovery rotation writes
  v2. New encryption writes v2 AAD-bound envelopes.
- Opening a group scans and upgrades legacy community rows authored by that
  member. Completed rows are idempotently skipped on retries; rows owned by other
  members remain untouched until their author can safely rewrite them.
- Existing device account keys intentionally remain in user-scoped IndexedDB and
  survive sign-out. This avoids locking existing users out; account deletion
  removes the key.
- Existing production databases must mark the clean-install baseline applied
  only after a schema comparison, then apply forward migrations. The baseline
  must never be executed over live tables. See `MIGRATIONS.md`.
- New group content after removal uses a rotated key. Historical ciphertext and
  any historical key already received remain accessible to the former member.
- Community inserts can now return `community_rate_limited`; clients surface a
  generic safe error and can retry after the fixed window.

## Verification performed

Focused suites passed for recovery/service-worker security, all crypto contexts,
legacy migration, media, guest drafts, group-key failure/concurrency, AI boundary
and quotas, community safety, group admin behavior, and sensitive-share gating.
Strict lint, TypeScript, and locale structure passed. The unit/integration matrix
covered 129 files and 1,018 tests; real-browser coverage passed 7 tests in 4 files;
the production PWA build completed successfully.

The clean local Supabase rebuild passed with CLI 2.111.0: all six migrations
applied from zero on the local Postgres 17 stack, all 16 pgTAP assertions passed,
the local migration history matched the repository, and the Supabase security
advisor reported no error-level findings. The reproducible `database` CI job
remains an explicit pre-merge gate.

## Residual risks and prioritized follow-up

1. **Require the clean database CI gate before merge.** The local reset passed,
   but the independent CI replay must remain mandatory and must not be waived.
2. Malicious same-origin JavaScript or a compromised/unlocked device can read
   account/group keys and plaintext. Continue CSP, dependency, review, and
   deployment protection; consider an opt-in app lock using platform keystores.
3. Group rotation gives future secrecy only. A design requiring historical
   revocation needs per-record re-encryption and cannot erase copies already made.
4. The contact detector is intentionally narrow. Establish staffed moderation,
   safeguarding training, retention, appeals, and localized crisis resources
   before broad public community growth.
5. Add authenticated staging E2E with disposable Supabase accounts for full
   network RLS/report/block/rotation coverage; current account isolation uses
   real browser storage with synthetic account state.
6. Enable GitHub secret scanning and push protection in repository settings;
   these server-side controls cannot be enabled by a source-tree change.
