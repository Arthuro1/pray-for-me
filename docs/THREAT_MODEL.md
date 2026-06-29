# Pray4Me — Threat Model

_Last updated: 2026-06-29. Scope: the PWA (`src/`), the serverless AI proxy
(`api/anthropic.js`), the Supabase backend (`supabase/`), and the Edge Functions._

Pray4Me stores deeply personal content (prayers, names, phone numbers, health
and relationship details). The guiding principles are **privacy**, **least
privilege**, and **defense in depth**: the server should never be able to read
private prayer content, and a breach of any single component should not expose
plaintext.

## Assets

| Asset | Sensitivity |
|-------|-------------|
| Private prayer content (title, description, person_name, phone, updates, points, testimonies) | High |
| Vault master key (in memory only) | Critical |
| Wrapped vault record (`vault_keys`, localStorage) | Low at rest (ciphertext) |
| Vault passphrase / recovery code | Critical |
| Supabase session (access/refresh token) | High |
| Anthropic API key | High (cost/abuse) |
| VAPID private key | Medium (push spoofing) |
| Shared/community prayers | Public to the group **by design** |

## Trust boundaries

1. **Browser ↔ Supabase** — guarded by RLS (owner-only policies, see
   `supabase/rls_audit.sql`) and the anon key + per-user JWT.
2. **Browser ↔ AI proxy** (`/api/anthropic`) — requires a valid Supabase
   session; the Anthropic key lives only on the server.
3. **Vault boundary** — sensitive fields are encrypted client-side (AES-256-GCM)
   under a passphrase-derived master key. Supabase stores only ciphertext for
   the encrypted scalar fields.

---

## Scenarios

### 1. Database breach (attacker reads the Supabase DB)
- **Exposure:** Encrypted scalar fields (`title`, `description`, `person_name`,
  `phone`) are ciphertext in `prayers.encrypted_payload` — unreadable without
  the master key, which is never stored server-side (`vault_keys` holds only the
  *wrapped* key). Recovery code and passphrase are never stored.
- **Residual risk (HIGH):** For vault users, nested collections
  (`prayer_updates`, `prayer_points`, `testimonies`) are still stored **in
  plaintext** server-side because they fan out to shared community copies via
  the `sync_*` RPCs. Row metadata (timestamps, category links, user_id) is also
  plaintext. Community/shared prayers are plaintext by design.
- **Mitigations in place:** owner-only RLS on every user table; client-side E2EE
  of scalar fields; zero-knowledge vault key storage.
- **Planned:** encrypt nested collections server-side for *unshared* prayers
  (the `encrypted_payload`/`encryption_version` columns already exist on
  `prayer_updates`/`prayer_points` — Phase 3b). Tracked as the top remaining
  risk.

### 2. XSS (attacker runs JS in the app origin)
- **Exposure:** An attacker with script execution can read the in-memory master
  key while the vault is unlocked, the Supabase session, and `localStorage`
  (theme, settings, the *wrapped* vault record). This is the worst case for any
  client-side-E2EE app.
- **Mitigations in place:** strict CSP (`script-src 'self'` + the Vercel
  analytics origin — **no `unsafe-inline`/`unsafe-eval` for scripts**),
  `object-src 'none'`, `frame-ancestors 'none'`, `X-Content-Type-Options`,
  Trusted-by-default React escaping (no `dangerouslySetInnerHTML` anywhere),
  auto-lock that drops the master key after inactivity, and dev-only logging so
  prayer content never reaches the console in prod.
- **Residual risk:** `style-src 'unsafe-inline'` remains (React inline styles +
  Tailwind). It does not enable script execution but slightly widens the surface
  (CSS exfiltration). Removing it requires a nonce/refactor — recommended later.

### 3. Stolen / lost device (unlocked OS session)
- **Exposure:** The wrapped vault record and cached ciphertext sit in
  localStorage/IndexedDB. Without the passphrase they are unreadable. If the
  vault was left **unlocked**, the master key is in memory until auto-lock fires
  (default 5 min idle) or the tab closes.
- **Mitigations in place:** auto-lock on inactivity; master key never persisted;
  `clearLocalData()` wipes cache + queue + vault record on sign-out.
- **Recommendation:** shorten auto-lock for shared devices; consider re-prompt on
  app foreground.

### 4. Compromised Supabase (malicious/compromised backend)
- **Exposure:** A hostile backend can read/serve all plaintext it stores (see
  scenario 1: nested collections, metadata, community content) and can serve a
  malicious app build if it also controls hosting. It **cannot** decrypt the
  E2EE scalar fields — it never has the master key.
- **Residual risk:** The backend could withhold/tamper with the wrapped
  `vault_keys` record; GCM authentication means tampering yields a failed
  unlock, not silent corruption. A backend that also controls the served
  JavaScript could exfiltrate keys — hosting integrity (CSP, SRI, trusted
  deploy) is the boundary here.

### 5. Compromised AI provider (or network path to it)
- **Exposure:** Prayer title + latest update (or category names) are sent to
  Anthropic to generate suggestions — **plaintext, by necessity**. A compromised
  provider could log these.
- **Mitigations in place:** AI is **opt-in** per context with an explicit consent
  modal naming exactly what is sent; only minimal fields are sent (never phone /
  person_name); the proxy forwards a sanitized, model-pinned request; upstream
  error bodies are never echoed to the client (could contain the prompt).
- **Recommendation:** make the consent copy clear that content leaves the device
  and is not vault-protected.

### 6. Leaked recovery code
- **Exposure:** Anyone with the recovery code **and** access to the wrapped vault
  record (`vault_keys` or device localStorage) can reset the passphrase and
  decrypt everything. The code alone, without the record, is useless.
- **Mitigations in place:** the code is 128-bit, shown once, never stored in
  retrievable form; resetting requires the record.
- **Recommendation:** allow rotating the recovery code; warn users to store it
  offline, not in the same cloud account as the device backup.

### 7. Forgotten vault password
- **Exposure:** None to confidentiality. Recovery requires the recovery code.
- **Behavior:** With the recovery code → `resetPassphrase` re-wraps the *same*
  master key under a new passphrase, so existing ciphertext stays readable.
  **Without** either the passphrase or the recovery code, the data is
  **unrecoverable by design** (true zero-knowledge). This is a documented,
  intentional trade-off, surfaced to the user at vault setup.

---

## Defense-in-depth summary

- **Network:** HSTS (preload), `upgrade-insecure-requests`, strict CSP, tight
  `Permissions-Policy`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **AuthZ:** owner-only RLS on all user tables; AI proxy requires a valid session.
- **Secrets:** Anthropic key is server-only (no `VITE_` fallback, never bundled);
  VAPID private key only in Supabase secrets; service-role key only in Edge
  Functions.
- **Crypto:** AES-256-GCM, 96-bit random IV per message, PBKDF2-SHA256 (310k
  iterations), wrapped-master-key with passphrase + recovery code.
- **Abuse:** per-user rate limiting + payload/message caps on the AI proxy.
- **Blast radius:** auto-lock, dev-only logging, local-data wipe on sign-out.
