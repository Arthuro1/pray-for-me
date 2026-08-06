import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler, { handleAiRequest } from './ai.js';

function mockRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

const validBody = () => ({ task: 'scripture_guidance', input: { title: 'Wisdom at work', description: '', lang: 'en' } });

function req({ method = 'POST', auth = 'Bearer good-token', body = validBody() } = {}) {
  return { method, headers: { authorization: auth }, body };
}

function installFetch({ upstreamStatus = 200, upstreamBody = { data: {}, usage: {} }, throws = false } = {}) {
  global.fetch = vi.fn(async () => {
    if (throws) throw new Error('network down');
    return {
      status: upstreamStatus,
      ok: upstreamStatus >= 200 && upstreamStatus < 300,
      json: async () => upstreamBody,
    };
  });
}

beforeEach(() => {
  process.env.AI_GATEWAY_URL = 'https://gateway.internal';
  delete process.env.AI_PROXY_DISABLED;
  installFetch();
});

describe('same-origin AI forwarder', () => {
  it('rejects non-POST methods', async () => {
    const res = mockRes();
    await handler(req({ method: 'GET' }), res);
    expect(res.statusCode).toBe(405);
  });

  it('requires a bearer token before forwarding', async () => {
    const res = mockRes();
    await handler(req({ auth: '' }), res);
    expect(res.statusCode).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('can be disabled globally without contacting the gateway', async () => {
    process.env.AI_PROXY_DISABLED = 'true';
    const res = mockRes();
    await handler(req(), res);
    expect(res.statusCode).toBe(503);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects an oversized body with 413', async () => {
    const res = mockRes();
    await handler(req({ body: { task: 'translate_texts', input: { texts: ['x'.repeat(40000)], lang: 'en' } } }), res);
    expect(res.statusCode).toBe(413);
  });

  it('returns 500 when the gateway URL is not configured', async () => {
    delete process.env.AI_GATEWAY_URL;
    const res = mockRes();
    await handler(req(), res);
    expect(res.statusCode).toBe(500);
  });

  it('forwards to the gateway /v1/tasks with the Authorization header and relays the response', async () => {
    const res = mockRes();
    installFetch({ upstreamStatus: 200, upstreamBody: { data: { ok: true }, usage: { model: 'qwen3:4b-instruct' } } });
    await handler(req(), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ data: { ok: true }, usage: { model: 'qwen3:4b-instruct' } });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://gateway.internal/v1/tasks');
    expect(options.headers.Authorization).toBe('Bearer good-token');
    // The forwarder holds no provider key and never targets an external provider.
    expect(url).not.toContain('anthropic');
    expect(url).not.toContain('openai');
  });

  it('relays a gateway error status verbatim', async () => {
    installFetch({ upstreamStatus: 429, upstreamBody: { error: 'Rate limit exceeded' } });
    const res = mockRes();
    await handler(req(), res);
    expect(res.statusCode).toBe(429);
    expect(res.body).toEqual({ error: 'Rate limit exceeded' });
  });

  it('maps a gateway network failure to a generic 502', async () => {
    installFetch({ throws: true });
    const res = mockRes();
    await handleAiRequest(req(), res, { env: process.env, fetchImpl: global.fetch });
    expect(res.statusCode).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain('network down');
  });
});
