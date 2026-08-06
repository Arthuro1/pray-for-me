// Shared in-memory cache for AI results (Scripture guidance, prayer points).
//
// Two properties matter for privacy and safety:
//   1. Keys are a SHA-256 digest over [userId, task, cacheVersion, model, lang,
//      input]. The user id is part of every key, so a cached result can NEVER be
//      served across accounts. The raw prayer text is hashed INTO the key — never
//      stored, and never truncated, as the key itself (which would leak content).
//   2. Every cache registers here so consent withdrawal, sign-out, account
//      switch, and vault lock can clear ALL of them at once (clearAllAiResultCaches).
//
// Bump AI_CACHE_VERSION whenever the gateway's prompts or task schemas change so
// stale, differently-shaped results are never reused.

export const AI_CACHE_VERSION = 2;

const registry = new Set();

// Create a namespaced result cache. `map` is exposed for tests.
export function createAiCache() {
  const map = new Map();
  const cache = {
    map,
    get: (key) => map.get(key),
    has: (key) => map.has(key),
    set: (key, value) => {
      map.set(key, value);
      // Bound growth: this is a session cache, not a store.
      if (map.size > 200) {
        const oldest = map.keys().next().value;
        if (oldest !== undefined) map.delete(oldest);
      }
    },
    clear: () => map.clear(),
  };
  registry.add(cache);
  return cache;
}

// Clear every registered AI result cache. Called on sign-out, account switch,
// vault lock, and AI consent withdrawal so no decrypted-in-memory result lingers.
export function clearAllAiResultCaches() {
  for (const cache of registry) cache.clear();
}

const encoder = new TextEncoder();

async function sha256Hex(str) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(str));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Deterministic, content-free cache key. `input` may contain prayer text; it is
// hashed, so the returned key is an opaque hex digest with no readable content.
export async function aiCacheKey({ userId, task, model, lang, input }) {
  const payload = JSON.stringify([userId || 'anon', task, AI_CACHE_VERSION, model || 'server', lang, input]);
  return sha256Hex(payload);
}
