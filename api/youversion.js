// Serverless proxy to the YouVersion Platform API (https://developers.youversion.com).
// It holds the App Key server-side (never shipped to the browser) and requires a
// valid Supabase session, so the key can't be used anonymously to scrape the API.
//
// The client requests a single passage by numeric version id + USFM reference:
//   GET /api/youversion?version=206&ref=JHN.3.16
// and we forward to the pinned upstream passages endpoint, returning plain text.
const UPSTREAM = 'https://api.youversion.com/v1';

// USFM passage ids look like "JHN.3.16", "1TH.5.17", "PSA.145.18" (3-char book
// code, then chapter and optional verse). Validate before forwarding so the
// proxy can never be pointed at an arbitrary upstream path.
const VERSION_RE = /^\d{1,7}$/;
const USFM_RE = /^[A-Z0-9]{3}\.\d{1,3}(\.\d{1,3})?$/;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const appKey = process.env.YVP_APP_KEY;
  // Signal "not configured" distinctly so the client can disable the YouVersion
  // path for the session and fall back without retrying every verse.
  if (!appKey) return res.status(503).json({ error: 'YouVersion not configured' });

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

  // ── Validate the (version, ref) pair before forwarding ─────────────────────
  const version = String(req.query.version || '');
  const ref = String(req.query.ref || '').toUpperCase();
  if (!VERSION_RE.test(version) || !USFM_RE.test(ref)) {
    return res.status(400).json({ error: 'Invalid reference' });
  }

  try {
    const upstream = await fetch(`${UPSTREAM}/bibles/${version}/passages/${ref}?format=text`, {
      headers: { 'X-YVP-App-Key': appKey },
    });
    if (!upstream.ok) {
      // Don't echo the upstream body; just surface the status so the client can
      // decide whether to fall back.
      return res.status(upstream.status).json({ error: 'Passage unavailable' });
    }
    const data = await upstream.json();
    // { id, content, reference } — content is plain text when format=text.
    return res.status(200).json({ text: (data?.content || '').trim(), reference: data?.reference || null });
  } catch {
    return res.status(502).json({ error: 'Upstream request failed' });
  }
}
