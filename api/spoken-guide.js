// Serverless endpoint for the Spoken Prayer Guide. Talks ONLY to Pray4Me's own
// private AI/voice backend (pray-for-me-ai) — never a third-party TTS provider.
//
// Two methods:
//   POST /api/spoken-guide          → build a driving-safe spoken prayer session.
//   GET  /api/spoken-guide?audio=…  → proxy the temporary audio file (so the
//                                     browser never calls the private backend).
//
// Privacy: prayers are REDUCED here per the chosen privacy mode before anything
// leaves the app, so `names_only`/`summary` genuinely send less. Sensitive
// content is never logged; backend errors are never echoed.

const PRIVACY_MODES = new Set(['full', 'summary', 'names_only']);
const LENGTHS = new Set(['short', 'medium']);
const AUDIO_FORMATS = new Set(['mp3', 'wav', 'ogg']);
const MAX_BODY_BYTES = 256 * 1024;
const AUDIO_FILE_RE = /^[a-f0-9]{16,64}\.(mp3|wav|ogg)$/;
const DEFAULT_LOCALE = 'en-US';
const LANG_SUBTAG_RE = /^[a-z]{2,3}$/i;
const REGION_SUBTAG_RE = /^[a-z0-9]{2,8}$/i;

// Deliberately duplicated from src/lib/spokenGuide.js rather than imported: this
// serverless function must not pull in the browser bundle (and its Supabase
// client). Keep the two in step — src/lib/spokenGuide.test.js covers the shared
// cases, api/spoken-guide.test.js covers this copy.
function sanitizeLocale(raw) {
  if (typeof raw !== 'string') return DEFAULT_LOCALE;
  const parts = raw.trim().replace(/_/g, '-').split('-').filter(Boolean);
  if (!parts.length) return DEFAULT_LOCALE;
  const lang = parts[0];
  if (!LANG_SUBTAG_RE.test(lang)) return DEFAULT_LOCALE;
  if (parts.length === 1) return lang.toLowerCase();
  const region = parts[parts.length - 1];
  if (!REGION_SUBTAG_RE.test(region)) return DEFAULT_LOCALE;
  return `${lang.toLowerCase()}-${region.toUpperCase()}`;
}

// ── Per-user rate limiting (shared store, in-memory fallback) ────────────────
const RATE_LIMIT_MAX = 10; // spoken-guide is heavier than a text call
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const hits = new Map();

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
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: anonKey },
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

