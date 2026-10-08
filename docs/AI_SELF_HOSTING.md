# AI setup: direct Claude or private Ollama

Qetoret's optional AI assistance and translation can use **Claude through
Anthropic's API**, or a **private Ollama model**. Claude runs through this app's
server-side `/api/ai` handler and needs no separate AI gateway deployment or
sibling repository. Selected text goes to Anthropic after provider-specific
consent. There is no automatic fallback to another provider.

The browser transport is `src/lib/aiClient.js` (`aiFetch`) → same-origin
`/api/ai`. In Claude mode, this route verifies the Supabase session, checks shared
quotas, defines the prompts/model/token budgets, calls Anthropic, and validates
the result before returning `{ data, usage }`. The legacy `/api/anthropic` route
delegates to the same handler and does not expose an unguarded raw-model API.

Models return Bible **references only**; verse text comes from trusted sources,
and reference-to-USFM conversion is deterministic and local. Translation caches
use keyed HMAC lookups and AES-GCM ciphertext rather than plaintext.

## Run Claude locally

Copy this app's `.env.example` to `.env`, configure Supabase, and set:

```env
# Server-only: never VITE_-prefix the API key.
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-haiku-4-5-20251001

# Public disclosure and cache hint; must match the server configuration.
VITE_AI_PROVIDER=anthropic
VITE_AI_MODEL=claude-haiku-4-5-20251001
```

Keep `VITE_AI_GATEWAY_URL` **unset** so requests use `/api/ai`. `AI_GATEWAY_URL`
and `AI_GATEWAY_DIR` are not needed for Claude. An existing `AI_GATEWAY_URL` is
ignored when `AI_PROVIDER=anthropic`.

```bash
npm install
npm run dev
```

The Vite server runs the same direct-Claude handler used in production. You do
not need `npm run ai:dev` for Claude. Do not commit filled-in environment files.
`VITE_AI_MODEL` only keys the client result cache; the real inference model is
chosen server-side by `ANTHROPIC_MODEL`. Keep the hint aligned when models change.

## Deploy Claude with the app

On the app host (for example, the Vercel project), set:

| Server-only | Browser/build configuration |
|---|---|
| `AI_PROVIDER=anthropic` | `VITE_AI_PROVIDER=anthropic` |
| `ANTHROPIC_API_KEY` | `VITE_AI_MODEL=claude-haiku-4-5-20251001` |
| `ANTHROPIC_MODEL=claude-haiku-4-5-20251001` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

Deploy the app after setting the public build variables. Keep
`VITE_AI_GATEWAY_URL` unset and `AI_PROXY_DISABLED` unset/`false`. The Anthropic
key stays in the server runtime and must never appear in a `VITE_` variable.
A localhost gateway URL cannot provide production inference; Claude mode does
not use one. Changing these files does not itself deploy or configure production.

Ensure the database has the shared minute-limit and daily-quota RPCs:

- `supabase/ai_rate_limit.sql`: `check_ai_rate_limit`.
- `supabase/migrations/20260731190702_ai_usage_quotas.sql`:
  `check_ai_usage_quota` and atomic per-user/global daily usage.
- `supabase/migrations/20260804120000_encrypted_translations.sql`: encrypted
  private/community translation caches.

The handler refuses inference when authentication, rate-limit checks, or quota
checks are unavailable. Apply the project's migrations using the normal
[migration procedure](./MIGRATIONS.md), then verify an authenticated request on
the deployed app.

## Architecture and controls

```text
Qetoret browser (provider-specific consent + redaction)
   │ HTTPS + Supabase access token + X-Qetoret-AI-Provider
   ▼
/api/ai (app server / Vercel function)
   │ session verification, strict tasks, shared quotas, prompts, output validation
   ├── AI_PROVIDER=anthropic ── HTTPS ──▶ Anthropic Messages API ──▶ Claude
   └── AI_PROVIDER=ollama ──▶ separate private gateway ──▶ Ollama
       (one configured provider; no cross-provider fallback)
```

The Claude handler accepts only the supported method, bounded request body and
strict task schemas. Clients cannot choose arbitrary prompts, models or token
budgets. Supabase verifies the caller; shared per-minute and atomic daily
per-user/global limits fail closed. Server request timeout is 50 seconds within
a 60-second function duration. Output validation rejects malformed responses
and detected verse quotations; this detection is best-effort. Application logs do not include raw prompts
or personal content. Hosting/provider logs and retention require separate
operational verification.

