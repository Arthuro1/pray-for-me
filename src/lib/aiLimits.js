// Only content-free, allowlisted limit metadata is retained, in memory and per
// authenticated account/provider. Never retain or surface an error body/message.
const limits = new Map();
const codes = new Set(['daily_limit', 'rate_limit', 'provider_rate_limit']);
// Daily allowances can change on the server (or a rejected provider request can
// release a reservation). Recheck at most once a minute instead of letting an
// old response lock this browser out until midnight.
const DAILY_RECHECK_MS = 60_000;
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
  // Track each kind separately: rechecking a daily allowance must not discard a
  // concurrent provider cooldown that still forbids requests for several minutes.
  const accountLimits = limits.get(account) || new Map();
  if ((accountLimits.get(limit.code)?.until || 0) > until) return;
  const recheckAt = limit.code === 'daily_limit' ? Math.min(until, Date.now() + DAILY_RECHECK_MS) : until;
  accountLimits.set(limit.code, { ...limit, until, recheckAt });
  limits.set(account, accountLimits);
}

export function getAiLimitResponse(account) {
  const accountLimits = limits.get(account);
  if (!accountLimits) return null;
  const now = Date.now();
  let limit = null;
  for (const [code, entry] of accountLimits) {
    if (now >= entry.recheckAt) {
      accountLimits.delete(code);
    } else if (!limit || entry.recheckAt > limit.recheckAt || (entry.recheckAt === limit.recheckAt && entry.until > limit.until)) {
      limit = entry;
    }
  }
  if (!limit) {
    limits.delete(account);
    return null;
  }
  const seconds = Math.ceil((limit.until - now) / 1000);
  return new Response(JSON.stringify({ code: limit.code, retryAfterSeconds: seconds }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': String(seconds) },
  });
}
