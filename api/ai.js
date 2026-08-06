// Same-origin reverse proxy for the private AI gateway.
//
// The browser posts { task, input } to /api/ai with its Supabase access token.
// This handler forwards the request verbatim to the self-hosted gateway
// (AI_GATEWAY_URL) and relays the gateway's normalized { data, usage } response.
// It is intentionally THIN: it holds no prompts, model names, or provider keys,
// and it never contacts an external AI provider. All authentication, quotas,
// prompt construction, model selection, and output validation happen in the
// gateway. Keeping this same-origin means the browser only ever talks to
// Pray4Me's own domain (no CORS, no CSP connect-src change).
//
// It never logs the request or response body — those can carry prayer content.

export const MAX_REQUEST_BYTES = 32 * 1024;

export async function handleAiRequest(
  req,
  res,
  { env = process.env, fetchImpl = globalThis.fetch } = {},
) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Defence-in-depth circuit breaker (the gateway has its own as well).
  if (env.AI_PROXY_DISABLED === 'true') {
    return res.status(503).json({ error: 'AI temporarily disabled' });
  }

  // Require a bearer token up front so we don't forward anonymous traffic. The
  // gateway is the authority that actually verifies it.
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  let requestBytes;
  try {
    requestBytes = new TextEncoder().encode(JSON.stringify(req.body)).byteLength;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  if (requestBytes > MAX_REQUEST_BYTES) return res.status(413).json({ error: 'Request too large' });

  const gatewayUrl = (env.AI_GATEWAY_URL || '').replace(/\/$/, '');
  if (!gatewayUrl) return res.status(500).json({ error: 'AI not configured' });

  try {
    const upstream = await fetchImpl(`${gatewayUrl}/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(req.body),
    });

    // Relay the gateway's status and JSON body unchanged. The gateway already
    // returns generic errors and a normalized success envelope, so there is
    // nothing to sanitize or reshape here.
    let payload;
    try {
      payload = await upstream.json();
    } catch {
      return res.status(502).json({ error: 'AI provider unavailable' });
    }
    return res.status(upstream.status).json(payload);
  } catch {
    // Network error reaching the gateway — never surface detail.
    return res.status(502).json({ error: 'AI provider unavailable' });
  }
}

export default function handler(req, res) {
  return handleAiRequest(req, res);
}