## Consent and provider changes

AI consent names the configured provider. Claude consent is checked against the
current Anthropic disclosure revision and stored locally for the signed-in
account. Legacy synced `aiConsentPrayer` / `aiConsentHome` booleans alone cannot
authorize Claude requests: the user must accept the current disclosure on that
device. Switching from private processing to Claude, or changing the Anthropic
disclosure revision, requires renewed consent. Existing private/Ollama consent
remains valid for private processing. Withdrawal clears AI result caches and
request state; it does not recall text already processed by a provider.

For Claude, keep `AI_PROVIDER=anthropic` and `VITE_AI_PROVIDER=anthropic` aligned.
The browser sends `X-Qetoret-AI-Provider: anthropic`; the server rejects an absent
or mismatching provider before inference. This compatibility guard prevents an
older app bundle with only the private-processing disclosure from being silently
sent to Claude. It is not cryptographic proof of consent. Deploy matching public
disclosure and server configuration together.

The outgoing prayer preview shows redacted text. By default the title is
included; prayer details and the latest update require their respective opt-ins.
Translation sends the selected text needed for that task. Requests also include
task metadata such as language and selected guidance options. Encryption at rest
and HTTPS do not prevent the app server or Anthropic from reading the selected
plaintext during inference.

## Private Ollama alternative

Ollama uses a separate gateway in the AI backend repository:
[`pray-for-me-ai/services/ai-gateway`](../../pray-for-me-ai/services/ai-gateway).
Set `AI_PROVIDER=ollama` on this app, `VITE_AI_PROVIDER=ollama`,
`VITE_AI_MODEL=qwen3:4b-instruct`, and a server-only `AI_GATEWAY_URL` pointing to
the gateway. The legacy `AI_PROVIDER=private` alias also selects this proxy path.
No Anthropic key is needed for Ollama. Configure the gateway's Supabase settings,
`AI_PROVIDER=ollama`, `AI_MODEL=qwen3:4b-instruct` and private `OLLAMA_BASE_URL`.
The gateway remains responsible for authentication, quotas, prompts and output
validation on this path.

For a local gateway, install its dependencies and optionally run this app's
`npm run ai:dev` launcher in a second terminal. The launcher can read the app's
`.env` without copying credentials into the sibling repository. For production
Ollama, deploy and secure that gateway separately; its URL must be reachable from
the app server. Keep the browser on same-origin `/api/ai`.

Prepare the model using the AI backend's model-download instructions. A private
Ollama container with no internet egress cannot download a model itself.

## Data handling and residual risks

The encrypted-translation migration recreates the cache tables using
`source_hmac`, `encrypted_translation`, `nonce`, `encryption_version`, and
expiry/key-version fields. It **drops the legacy plaintext cache tables**;
these are regenerable caches, and the server has no client keys to re-encrypt
their old rows. Clients repopulate encrypted rows on demand. RLS limits private
rows to their owner and community rows to group members.

- Malicious deployed JavaScript or XSS can read displayed plaintext, keys and
  tokens. A compromised device or extension can also expose content.
- App server administrators can access process memory and could observe
  in-flight requests. The same applies to private gateway/Ollama administrators
  when that alternative is configured.
- Anthropic receives selected plaintext when Claude is configured. Retention,
  training use, processing regions and deletion depend on the actual account,
  settings and agreements; verify these before making policy/store promises.
- Redaction is best-effort. It catches high-confidence contact details and
  secrets, but names remain in selected text and sensitive details can remain.
- Request metadata such as identity, timestamps and token counts is visible to
  the operator. Audit hosting, proxy and provider logs separately.

Do not describe AI processing as "zero knowledge". Precise language:

> Prayer content selected for AI assistance is decrypted on the user's device and
> redacted before being sent through Qetoret's authenticated app server. With
> Claude, Anthropic processes that selected text. With private Ollama, the
> configured model processes it on the operator's infrastructure.

## Checks

```bash
npm test
npm run lint:strict
npm run typecheck
npm run build
```

For the optional Ollama gateway, run its own tests and deployment checks in the
AI backend repository as well.