// Resolve the Supabase user from the Bearer token. Returns the user id or null.
async function authenticate(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { token: null, userId: null };
  const supabaseBase = (process.env.VITE_SUPABASE_URL || '').replace('/rest/v1/', '').replace(/\/$/, '');
  try {
    const check = await fetch(`${supabaseBase}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: process.env.VITE_SUPABASE_ANON_KEY },
    });
    if (!check.ok) return { token, userId: null };
    const user = await check.json();
    return { token, userId: user?.id || null, supabaseBase };
  } catch {
    return { token, userId: null, supabaseBase };
  }
}

function str(v) {
  return typeof v === 'string' ? v : '';
}

function sanitizeScripture(scripture) {
  if (!Array.isArray(scripture)) return [];
  return scripture
    .filter((s) => s && typeof s === 'object')
    .map((s) => {
      const out = {};
      if (str(s.ref)) out.ref = str(s.ref);
      if (str(s.text)) out.text = str(s.text);
      return out;
    })
    .filter((s) => s.ref || s.text)
    .slice(0, 3);
}

// Reduce a prayer to only the fields the chosen privacy mode is allowed to voice.
// This is where "names only" / "summary" actually send LESS to the backend.
function sanitizePrayer(p, mode, readFullDetails, includeScripture) {
  if (!p || typeof p !== 'object') return null;
  const scripture = includeScripture ? sanitizeScripture(p.scripture) : [];
  const category = str(p.category) || undefined;

  if (mode === 'names_only') {
    const name = str(p.name) || undefined;
    if (!name && !category) return null;
    return clean({ name, category, scripture });
  }

  const title = str(p.title) || undefined;
  const summary = str(p.summary) || undefined;
  if (mode === 'summary') {
    return clean({ title, category, summary, scripture });
  }

  // full
  const out = { title, category, name: str(p.name) || undefined, summary, scripture };
  if (readFullDetails) out.details = str(p.details) || undefined;
  return clean(out);
}

function clean(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

function backendConfig() {
  const backendUrl = (process.env.AI_BACKEND_URL || '').replace(/\/$/, '');
  const apiKey = process.env.AI_BACKEND_API_KEY;
  return { backendUrl, apiKey };
}

// ── GET: proxy temporary audio from the private backend ─────────────────────
async function handleAudio(req, res) {
  const { userId } = await authenticate(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const file = String(req.query?.audio || '');
  if (!AUDIO_FILE_RE.test(file)) return res.status(400).json({ error: 'Invalid request' });

  const { backendUrl, apiKey } = backendConfig();
  if (!backendUrl || !apiKey) return res.status(500).json({ error: 'AI not configured' });

  try {
    const r = await fetch(`${backendUrl}/v1/audio/${file}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!r.ok) return res.status(404).json({ error: 'Not found' });
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buf);
  } catch {
    return res.status(502).json({ error: 'Voice service unavailable' });
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') return handleAudio(req, res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (process.env.SPOKEN_GUIDE_ENABLED === 'false') {
    return res.status(403).json({ error: 'Spoken guide disabled' });
  }

  const { token, userId, supabaseBase } = await authenticate(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const shared = await rateLimitedShared(supabaseBase, process.env.VITE_SUPABASE_ANON_KEY, token);
  const limited = shared.ok ? shared.limited : rateLimitedInMemory(userId);
  if (limited) return res.status(429).json({ error: 'Rate limit exceeded' });

  const body = req.body;
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid request body' });

  const privacyMode = body.privacyMode;
  if (!PRIVACY_MODES.has(privacyMode)) return res.status(400).json({ error: 'Invalid privacy mode' });

  const length = LENGTHS.has(body.length) ? body.length : 'short';
  const audioFormat = AUDIO_FORMATS.has(body.audioFormat) ? body.audioFormat : 'mp3';
  const includeScripture = body.includeScripture === true;
  const readFullDetails = body.readFullDetails === true;

  if (!Array.isArray(body.prayers)) return res.status(400).json({ error: 'Invalid prayers' });

  const maxPrayers = Number(process.env.SPOKEN_GUIDE_MAX_PRAYERS) || 20;
  const maxChars = Number(process.env.SPOKEN_GUIDE_MAX_CHARS_PER_PRAYER) || 1000;
  if (body.prayers.length > maxPrayers) return res.status(400).json({ error: 'Too many prayers' });

  // Enforce per-prayer size on the RAW input, then reduce per privacy mode.
  for (const p of body.prayers) {
    const len = (str(p?.title) + str(p?.details) + str(p?.summary)).length;
    if (len > maxChars) return res.status(413).json({ error: 'Prayer text too long' });
  }

  const prayers = body.prayers
    .map((p) => sanitizePrayer(p, privacyMode, readFullDetails, includeScripture))
    .filter(Boolean);

  // Forward ONLY the sanitized, known fields — never the raw client body. Anything
  // the client tacked on (other settings, ids, tokens) is dropped here, not merged.
  const safeBody = {
    mode: 'driving',
    privacyMode,
    voice: typeof body.voice === 'string' ? body.voice : 'calm',
    length,
    includeScripture,
    readFullDetails,
    prayers,
    locale: sanitizeLocale(body.locale),
    audioFormat,
  };

  const serialized = JSON.stringify(safeBody);
  if (serialized.length > MAX_BODY_BYTES) return res.status(413).json({ error: 'Request too large' });

  const { backendUrl, apiKey } = backendConfig();
  if (!backendUrl || !apiKey) return res.status(500).json({ error: 'AI not configured' });

  let data;
  try {
    const response = await fetch(`${backendUrl}/v1/spoken-guide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: serialized,
    });
    if (!response.ok) {
      // Never echo the backend body (it can contain the script/prayer content).
      if (response.status === 429) return res.status(429).json({ error: 'Rate limit exceeded' });
      return res.status(502).json({ error: 'Voice service unavailable' });
    }
    data = await response.json();
  } catch {
    // Backend down — fail gracefully; never fall back to a third-party provider.
    return res.status(502).json({ error: 'Voice service unavailable' });
  }

  // Rewrite the audio URL to our OWN proxy so the browser only ever calls
  // Pray4Me. The backend's audio_url basename is the temporary file name.
  let audioUrl = null;
  if (typeof data.audio_url === 'string') {
    const file = data.audio_url.split('/').pop();
    if (AUDIO_FILE_RE.test(file || '')) audioUrl = `/api/spoken-guide?audio=${file}`;
  }

  return res.status(200).json({
    sessionId: data.session_id,
    script: data.script,
    audioUrl,
    audioFormat: data.audio_format || audioFormat,
    durationSeconds: data.duration_seconds ?? null,
    expiresAt: data.expires_at ?? null,
    privacyMode,
    // Language the script was written in, and the voice that read it. They differ
    // when the backend had no matching Piper voice — the app shows a gentle notice.
    locale: data.locale ?? safeBody.locale,
    voiceLocale: data.voice_locale ?? null,
    voiceFallbackUsed: data.voice_fallback_used === true,
  });
}
