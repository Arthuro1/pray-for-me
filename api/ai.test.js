import { describe, it, expect, beforeEach, vi } from 'vitest';
import handler from './ai.js';

function mockRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

const validBody = () => ({
  model: 'llama3.1:8b',
  max_tokens: 500,
  messages: [{ role: 'user', content: 'Suggest a prayer point.' }],
});

function req({ method = 'POST', auth = 'Bearer good-token', body = validBody() } = {}) {
  return { method, headers: { authorization: auth }, body };
}

// Stub the up-to-three fetches per request by URL: (1) Supabase auth, (2) the
// rate-limit RPC, (3) the private AI backend. `backend` steers the third one.
function installFetch({ authOk = true, userId = 'user-1', rpcOk = true, backend = 'ok' } = {}) {
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
    // Private AI backend.
    if (backend === 'throw') throw new Error('backend down');
    if (backend === 'error500') {
      return { ok: false, status: 500, json: async () => ({ error: 'upstream: secret prayer text' }) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: 'chatcmpl-1',
        model: 'llama3.1:8b',
        choices: [{ index: 0, message: { role: 'assistant', content: '[]' }, finish_reason: 'stop' }],
      }),
    };
  });
}

beforeEach(() => {
  process.env.VITE_SUPABASE_URL = 'https://example.supabase.co/rest/v1/';
  process.env.VITE_SUPABASE_ANON_KEY = 'anon';
  process.env.AI_BACKEND_URL = 'https://ai.example.com';
  process.env.AI_BACKEND_API_KEY = 'svc-secret';
  process.env.AI_MODEL = 'llama3.1:8b';
  process.env.AI_ALLOWED_MODELS = 'llama3.1:8b,mistral:7b';
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
  it('rejects an unapproved model (400)', async () => {
    const res = mockRes();
    await handler(req({ body: { ...validBody(), model: 'gpt-4o' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects an empty messages array (400)', async () => {
    const res = mockRes();
    await handler(req({ body: { ...validBody(), messages: [] } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects an invalid message role (400)', async () => {
    const res = mockRes();
    await handler(req({ body: { ...validBody(), messages: [{ role: 'robot', content: 'x' }] } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('accepts a system role (used for the guardrail)', async () => {
    const res = mockRes();
    const body = { ...validBody(), messages: [{ role: 'system', content: 'guardrail' }, { role: 'user', content: 'hi' }] };
    await handler(req({ body }), res);
    expect(res.statusCode).toBe(200);
  });

  it('rejects empty/whitespace content (400)', async () => {
    const res = mockRes();
    await handler(req({ body: { ...validBody(), messages: [{ role: 'user', content: '   ' }] } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('enforces the maximum payload size (413)', async () => {
    const res = mockRes();
    const huge = 'a'.repeat(70 * 1024);
    await handler(req({ body: { ...validBody(), messages: [{ role: 'user', content: huge }] } }), res);
    expect(res.statusCode).toBe(413);
  });

  it('caps max_tokens at the server ceiling', async () => {
    const res = mockRes();
    await handler(req({ body: { ...validBody(), max_tokens: 1_000_000 } }), res);
    const call = global.fetch.mock.calls.find(([u]) => String(u).includes('/v1/chat/completions'));
    expect(JSON.parse(call[1].body).max_tokens).toBeLessThanOrEqual(2048);
  });

  it('forwards only {role, content}, stripping extra fields', async () => {
    const res = mockRes();
    const body = { ...validBody(), messages: [{ role: 'user', content: 'hi', injected: 'evil' }] };
    await handler(req({ body }), res);
    const call = global.fetch.mock.calls.find(([u]) => String(u).includes('/v1/chat/completions'));
    expect(JSON.parse(call[1].body).messages[0]).toEqual({ role: 'user', content: 'hi' });
  });
});

describe('AI proxy — backend wiring', () => {
  it('calls the configured private AI backend with the service key', async () => {
    const res = mockRes();
    await handler(req(), res);
    const call = global.fetch.mock.calls.find(([u]) => String(u).includes('/v1/chat/completions'));
    expect(String(call[0])).toBe('https://ai.example.com/v1/chat/completions');
    expect(call[1].headers.Authorization).toBe('Bearer svc-secret');
    expect(res.statusCode).toBe(200);
  });

  it('does not call Anthropic or any third-party host', async () => {
    const res = mockRes();
    await handler(req(), res);
    const hosts = global.fetch.mock.calls.map(([u]) => String(u));
    expect(hosts.some((h) => h.includes('anthropic.com') || h.includes('openai.com'))).toBe(false);
  });

  it('handles backend downtime gracefully (502)', async () => {
    installFetch({ backend: 'throw' });
    const res = mockRes();
    await handler(req(), res);
    expect(res.statusCode).toBe(502);
  });

  it('does not expose raw backend errors', async () => {
    installFetch({ backend: 'error500' });
    const res = mockRes();
    await handler(req(), res);
    expect(res.statusCode).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain('secret');
    expect(res.body).toEqual({ error: 'AI service unavailable' });
  });

  it('returns 500 when the backend is not configured', async () => {
    delete process.env.AI_BACKEND_URL;
    const res = mockRes();
    await handler(req(), res);
    expect(res.statusCode).toBe(500);
  });
});

describe('AI proxy — per-user rate limiting', () => {
  it('returns 429 once a user exceeds the per-minute limit', async () => {
    installFetch({ userId: `rl-${Date.now()}` });
    let limited = false;
    for (let i = 0; i < 25; i++) {
      const res = mockRes();
      await handler(req(), res);
      if (res.statusCode === 429) { limited = true; break; }
    }
    expect(limited).toBe(true);
  });

  it('falls back to the in-memory limiter when the shared store is unreachable', async () => {
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
