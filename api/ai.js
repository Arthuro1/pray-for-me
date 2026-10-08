// Same-origin, authenticated AI tasks. Claude runs directly from this server
// function; an explicitly selected private/Ollama deployment can use a gateway.
// Never log request bodies, model output, credentials, or access tokens.
import { validateTaskRequest, buildTask } from '../server/aiTasks.js';
import { parseModelResponse, validateTaskResponse } from '../server/aiResponses.js';

export const MAX_REQUEST_BYTES = 32 * 1024;
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

function boundedInt(value, fallback, min, max) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min ? Math.min(number, max) : fallback;
}

function userDailyLimit(env) {
  const regular = boundedInt(env.AI_USER_DAILY_LIMIT, 100, 1, 10_000);
  const until = Date.parse(env.AI_USER_DAILY_LIMIT_TEMPORARY_UNTIL || '');
  return Number.isFinite(until) && Date.now() < until
    ? boundedInt(env.AI_USER_DAILY_LIMIT_TEMPORARY, regular, 1, 10_000)
    : regular;
}

function rateLimit(res, code, retryAfterSeconds) {
  res.setHeader?.('Retry-After', String(retryAfterSeconds));
  return res.status(429).json({ error: 'AI request limit reached', code, retryAfterSeconds });
}

function providerRetryAfter(response) {
  const raw = response.headers?.get?.('retry-after');
  if (!raw) return 60;
  const seconds = /^\d+(?:\.\d+)?$/.test(raw.trim())
    ? Number(raw) : (Date.parse(raw) - Date.now()) / 1000;
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(86_400, Math.ceil(seconds)) : 60;
}

async function callClaude(req, res, { env, fetchImpl, request, signal }) {
  const supabaseBase = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '')
    .replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseBase || !anonKey || !env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'AI not configured' });
  }
  const authorization = req.headers.authorization;
  const supabaseHeaders = { Authorization: authorization, apikey: anonKey };
  let stage = 'auth';
  try {
    // Verify the token with Auth, never with client-supplied user identifiers or
    // decoded JWT claims. Supabase also scopes the quota RPCs to auth.uid().
    const auth = await fetchImpl(`${supabaseBase}/auth/v1/user`, { headers: supabaseHeaders, signal });
    if (!auth.ok) {
      return auth.status >= 500
        ? res.status(503).json({ error: 'AI authentication unavailable' })
        : res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await auth.json();
    if (typeof user?.id !== 'string' || !user.id) return res.status(401).json({ error: 'Unauthorized' });

    stage = 'quota';
    const rpc = async (name, body) => {
      const response = await fetchImpl(`${supabaseBase}/rest/v1/rpc/${name}`, {
        method: 'POST', signal,
        headers: { ...supabaseHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return response.ok ? response.json() : null;
    };
    // Fail closed: process-local counters do not enforce quotas across
    // serverless instances. Both checks use the shared Postgres counters.
    const minute = await rpc('check_ai_rate_limit', { p_max: 20, p_window_seconds: 60 });
    if (typeof minute !== 'boolean') return res.status(503).json({ error: 'AI quota service unavailable' });
    if (!minute) return rateLimit(res, 'rate_limit', 60);
    const daily = await rpc('check_ai_usage_quota', {
      p_user_daily_max: userDailyLimit(env),
      p_global_daily_max: boundedInt(env.AI_GLOBAL_DAILY_LIMIT, 5_000, 1, 1_000_000),
    });
    if (typeof daily?.allowed !== 'boolean') return res.status(503).json({ error: 'AI quota service unavailable' });
    if (!daily.allowed) {
      const now = Date.now();
      const nextUtcDay = Math.floor(now / 86_400_000) * 86_400_000 + 86_400_000;
      return rateLimit(res, 'daily_limit', Math.ceil((nextUtcDay - now) / 1000));
    }

    stage = 'provider';
    const model = env.ANTHROPIC_MODEL || DEFAULT_MODEL;
    const built = buildTask(request);
    const response = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        ...built, model,
        system: [{ type: 'text', text: built.system, cache_control: { type: 'ephemeral' } }],
      }),
    });
    // Provider errors can echo the input. Do not read or return their bodies.
    if (response.status === 429) return rateLimit(res, 'provider_rate_limit', providerRetryAfter(response));
    if (!response.ok) return res.status(502).json({ error: 'AI provider unavailable' });
    stage = 'output';
    const payload = await response.json();
    // Truncation, refusals and unfinished turns never become partial success.
    if (payload?.stop_reason !== 'end_turn') return res.status(502).json({ error: 'Invalid AI response' });
    const content = (Array.isArray(payload.content) ? payload.content : [])
      .filter(block => block?.type === 'text' && typeof block.text === 'string')
      .map(block => block.text).join('');
    const data = validateTaskResponse(request, parseModelResponse(content));
    const safeCount = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
    return res.status(200).json({
      data,
      usage: {
        inputTokens: safeCount(payload.usage?.input_tokens),
        outputTokens: safeCount(payload.usage?.output_tokens),
        model,
      },
    });
  } catch {
    if (signal.aborted) return res.status(504).json({ error: 'AI request timed out' });
    if (stage === 'auth') return res.status(503).json({ error: 'AI authentication unavailable' });
    if (stage === 'quota') return res.status(503).json({ error: 'AI quota service unavailable' });
    return res.status(502).json({ error: stage === 'output' ? 'Invalid AI response' : 'AI provider unavailable' });
  }
}

export async function handleAiRequest(req, res, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  res.setHeader?.('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (env.AI_PROXY_DISABLED === 'true') return res.status(503).json({ error: 'AI temporarily disabled' });

  // Direct Claude is the default; private inference is always explicitly chosen.
  const provider = env.AI_PROVIDER || 'anthropic';
  if (!['anthropic', 'ollama', 'private'].includes(provider)) return res.status(500).json({ error: 'AI not configured' });
  if (provider === 'anthropic' && req.headers['x-qetoret-ai-provider'] !== 'anthropic') {
    return res.status(409).json({ error: 'AI provider changed. Reload the app and review AI consent.' });
  }
  const authorization = req.headers.authorization;
  if (typeof authorization !== 'string' || !/^Bearer\s+\S+$/.test(authorization)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    if (new TextEncoder().encode(JSON.stringify(req.body)).byteLength > MAX_REQUEST_BYTES) {
      return res.status(413).json({ error: 'Request too large' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  const request = validateTaskRequest(req.body);
  if (!request) return res.status(400).json({ error: 'Unsupported or invalid task' });

  const controller = new AbortController();
  // Includes auth, quotas, provider headers AND its response body. Vercel allows
  // 60 seconds for these routes; return our own generic timeout before that.
  const timer = setTimeout(() => controller.abort(), boundedInt(env.AI_REQUEST_TIMEOUT_MS, 50_000, 1_000, 50_000));
  try {
    if (provider === 'anthropic') {
      return await callClaude(req, res, { env, fetchImpl, request, signal: controller.signal });
    }
    const gatewayUrl = (env.AI_GATEWAY_URL || '').replace(/\/$/, '');
    if (!gatewayUrl) return res.status(500).json({ error: 'AI not configured' });
    const response = await fetchImpl(`${gatewayUrl}/v1/tasks`, {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: authorization },
      body: JSON.stringify(request),
    });
    return res.status(response.status).json(await response.json());
  } catch {
    return res.status(controller.signal.aborted ? 504 : 502).json({ error: 'AI provider unavailable' });
  } finally {
    clearTimeout(timer);
  }
}

export default function handler(req, res) {
  return handleAiRequest(req, res);
}
