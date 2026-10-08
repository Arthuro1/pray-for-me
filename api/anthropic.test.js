import { describe, it, expect, vi } from 'vitest';
import handler, { handleAnthropicRequest, MAX_REQUEST_BYTES } from './anthropic.js';
import aiHandler, { handleAiRequest } from './ai.js';

function response() {
  return { statusCode: 200, body: undefined, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

describe('legacy Anthropic compatibility route', () => {
  it('uses exactly the same authenticated, validated task handler', () => {
    expect(handler).toBe(aiHandler);
    expect(handleAnthropicRequest).toBe(handleAiRequest);
    expect(MAX_REQUEST_BYTES).toBe(32 * 1024);
  });

  it('cannot bypass the Claude provider disclosure guard', async () => {
    const res = response();
    const fetchImpl = vi.fn();
    await handleAnthropicRequest({ method: 'POST', headers: { authorization: 'Bearer token' }, body: {} }, res, { env: { AI_PROVIDER: 'anthropic' }, fetchImpl });
    expect(res.statusCode).toBe(409);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('cannot restore the removed arbitrary reference conversion or free-form relay', async () => {
    for (const body of [
      { task: 'bible_reference_to_usfm', input: { reference: 'John 3:16' } },
      { model: 'model', messages: [{ role: 'user', content: 'text' }] },
    ]) {
      const res = response();
      const fetchImpl = vi.fn();
      await handleAnthropicRequest({ method: 'POST', headers: { authorization: 'Bearer token', 'x-qetoret-ai-provider': 'anthropic' }, body }, res, { env: { AI_PROVIDER: 'anthropic' }, fetchImpl });
      expect(res.statusCode).toBe(400);
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });
});
