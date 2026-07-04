import { describe, it, expect } from 'vitest';
import { EVENTS, isEventAllowed, sanitizeProps } from './analytics';

describe('isEventAllowed', () => {
  it('accepts declared events and rejects anything else', () => {
    expect(isEventAllowed(EVENTS.FIRST_PRAYER_CREATED)).toBe(true);
    expect(isEventAllowed('first_prayer_created')).toBe(true);
    expect(isEventAllowed('read_prayer_text')).toBe(false);
    expect(isEventAllowed('')).toBe(false);
    expect(isEventAllowed(undefined)).toBe(false);
  });
});

describe('sanitizeProps — the privacy guard', () => {
  it('keeps allowlisted scalar props', () => {
    expect(sanitizeProps({ plan: 'free', count: 3, enabled: true })).toEqual({
      plan: 'free', count: 3, enabled: true,
    });
  });

  it('drops any key not on the allowlist (e.g. anything resembling content)', () => {
    const dirty = {
      title: 'Pray for my mother',
      description: 'she is very sick',
      personName: 'Jane Doe',
      phone: '+15551234567',
      testimony: 'God healed her',
      prompt: 'write a prayer about...',
      text: 'secret',
      plan: 'supporter',
    };
    expect(sanitizeProps(dirty)).toEqual({ plan: 'supporter' });
  });

  it('drops non-scalar values even on allowlisted keys', () => {
    expect(sanitizeProps({ feature: { nested: 1 }, count: [1, 2], method: () => {} })).toBeUndefined();
  });

  it('drops overly long strings (guards against smuggled free text)', () => {
    const long = 'x'.repeat(65);
    expect(sanitizeProps({ source: long })).toBeUndefined();
    expect(sanitizeProps({ source: 'onboarding' })).toEqual({ source: 'onboarding' });
  });

  it('returns undefined for empty / non-object input', () => {
    expect(sanitizeProps(undefined)).toBeUndefined();
    expect(sanitizeProps(null)).toBeUndefined();
    expect(sanitizeProps({})).toBeUndefined();
    expect(sanitizeProps('nope')).toBeUndefined();
  });

  it('drops NaN / infinite numbers', () => {
    expect(sanitizeProps({ count: NaN })).toBeUndefined();
    expect(sanitizeProps({ count: Infinity })).toBeUndefined();
  });
});
