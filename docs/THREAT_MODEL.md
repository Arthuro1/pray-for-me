# Threat model

Last reviewed: 2026-07-31. This document describes the implementation, not an
aspirational design. Encryption details are in [ENCRYPTION.md](./ENCRYPTION.md).

## Assets and trust boundaries

Prayer text, updates, points, testimonies, attachment plaintext, account keys,
group keys, recovery credentials, relationship metadata, sessions, and provider
secrets are sensitive. The browser, deployed JavaScript, Supabase, Vercel
serverless functions, Edge Functions, Anthropic, YouVersion, Web Push services,
and the user's device are separate trust boundaries.

Supabase stores ciphertext for protected content, but necessarily sees metadata:
account and group IDs, membership, record IDs, timestamps, status, categories,
schedules, ciphertext sizes, key versions, reports, and notification routing.
Group members see content explicitly shared with their group.

## Key facts

- Automatic device-local encryption creates a 256-bit account content key. Its
  raw Base64 representation is stored in user-scoped IndexedDB as
  `pfm_ak_<user-id>`. An unlocked raw key is also mirrored in tab-scoped
  `sessionStorage` as `pfm_vault_session` so refresh does not re-lock it.
- The account key survives sign-out by design. Sign-out removes the encrypted
  offline snapshot, mutation queue, and legacy service-worker caches. Account
  deletion removes the account key.
- Default idle auto-lock is disabled (`0`). Explicit lock removes the in-memory
  and session copy, but the device key remains available for the next sign-in.
- Optional recovery wraps the same key under a passphrase and a recovery code.
  Only wrapped blobs and salts are synced in `vault_keys`. A recovery code is
  128 random bits encoded as 26 Crockford Base32 characters, formatted
  `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-X`. Version 1 16-character records remain
  readable; rotating a code writes version 2 and invalidates the old code.
- Version 2 AES-GCM uses canonical additional authenticated data containing the
  encryption schema, entity, owner/group, record, parent, key version, and field.
  Moving ciphertext to a different context fails authentication. Version 1 is
  still readable and personal content is rewritten only after verified decrypt.
- Group key version creation and the creator's wrapped key are one transaction.
  Removal and forward rotation are one transaction. Removed members retain any
  historical group keys or plaintext they already obtained; rotation protects
  future content, not history.

## Threats and controls

| Threat | Controls | Residual risk |
|---|---|---|
| Database dump or RLS bypass | Browser-side AES-GCM; wrapped recovery records; RLS; least-privilege grants | Metadata and any legacy plaintext remain visible; weak user passphrases can be guessed offline against a stolen wrapped record |
| Cross-account PWA replay | Auth/REST/RPC/Storage/Realtime are not Workbox-cached; legacy `supabase-cache` is deleted on activation and sign-out; snapshots/queues are user-scoped | A compromised browser profile can inspect local storage directly |
| Ciphertext substitution | Version 2 AES-GCM AAD binds owner, record, parent, key version, and field | Legacy v1 remains unbound until safely rewritten |
| Group-key orphan/concurrency | Row lock, next-version check, atomic creator envelope, idempotency key, FK, detection and repair RPCs | Content-bound legacy orphan versions need manual recovery from a member/device backup |
| Removed group member | Atomic membership removal and key rotation; future content uses the new key | No retroactive revocation; screenshots, exports, old ciphertext, and old keys cannot be recalled |
| XSS or malicious deployment | CSP, no HTML injection for rich text, dependency review, code review/CODEOWNERS | JavaScript running in the origin can read displayed plaintext, IndexedDB keys, session keys, and auth tokens. Encryption does not protect an unlocked compromised origin |
| Lost or shared device | OS/browser access control, explicit lock, optional passphrase recovery | Default auto-lock is off; an unlocked browser profile or extracted local profile can expose the account key |
| Recovery-code theft | 128-bit random code, PBKDF2 wrapping, rotation, code shown once | Anyone with the code and synced wrapped record can reset the passphrase; rotation is required after suspected disclosure |
| AI relay/cost abuse | Supabase authentication; server-defined tasks/prompts/model; per-task limits; per-minute and atomic daily user/global quotas; `AI_PROXY_DISABLED` breaker | Authorized inputs leave the encryption boundary and are processed by Anthropic after explicit consent |
| Community abuse/sensitive disclosure | Audience preview, local contact-detail warning/ack, report/block RPCs, restrictive blocking RLS, DB insert-rate triggers, moderator deletion | Moderators need human escalation processes; automated detection is intentionally limited and does not judge prayer/theology |
| Notification disclosure | Generic payload by default; no prayer text in durable notification rows or logs | Device lock-screen metadata still reveals that Pray4Me sent a notification |

## Terminology

“Device encryption” means content is encrypted in the browser before upload and
the key is available to that browser profile. “Vault/recovery protection” means
the account key additionally has passphrase/recovery wrappers for cross-device
recovery. “Protection against database compromise” means a database-only
attacker should get ciphertext plus metadata, not content. This project does not
claim protection against malicious deployed JavaScript, a compromised device,
or an already-unlocked browser. Avoid the unqualified phrase “zero knowledge.”

## Assumptions

Web Crypto, the browser origin, package supply chain, TLS, Supabase Auth, and the
user's device are trusted while in use. Provider and administrator access is
constrained operationally, not eliminated cryptographically. Security claims
must be retested after changes to crypto, RLS, service workers, authentication,
or deployment headers.
