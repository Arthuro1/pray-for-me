// Serverless proxy to Pray4Me's OWN private AI backend (pray-for-me-ai), NOT to
// any third-party AI provider. It holds the service key server-side (never
// shipped to the browser) and requires a valid Supabase session, so the endpoint
// can't be used anonymously to run up cost or leak prayer content.
//
// This supersedes api/anthropic.js: by default the app talks only to the private
// backend. Anthropic is never called from here. The private backend forwards to
// a self-hosted LLM (Ollama/vLLM) on infrastructure the operator controls.
//
// Like the old proxy, it is hardened against an authenticated user turning it
// into an open-ended relay: it forwards only a sanitized request to an allow-
// listed model with a capped token budget and a bounded payload size.

const DEFAULT_ALLOWED = 'llama3.1:8b,mistral:7b,qwen2.5:7b';
const MAX_OUTPUT_TOKENS = 2048; // covers the largest caller (translations, 2000)
const MAX_BODY_BYTES = 64 * 1024; // generous for prayer prompts, blocks abuse
const MAX_MESSAGES = 20; // a single suggestion is 1-2 turns; cap relay abuse
// OpenAI-compatible roles. `system` carries the app's theological guardrail.
const ALLOWED_ROLES = new Set(['system', 'user', 'assistant']);

// ── Per-user rate limiting ───────────────────────────────────────────────────
// Primary: a SHARED Postgres counter (check_ai_rate_limit RPC) so the cap is
// global across serverless instances. Fallback: a per-instance sliding window if
// the shared store is unreachable, so the relay is never left unthrottled.
const RATE_LIMIT_MAX = 20; // requests
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // per minute, per user
const hits = new Map(); // userId -> number[] (timestamps)

function rateLimitedInMemory(userId) {
  const now = Date.now();
  const recent = (hits.get(userId) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(userId, recent);
    return true;
  }
  recent.push(now);
  hits.set(userId, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (!v.some((t) => now - t < RATE_LIMIT_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

async function rateLimitedShared(supabaseBase, anonKey, token) {
  try {
    const res = await fetch(`${supabaseBase}/rest/v1/rpc/check_ai_rate_limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
      body: JSON.stringify({ p_max: RATE_LIMIT_MAX, p_window_seconds: RATE_LIMIT_WINDOW_MS / 1000 }),
    });
    if (!res.ok) return { ok: false };
    const allowed = await res.json();
    if (typeof allowed !== 'boolean') return { ok: false };
    return { ok: true, limited: !allowed };
  } catch {
    return { ok: false };
  }
}

function allowedModels() {
  return new Set(
    (process.env.AI_ALLOWED_MODELS || process.env.AI_MODEL || DEFAULT_ALLOWED)
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean)
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Auth: require a valid Supabase session (Bearer access token) ───────────
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const supabaseBase = (process.env.VITE_SUPABASE_URL || '')
    .replace('/rest/v1/', '')
    .replace(/\/$/, '');
  let userId;
  try {
    const check = await fetch(`${supabaseBase}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: process.env.VITE_SUPABASE_ANON_KEY },
    });
    if (!check.ok) return res.status(401).json({ error: 'Unauthorized' });
    const user = await check.json();
    userId = user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ── Per-user rate limit (shared store, in-memory fallback) ─────────────────
  const shared = await rateLimitedShared(supabaseBase, process.env.VITE_SUPABASE_ANON_KEY, token);
  const limited = shared.ok ? shared.limited : rateLimitedInMemory(userId);
  if (limited) return res.status(429).json({ error: 'Rate limit exceeded' });

  // ── Validate + sanitize the request before forwarding ──────────────────────
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const models = allowedModels();
  const model = typeof body.model === 'string' && body.model ? body.model : process.env.AI_MODEL;
  if (!model || !models.has(model)) {
    return res.status(400).json({ error: 'Unsupported model' });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: 'Invalid messages' });
  }
  for (const m of body.messages) {
    if (!m || typeof m !== 'object' || !ALLOWED_ROLES.has(m.role) || typeof m.content !== 'string' || !m.content.trim()) {
      return res.status(400).json({ error: 'Invalid messages' });
    }
  }

  // Forward only known fields — never the raw body. Messages are reduced to
  // {role, content}; nothing else the client sent is passed on.
  const safeBody = {
    model,
    max_tokens: Math.min(Number(body.max_tokens) || MAX_OUTPUT_TOKENS, MAX_OUTPUT_TOKENS),
    messages: body.messages.map((m) => ({ role: m.role, content: m.content })),
  };
  if (typeof body.temperature === 'number') {
    safeBody.temperature = Math.min(Math.max(body.temperature, 0), 1);
  }

  const serialized = JSON.stringify(safeBody);
  if (serialized.length > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Request too large' });
  }

  // ── Forward to the private AI backend (service-to-service auth) ────────────
  const backendUrl = (process.env.AI_BACKEND_URL || '').replace(/\/$/, '');
  const apiKey = process.env.AI_BACKEND_API_KEY;
  if (!backendUrl || !apiKey) return res.status(500).json({ error: 'AI not configured' });

  try {
    const response = await fetch(`${backendUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: serialized,
    });

    if (!response.ok) {
      // Never echo the backend's error body — it can contain the prompt (and
      // thus prayer content). Surface only a safe, generic status.
      if (response.status === 429) return res.status(429).json({ error: 'Rate limit exceeded' });
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch {
    // Backend unreachable — fail gracefully, never fall back to a third party.
    return res.status(502).json({ error: 'AI service unavailable' });
  }
}
