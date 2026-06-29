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
  try {
    const check = await fetch(`${supabaseBase}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: process.env.VITE_SUPABASE_ANON_KEY },
    });
    if (!check.ok) return res.status(401).json({ error: 'Unauthorized' });
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ── Validate + sanitize the request before forwarding ──────────────────────
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  if (!ALLOWED_MODELS.has(body.model)) {
    return res.status(400).json({ error: 'Unsupported model' });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  // Forward only known fields, with a hard token cap — never the raw body.
  const safeBody = {
    model: body.model,
    max_tokens: Math.min(Number(body.max_tokens) || MAX_OUTPUT_TOKENS, MAX_OUTPUT_TOKENS),
    messages: body.messages,
  };
  if (typeof body.system === 'string') safeBody.system = body.system;
  if (typeof body.temperature === 'number') {
    safeBody.temperature = Math.min(Math.max(body.temperature, 0), 1);
  }

  // Bound the payload size so the proxy can't be used to relay huge requests.
  const serialized = JSON.stringify(safeBody);
  if (serialized.length > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Request too large' });
  }

  // Server-side key only. Prefer the non-VITE name so it can never be inlined
  // into the client bundle; fall back to the old name during transition.
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
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
