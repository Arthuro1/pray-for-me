# Security review and implementation report

Review date: 2026-07-31. Scope: repository `main` at the start of this work and
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
- AI requests cannot select arbitrary prompts, messages, roles, model, or output
  size. Shared daily quota failure stops requests instead of failing open.
- Security ownership, PR review prompts, dependency updates, vulnerability
  reporting, release notes, migration, rollback, backup/restore, privacy incident,
  key compromise, monitoring, and community moderation procedures are committed.

## Compatibility and migration implications

- Recovery record v1 and ciphertext v1 remain readable. Recovery rotation writes
  v2. New encryption writes v2 AAD-bound envelopes.
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
Strict lint and TypeScript passed after removing every warning/error. The final
full-suite/build/browser results are recorded in the handoff for this change.

The clean local Supabase rebuild could not be executed on this workstation
because Docker Desktop's Linux engine pipe was unavailable. The reproducible
`database` CI job and pgTAP suite are committed, but this remains an explicit
pre-merge gate, not a claimed local pass.

## Residual risks and prioritized follow-up

1. **Run the clean database CI gate before merge.** Fix any historical baseline
   ordering/drift failure; do not waive it.
2. Malicious same-origin JavaScript or a compromised/unlocked device can read
   account/group keys and plaintext. Continue CSP, dependency, review, and
   deployment protection; consider an opt-in app lock using platform keystores.
3. Legacy v1 community ciphertext remains substitution-unbound until a safe user
   edit/rewrite. Add a resumable, member-key-aware migration UI with progress.
4. Group rotation gives future secrecy only. A design requiring historical
   revocation needs per-record re-encryption and cannot erase copies already made.
5. The contact detector is intentionally narrow. Establish staffed moderation,
   safeguarding training, retention, appeals, and localized crisis resources
   before broad public community growth.
6. Add authenticated staging E2E with disposable Supabase accounts for full
   network RLS/report/block/rotation coverage; current account isolation uses
   real browser storage with synthetic account state.
7. Pin GitHub actions to audited commit SHAs and enable CodeQL/secret scanning in
   repository settings.
