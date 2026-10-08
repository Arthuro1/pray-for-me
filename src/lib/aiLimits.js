// Only content-free, allowlisted limit metadata is retained, in memory and per
// authenticated account/provider. Never retain or surface an error body/message.
const limits = new Map();
const codes = new Set(['daily_limit', 'rate_limit', 'provider_rate_limit']);
let generation = 0;

export function resetAiLimits() {
  generation += 1;
  limits.clear();
}

export function aiLimitGeneration() { return generation; }

export async function readAiLimit(response) {
  const body = await response.json().catch(() => null);
  const code = codes.has(body?.code) ? body.code : 'busy';
  const rawSeconds = body?.retryAfterSeconds ?? response.headers?.get?.('Retry-After');
  const seconds = Number(rawSeconds);
  return {
    code,
    retryAfterSeconds: Number.isFinite(seconds) && seconds > 0 ? Math.min(86_400, Math.ceil(seconds)) : 60,
  };
}

export function rememberAiLimit(account, limit, requestGeneration) {
  if (requestGeneration !== generation) return;
  const until = Date.now() + limit.retryAfterSeconds * 1000;
  // Concurrent replies must not shorten a daily block to a minute-long pause.
  if ((limits.get(account)?.until || 0) > until) return;
  limits.set(account, { ...limit, until });
}

export function getAiLimitResponse(account) {
  const limit = limits.get(account);
  if (!limit) return null;
  const seconds = Math.ceil((limit.until - Date.now()) / 1000);
  if (seconds <= 0) {
    limits.delete(account);
    return null;
  }
  return new Response(JSON.stringify({ code: limit.code, retryAfterSeconds: seconds }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': String(seconds) },
  });
}
