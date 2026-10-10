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

  it('rechecks a daily limit after a minute while preserving the actual reset metadata', async () => {
    rememberAiLimit('account-a', { code: 'daily_limit', retryAfterSeconds: 21_600 }, aiLimitGeneration());
    vi.advanceTimersByTime(59_000);
    expect(await getAiLimitResponse('account-a').json()).toEqual({ code: 'daily_limit', retryAfterSeconds: 21_541 });
    vi.advanceTimersByTime(1000);
    expect(getAiLimitResponse('account-a')).toBeNull();
  });

  it.each([['daily_limit', 'provider_rate_limit'], ['provider_rate_limit', 'daily_limit']])(
    'preserves a longer provider cooldown when replies arrive as %s then %s', async (first, second) => {
      const generation = aiLimitGeneration();
      for (const code of [first, second]) {
        rememberAiLimit('account-a', { code, retryAfterSeconds: code === 'daily_limit' ? 21_600 : 300 }, generation);
        vi.advanceTimersByTime(10_000);
      }
      vi.advanceTimersByTime(60_000);
      const response = getAiLimitResponse('account-a');
      expect(response.status).toBe(429);
      expect((await response.json()).code).toBe('provider_rate_limit');
      vi.advanceTimersByTime(240_000);
      expect(getAiLimitResponse('account-a')).toBeNull();
    },
  );
});
