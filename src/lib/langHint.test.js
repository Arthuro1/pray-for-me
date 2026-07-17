// The translation control must appear ONLY on a plausible language mismatch —
// and, above all, never clutter a monolingual group whose content matches the
// interface language.
import { describe, it, expect } from 'vitest';
import { contentLangHint, needsTranslationControl } from './langHint';

describe('contentLangHint', () => {
  it('detects non-Latin scripts outright', () => {
    expect(contentLangHint('Молитва за мою семью и работу')).toEqual(['ru']);
    expect(contentLangHint('صلاة من أجل عائلتي')).toEqual(['ar', 'fa']);
    expect(contentLangHint('가족을 위한 기도')).toEqual(['ko']);
  });

  it('detects Latin-script languages from distinctive stop words', () => {
    expect(contentLangHint('Priez pour la santé de mon père et pour une paix dans la famille')).toEqual(['fr']);
    expect(contentLangHint('Pray for the healing of my father and for peace in this house')).toEqual(['en']);
  });

  it('returns null when unsure (short or ambiguous text)', () => {
    expect(contentLangHint('Marc')).toBeNull();
    expect(contentLangHint('')).toBeNull();
  });
});

describe('needsTranslationControl', () => {
  it('hides the control when content matches the interface language', () => {
    expect(needsTranslationControl('Priez pour la santé de mon père et de la famille', 'fr')).toBe(false);
  });

  it('shows the control on a confident mismatch', () => {
    expect(needsTranslationControl('Priez pour la santé de mon père et de la famille', 'en')).toBe(true);
    expect(needsTranslationControl('Молитва за мою семью и работу', 'en')).toBe(true);
  });

  it('does not misfire between languages sharing a script (Arabic UI, Arabic-script text)', () => {
    expect(needsTranslationControl('صلاة من أجل عائلتي', 'ar')).toBe(false);
    expect(needsTranslationControl('صلاة من أجل عائلتي', 'fa')).toBe(false);
  });

  it('trusts an existing cached translation as proof of mismatch', () => {
    expect(needsTranslationControl('Marc', 'en', { hasCachedTranslation: true })).toBe(true);
  });

  it('stays hidden when unknown and nothing was ever translated', () => {
    expect(needsTranslationControl('Marc', 'en')).toBe(false);
  });
});
