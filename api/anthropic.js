// Serverless proxy to the Anthropic Messages API. It holds the API key
// server-side (never shipped to the browser) and requires a valid Supabase
// session, so the endpoint can't be used anonymously to run up the bill.
//
// Beyond auth, the proxy is hardened against an authenticated user turning it
// into an open-ended Claude relay: it forwards only a sanitized request to a
// pinned model with a capped token budget and a bounded payload size — never
// the raw client body.

// Models the app is allowed to call. Keep in sync with the client callers
// (aiRecommendations.js, translationStore.js).
const ALLOWED_MODELS = new Set(['claude-haiku-4-5-20251001']);
const MAX_OUTPUT_TOKENS = 2048; // covers the largest caller (translations, 2000)
const MAX_BODY_BYTES = 64 * 1024; // generous for prayer prompts, blocks abuse
const MAX_MESSAGES = 20; // a single suggestion is 1-2 turns; cap relay abuse
const ALLOWED_ROLES = new Set(['user', 'assistant']);

// ── Per-user rate limiting ───────────────────────────────────────────────────
// Primary: a SHARED Postgres counter (the check_ai_rate_limit RPC), so the cap
// is global across every serverless instance — a hard limit, not best-effort.
// Fallback: a per-instance in-memory sliding window, used only if the shared
// store is unreachable (migration not applied / transient error) so the relay is
// never left completely unthrottled. See docs/THREAT_MODEL.md (abuse).
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
  // Opportunistic cleanup so the map can't grow unbounded across many users.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (!v.some((t) => now - t < RATE_LIMIT_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

// Hit the shared counter. The RPC is SECURITY DEFINER and keyed on auth.uid(),
// so the user's own Bearer token is enough — no service-role key on the server.
// Returns { ok, limited }; ok=false signals the caller to use the in-memory
// fallback (the RPC is missing, errored, or returned an unexpected shape).
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
    const allowed = await res.json(); // scalar boolean: true = under the limit
    if (typeof allowed !== 'boolean') return { ok: false };
    return { ok: true, limited: !allowed };
  } catch {
    return { ok: false };
  }
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
    // Bind the rate limit to the authenticated user id, not the (forgeable) token
    // string, so refreshing the token can't reset the counter.
    const user = await check.json();
    userId = user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ── Per-user rate limit (shared store, in-memory fallback) ─────────────────
  const shared = await rateLimitedShared(supabaseBase, process.env.VITE_SUPABASE_ANON_KEY, token);
  const limited = shared.ok ? shared.limited : rateLimitedInMemory(userId);
  if (limited) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  // ── Validate + sanitize the request before forwarding ──────────────────────
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  if (!ALLOWED_MODELS.has(body.model)) {
    return res.status(400).json({ error: 'Unsupported model' });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: 'Invalid messages' });
  }
  // Each message must be a well-formed {role, content} pair with an allowed role
  // and string content — never forward arbitrary structures to the upstream API.
  for (const m of body.messages) {
    if (!m || typeof m !== 'object' || !ALLOWED_ROLES.has(m.role) || typeof m.content !== 'string') {
      return res.status(400).json({ error: 'Invalid messages' });
    }
  }

  // Forward only known fields, with a hard token cap — never the raw body.
  const safeBody = {
    model: body.model,
    max_tokens: Math.min(Number(body.max_tokens) || MAX_OUTPUT_TOKENS, MAX_OUTPUT_TOKENS),
    // Forward only {role, content} — never extra client-supplied fields.
    messages: body.messages.map((m) => ({ role: m.role, content: m.content })),
  };
  if (typeof body.system === 'string' && body.system.length > 0) {
    // Mark the (identical, every-call) guardrail system prompt as cacheable so
    // repeat input is billed at the cache read rate. Above the model's cache
    // minimum this is a real saving; below it the API silently ignores the
    // breakpoint, so sending it is always safe.
    safeBody.system = [
      { type: 'text', text: body.system, cache_control: { type: 'ephemeral' } },
    ];
  }
  if (typeof body.temperature === 'number') {
    safeBody.temperature = Math.min(Math.max(body.temperature, 0), 1);
  }

  // Bound the payload size so the proxy can't be used to relay huge requests.
  const serialized = JSON.stringify(safeBody);
  if (serialized.length > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Request too large' });
  }

  // Server-side key only. The non-VITE name guarantees it can never be inlined
  // into the client bundle. (The VITE_ fallback was removed — set ANTHROPIC_API_KEY
  // in the deployment environment.)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'AI not configured' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: serialized,
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch {
    // Never echo the upstream error body — it can contain the prompt (and thus
    // prayer content).
    return res.status(502).json({ error: 'Upstream request failed' });
  }
}
