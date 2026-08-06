# Threat model

Last reviewed: 2026-08-04. This document describes the implementation, not an
aspirational design. Encryption details are in [ENCRYPTION.md](./ENCRYPTION.md).

## Assets and trust boundaries

Prayer text, updates, points, testimonies, attachment plaintext, account keys,
group keys, recovery credentials, relationship metadata, sessions, and provider
secrets are sensitive. The browser, deployed JavaScript, Supabase, Vercel
serverless functions, Edge Functions, the self-hosted AI gateway and local model
(Ollama), YouVersion, Web Push services, and the user's device are separate trust
boundaries. **No external AI provider (Anthropic, OpenAI, Google, Groq, …) is a
trust boundary any more: prayer content selected for AI is never sent to one.**

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
| AI relay/cost abuse | Supabase JWT verification at the self-hosted gateway; server-defined tasks/prompts/model/token budgets; strict Zod input + structured-output validation; Bible-verse-text rejection; per-task limits; per-minute and atomic daily user/global quotas; gateway concurrency gate + bounded queue + request timeout; `AI_PROXY_DISABLED` breaker; no-content logging | Authorized inputs are decrypted on-device and processed by the Pray4Me-operated gateway + local model after explicit consent — never by an external AI provider. A server administrator can read process memory; a compromised AI host can expose active requests |
| Sensitive data in AI input | Browser-side redaction of emails/phones/addresses/secrets/sensitive URLs before transmission; minimum-data default (title sent, description opt-in); optional name hiding | Redaction is best-effort; names are sent by default because they are often central to the prayer |
| Community abuse/sensitive disclosure | Audience preview, local contact-detail warning/ack, report/block RPCs, restrictive blocking RLS, DB insert-rate triggers, moderator deletion | Moderators need human escalation processes; automated detection is intentionally limited and does not judge prayer/theology |
| Notification disclosure | Generic payload by default; no prayer text in durable notification rows or logs | Device lock-screen metadata still reveals that Pray4Me sent a notification |

## AI processing boundary (self-hosted)

Pray4Me runs AI on operator-controlled infrastructure — a private **AI gateway**
(Node/TypeScript) that talks to a **local Ollama model** — instead of an external
provider. The trust boundaries for the AI path are:

- **The browser is the decryption boundary.** Prayer content is decrypted on the
  user's device. Only the content the user consents to (title by default;
  description opt-in), after browser-side redaction of high-confidence sensitive
  tokens, leaves the device.
- **The AI gateway is a plaintext-processing boundary.** It receives decrypted
  text over TLS, verifies the user's Supabase JWT, builds fixed prompts, runs the
  local model, validates the output, and returns references-only results. It does
  not persist prayer content and does not log it.
- **Ollama and the local model are trusted infrastructure** on the same private
  server/container network as the gateway. Ollama is never exposed publicly.

Precise statement (use this wording; do **not** call the design “zero
knowledge”):

> Prayer content selected for AI assistance is decrypted on the user's device and
> processed by Pray4Me-operated infrastructure. It is not sent to an external AI
> provider.

What this does and does not protect:

- **Does not** protect against malicious deployed JavaScript in the app origin —
  JS that runs in the page can already read displayed plaintext and keys.
- **Server administrators can access process memory** on the gateway/Ollama host
  and could, in principle, observe a request while it is being processed.
- **A compromised AI host can expose active requests** (the ones in flight); it
  cannot expose past prayer content, which is never stored there.
- **Protections in place:** full-disk encryption on the AI host, TLS in transit,
  host access controls, private-only Ollama, and no-content logging across the
  reverse proxy, Node server, and Ollama.
- **Residual risks** live mostly on the user side: a compromised user device, XSS
  or a malicious browser extension in the app origin, screenshots, and text the
  user copies out of the app are all outside these controls.

Machine **translations** of prayer content are cached encrypted (AES-GCM under
the account or group key, keyed for lookup by a keyed HMAC of the source); the
source text and translated text are never stored in plaintext. See
[ENCRYPTION.md](./ENCRYPTION.md).

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
