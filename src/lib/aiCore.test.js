import { describe, it, expect } from 'vitest';
import { localizeAiError, hasReviewedOutgoing, markOutgoingReviewed, resetAiRequestState } from './aiCore';

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

describe('outgoing-text review state', () => {
  it('tracks per-prayer review and clears on reset', () => {
    resetAiRequestState();
    expect(hasReviewedOutgoing('prayer-1')).toBe(false);
    markOutgoingReviewed('prayer-1');
    expect(hasReviewedOutgoing('prayer-1')).toBe(true);
    expect(hasReviewedOutgoing('prayer-2')).toBe(false);
    resetAiRequestState();
    expect(hasReviewedOutgoing('prayer-1')).toBe(false);
  });
});

