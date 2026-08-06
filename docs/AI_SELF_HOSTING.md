# AI self-hosting & migration guide

Pray4Me's AI no longer uses any external provider. It runs a **self-hosted open
model** (Ollama + Qwen) behind a private **AI gateway**. This guide covers what
changed, how to run it locally, how to deploy it, the residual security risks,
and the migration steps.

## What changed (Anthropic → self-hosted)

| Before | After |
|--------|-------|
| `api/anthropic.js` (Vercel proxy → Anthropic) | `api/ai.js` (thin same-origin forwarder → the gateway) |
| `src/lib/anthropic.js` (`anthropicFetch`) | `src/lib/aiClient.js` (`aiFetch`) |
| `ANTHROPIC_API_KEY` | `AI_GATEWAY_URL` (+ optional `VITE_AI_GATEWAY_URL`, `VITE_AI_MODEL`) |
| Prompts/model in `api/anthropic.js` | Prompts/model/validation in the gateway (`services/ai-gateway`) |
| `bible_reference_to_usfm` AI fallback | Removed — reference→USFM is deterministic and local |
| Response: Anthropic `content[0].text` | Response: normalized `{ data, usage }` |
| Model returned verse **text** | Model returns **references only**; verse text comes from trusted sources |
| Plaintext translation cache | Encrypted translation cache (keyed HMAC + AES-GCM) |

The **gateway** lives in the AI backend repo:
[`pray-for-me-ai/services/ai-gateway`](../../pray-for-me-ai/services/ai-gateway).
It is the security authority: it verifies the Supabase JWT, owns the prompts,
model and token budgets, enforces the shared Supabase quotas plus gateway-side
concurrency/queue/timeout, validates the model's output, and rejects Bible verse
text. It never logs prayer content.

## Architecture

```
Pray4Me browser
   │  HTTPS + Supabase access token
   ▼
/api/ai  (same-origin forwarder — api/ai.js / Vite dev middleware)
   │
   ▼
AI gateway (Node/TS)  ── verifies JWT, quotas, prompts, output validation
   │  localhost / private container network
   ▼
Ollama  ──▶  qwen3:4b-instruct     (never exposed publicly)
```

The browser talks only to Pray4Me's own origin (`/api/ai`). An operator may
instead point the browser directly at a public gateway host with
`VITE_AI_GATEWAY_URL` — that URL is not a secret, but its origin must then be
added to the CSP `connect-src` in `vite.config.js` and `vercel.json`.

## Run locally

```bash
# 1) Model + gateway (in the pray-for-me-ai repo)
ollama pull qwen3:4b-instruct
cd services/ai-gateway
cp .env.example .env            # set SUPABASE_URL + SUPABASE_ANON_KEY
npm install
npm run dev                     # http://127.0.0.1:3001
```

```bash
# 2) The app (in the pray_for_me repo), pointed at the local gateway
cp .env.example .env            # set VITE_SUPABASE_* and AI_GATEWAY_URL=http://127.0.0.1:3001
npm install
npm run dev                     # /api/ai proxies to the gateway
```

Or run the whole gateway stack in containers:

```bash
cd services/ai-gateway
docker compose up -d --build
docker compose exec ollama ollama pull qwen3:4b-instruct
```

## Deploy in production

```bash
# Gateway host (private server with Ollama)
cd services/ai-gateway
cp .env.example .env            # Supabase values; CORS_ALLOW_ORIGINS only if not same-origin
docker compose up -d --build    # caddy(443) → ai-gateway(private) → ollama(private)
docker compose exec ollama ollama pull qwen3:4b-instruct
```

```bash
# App (Vercel or similar): set env, deploy
#   AI_GATEWAY_URL = https://ai.pray4me.space   (server-only)
#   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
# Apply the DB migration:
supabase db push                # includes 20260804120000_encrypted_translations.sql
```

- Ollama has **no published port**; only Caddy exposes 443.
- Set your domain in `services/ai-gateway/Caddyfile`.
- Ensure `AI_PROXY_DISABLED` is unset/`false` in production.

## Database migration

`supabase/migrations/20260804120000_encrypted_translations.sql`:

- Recreates `translations` and `community_translations` with the encrypted shape
  (`source_hmac`, `encrypted_translation`, `nonce`, `encryption_version`,
  `expires_at` / `key_version`). No `original_text` / `translated_text`.
- **Drops the legacy plaintext tables.** These are regenerable caches and the
  server cannot re-encrypt them (keys are client-side), so no plaintext is
  migrated and none survives. Clients repopulate encrypted rows on demand.
- Adds RLS (owner-only private; members-only community) and
  `cleanup_expired_translations()` for TTL sweeps.

The AI quota/rate-limit tables (`ai_daily_usage`, `check_ai_rate_limit`,
`check_ai_usage_quota`) are unchanged and still used — now called by the gateway.

## Residual security risks

- **Malicious deployed JavaScript / XSS** in the app origin can read displayed
  plaintext, keys, and tokens. Self-hosting does not change this.
- **Server administrators** on the gateway/Ollama host can access process memory
  and could observe an in-flight request.
- **A compromised AI host** can expose the requests currently being processed
  (not past content, which is never stored there).
- **Redaction is best-effort.** It catches high-confidence tokens (emails,
  phones, secrets, sensitive URLs, identifiable addresses) but not everything;
  people's names are sent by default (they are often central to the prayer).
- **User-side exposure** — a compromised device, a malicious browser extension,
  screenshots, or text copied out of the app — is outside these controls.
- **Metadata** (who made a request, when, token counts) is visible to the
  operator; prayer content is not logged.

Do **not** describe this as "zero knowledge". Precise language:

> Prayer content selected for AI assistance is decrypted on the user's device and
> processed by Pray4Me-operated infrastructure. It is not sent to an external AI
> provider.

## Commands cheat-sheet

Local:

```bash
ollama pull qwen3:4b-instruct
(cd services/ai-gateway && npm install && npm run dev)   # gateway :3001
npm install && npm run dev                                # app, AI_GATEWAY_URL set
```

Gateway tests / checks:

```bash
cd services/ai-gateway
npm test && npm run lint && npm run typecheck
```

App tests / checks / build:

```bash
npm test && npm run lint && npm run typecheck && npm run build
```

Production:

```bash
(cd services/ai-gateway && docker compose up -d --build)
docker compose exec ollama ollama pull qwen3:4b-instruct
supabase db push
# deploy the app with AI_GATEWAY_URL set in the host env
```
