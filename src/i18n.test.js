import { describe, it, expect } from 'vitest';
import { t, LANGUAGES, isLocaleLoaded } from './i18n.js';

describe('t()', () => {
  it('returns a French (bundled fallback) string', () => {
    expect(t('fr', 'close')).toBe('Fermer');
  });

  it('falls back to French for a language not yet loaded', () => {
    // 'en' is code-split and not loaded in this unit context, so t() falls back to fr.
    expect(t('en', 'close')).toBe('Fermer');
  });

  it('falls back to the key itself for an unknown key', () => {
    expect(t('fr', '__does_not_exist__')).toBe('__does_not_exist__');
  });

  it('interpolates {vars}', () => {
    // Use a synthetic key path via a known interpolated string is hard without a
    // guaranteed placeholder key, so assert the replace logic on a missing key
    // that returns itself unchanged when no vars are present.
    expect(t('fr', 'Hello {name}', { name: 'Paul' })).toBe('Hello Paul');
  });

  it('drops placeholders with no matching var', () => {
    expect(t('fr', '{a}-{b}', { a: 'x' })).toBe('x-');
  });
});

describe('LANGUAGES', () => {
  it('lists 16 languages with French only loaded by default', () => {
    expect(LANGUAGES).toHaveLength(16);
    expect(isLocaleLoaded('fr')).toBe(true);
    expect(isLocaleLoaded('en')).toBe(false);
  });
});
