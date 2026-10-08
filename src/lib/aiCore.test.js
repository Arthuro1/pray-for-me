import { beforeEach, describe, it, expect, vi } from 'vitest';
import { localizeAiError, resetAiRequestState, callAiForJson } from './aiCore';
import { aiFetch } from './aiClient';
import { loadLocale } from '../i18n';

vi.mock('./aiClient', () => ({ aiFetch: vi.fn() }));

describe('AI limit errors', () => {
  beforeEach(async () => {
    resetAiRequestState();
    vi.clearAllMocks();
    await loadLocale('de');
    await loadLocale('en');
  });

  it.each([
    ['daily_limit', /Tageslimit|tägliche|täglichen/i],
    ['rate_limit', /37/],
    ['provider_rate_limit', /37/],
  ])('shows an accurate localized message for %s', async (code, expected) => {
    aiFetch.mockResolvedValue(new Response(JSON.stringify({ code, retryAfterSeconds: 37 }), { status: 429 }));
    const result = await callAiForJson({ task: 'prayer_recommendations', input: {}, feature: 'prayer' });
    expect(result.data).toBeNull();
    expect(result.error).toEqual({ type: code, seconds: 37 });
    expect(localizeAiError(result.error, 'de')).toMatch(expected);
    if (code === 'daily_limit') expect(localizeAiError(result.error, 'de')).not.toMatch(/ausgelastet/);
  });

  it('uses the legacy busy message for an unrecognized 429 without displaying diagnostic text', async () => {
    aiFetch.mockResolvedValue(new Response(JSON.stringify({ code: 'private prayer content', error: 'private diagnostic' }), { status: 429 }));
    const result = await callAiForJson({ task: 'prayer_recommendations', input: {} });
    expect(result.error.type).toBe('busy');
    expect(localizeAiError(result.error, 'en')).not.toMatch(/private|diagnostic/);
  });
});

describe('localizeAiError', () => {
  it('returns null when there is no error', () => {
    expect(localizeAiError(null, 'en')).toBeNull();
  });

  it('localizes the cooldown error with the remaining seconds', () => {
    const msg = localizeAiError({ type: 'cooldown', seconds: 3 }, 'en');
    expect(typeof msg).toBe('string');
    expect(msg).toMatch(/3/);
  });

  it('localizes the busy error', () => {
    expect(typeof localizeAiError({ type: 'busy' }, 'en')).toBe('string');
  });

  // Regression: the generic error path once called an undefined `logError`,
  // throwing a ReferenceError instead of returning user-facing copy. This is the
  // path hit on a real upstream failure, so it must never throw.
  it('returns copy (does not throw) on a generic error', () => {
    expect(() => localizeAiError({ type: 'error' }, 'en')).not.toThrow();
    expect(typeof localizeAiError({ type: 'error' }, 'en')).toBe('string');
  });
});
