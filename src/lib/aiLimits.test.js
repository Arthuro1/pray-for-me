import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aiLimitGeneration, getAiLimitResponse, readAiLimit, rememberAiLimit, resetAiLimits } from './aiLimits';

beforeEach(() => { resetAiLimits(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-08T18:00:00Z')); });
afterEach(() => vi.useRealTimers());

describe('shared AI retry state', () => {
  it('cannot shorten a daily block when a concurrent minute-limit reply arrives later', async () => {
    const generation = aiLimitGeneration();
    rememberAiLimit('account-a', { code: 'daily_limit', retryAfterSeconds: 21_600 }, generation);
    rememberAiLimit('account-a', { code: 'rate_limit', retryAfterSeconds: 60 }, generation);
    expect(await getAiLimitResponse('account-a').json()).toEqual({ code: 'daily_limit', retryAfterSeconds: 21_600 });
    expect(getAiLimitResponse('account-b')).toBeNull();
  });

  it('clears expired blocks and rejects late responses after a privacy reset', () => {
    const generation = aiLimitGeneration();
    rememberAiLimit('account-a', { code: 'rate_limit', retryAfterSeconds: 60 }, generation);
    vi.advanceTimersByTime(60_000);
    expect(getAiLimitResponse('account-a')).toBeNull();
    resetAiLimits();
    rememberAiLimit('account-a', { code: 'daily_limit', retryAfterSeconds: 1000 }, generation);
    expect(getAiLimitResponse('account-a')).toBeNull();
  });

  it('discards untrusted error fields and bounds reported delays', async () => {
    const response = new Response(JSON.stringify({ code: 'rate_limit', retryAfterSeconds: 1e10, error: 'private content' }), { status: 429 });
    expect(await readAiLimit(response)).toEqual({ code: 'rate_limit', retryAfterSeconds: 86_400 });
  });
});
