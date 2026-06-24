import { describe, it, expect } from 'vitest';
import { dateLocale, timeAgo, DATE_LOCALES } from './date.js';

describe('dateLocale', () => {
  it('returns a known locale for a supported language', () => {
    expect(dateLocale('fr')).toBe(DATE_LOCALES.fr);
  });

  it('falls back to enUS for an unknown language', () => {
    expect(dateLocale('xx')).toBe(DATE_LOCALES.en);
  });
});

describe('timeAgo', () => {
  it('produces a non-empty relative string', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const out = timeAgo(oneHourAgo, 'en');
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });
});
