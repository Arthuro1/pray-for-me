import { describe, it, expect } from 'vitest';
import { localizeAiError, languageName, scriptureSystemPrompt } from './aiCore';

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

describe('languageName', () => {
  it('maps known locale codes to English language names', () => {
    expect(languageName('fr')).toBe('French');
    expect(languageName('sw')).toBe('Swahili');
  });

  it('falls back to English for unknown codes', () => {
    expect(languageName('xx')).toBe('English');
  });
});

describe('scriptureSystemPrompt', () => {
  it('encodes the core guardrails and target language', () => {
    const prompt = scriptureSystemPrompt('fr');
    expect(prompt).toMatch(/NOT a pastor/i);
    expect(prompt).toMatch(/never claim to speak for God/i);
    expect(prompt).toMatch(/valid JSON/i);
    expect(prompt).toMatch(/French/);
  });
});
