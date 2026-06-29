import { describe, it, expect, beforeEach, vi } from 'vitest';
import handler from './anthropic.js';

// Minimal Express-like response double that records the last status + json body.
function mockRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

const validBody = () => ({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 500,
  messages: [{ role: 'user', content: 'Suggest a prayer point.' }],
});

function req({ method = 'POST', auth = 'Bearer good-token', body = validBody() } = {}) {
  return { method, headers: { authorization: auth }, body };
}

// fetch is called up to three times per successful request: (1) Supabase
// /auth/v1/user to authorize, (2) the check_ai_rate_limit RPC, (3) the upstream
// Anthropic call. We stub all three by URL. The RPC stub maintains a fixed-window
// counter (reset each installFetch) to mirror the real shared limiter; pass
// rpcOk=false to simulate the shared store being unreachable (forces the proxy's
// in-memory fallback).
function installFetch({ authOk = true, userId = 'user-1', rpcOk = true } = {}) {
  let rpcCount = 0;
  global.fetch = vi.fn(async (url, opts) => {
    const u = String(url);
    if (u.includes('/auth/v1/user')) {
      return { ok: authOk, json: async () => (authOk ? { id: userId } : {}) };
    }
    if (u.includes('/rpc/check_ai_rate_limit')) {
      if (!rpcOk) return { ok: false, status: 500, json: async () => ({}) };
      const { p_max } = JSON.parse(opts.body);
      rpcCount += 1;
      return { ok: true, status: 200, json: async () => rpcCount <= p_max };
    }
    return { ok: true, status: 200, json: async () => ({ content: [{ text: '[]' }] }) };
  });
}

beforeEach(() => {
  process.env.VITE_SUPABASE_URL = 'https://example.supabase.co/rest/v1/';
  process.env.VITE_SUPABASE_ANON_KEY = 'anon';
  process.env.ANTHROPIC_API_KEY = 'sk-test';
  installFetch();
});

describe('AI proxy — authentication', () => {
  it('rejects a request with no Authorization header (401)', async () => {
    const res = mockRes();
    await handler(req({ auth: '' }), res);
    expect(res.statusCode).toBe(401);
  });

  it('rejects when Supabase says the token is invalid (401)', async () => {
    installFetch({ authOk: false });
    const res = mockRes();
    await handler(req(), res);
    expect(res.statusCode).toBe(401);
  });

  it('rejects non-POST methods (405)', async () => {
    const res = mockRes();
    await handler(req({ method: 'GET' }), res);
    expect(res.statusCode).toBe(405);
  });
});

describe('AI proxy — request validation', () => {
  it('rejects an unsupported model (400)', async () => {
    const res = mockRes();
    await handler(req({ body: { ...validBody(), model: 'claude-opus-4-8' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects an empty messages array (400)', async () => {
    const res = mockRes();
    await handler(req({ body: { ...validBody(), messages: [] } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects a bad message role (400)', async () => {
    const res = mockRes();
    await handler(req({ body: { ...validBody(), messages: [{ role: 'system', content: 'x' }] } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects non-string message content (400)', async () => {
    const res = mockRes();
    await handler(req({ body: { ...validBody(), messages: [{ role: 'user', content: { hack: 1 } }] } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('forwards only {role, content}, stripping extra fields', async () => {
    const res = mockRes();
    const body = { ...validBody(), messages: [{ role: 'user', content: 'hi', injected: 'evil' }] };
    await handler(req({ body }), res);
    const upstreamCall = global.fetch.mock.calls.find(([u]) => String(u).includes('api.anthropic.com'));
    const sent = JSON.parse(upstreamCall[1].body);
    expect(sent.messages[0]).toEqual({ role: 'user', content: 'hi' });
  });

  it('caps max_tokens at the server ceiling', async () => {
    const res = mockRes();
    await handler(req({ body: { ...validBody(), max_tokens: 1_000_000 } }), res);
    const upstreamCall = global.fetch.mock.calls.find(([u]) => String(u).includes('api.anthropic.com'));
    expect(JSON.parse(upstreamCall[1].body).max_tokens).toBeLessThanOrEqual(2048);
  });
});

describe('AI proxy — per-user rate limiting', () => {
  it('returns 429 once a user exceeds the per-minute limit (shared store)', async () => {
    installFetch({ userId: `rl-${Date.now()}` });
    let limited = false;
    for (let i = 0; i < 25; i++) {
      const res = mockRes();
      await handler(req(), res);
      if (res.statusCode === 429) { limited = true; break; }
    }
    expect(limited).toBe(true);
  });

  it('does not rate-limit distinct users against each other', async () => {
    installFetch({ userId: `user-A-${Date.now()}` });
    const a = mockRes();
    await handler(req(), a);
    installFetch({ userId: `user-B-${Date.now()}` });
    const b = mockRes();
    await handler(req(), b);
    expect(b.statusCode).toBe(200);
  });

  it('falls back to the in-memory limiter when the shared store is unreachable', async () => {
    // rpcOk:false makes the RPC fail, so the proxy must still throttle via its
    // per-instance fallback. Unique user id keeps it isolated from other tests.
    installFetch({ userId: `fb-${Date.now()}`, rpcOk: false });
    let limited = false;
    for (let i = 0; i < 25; i++) {
      const res = mockRes();
      await handler(req(), res);
      if (res.statusCode === 429) { limited = true; break; }
    }
    expect(limited).toBe(true);
  });
});
