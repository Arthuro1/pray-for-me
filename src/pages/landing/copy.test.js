import { describe, expect, it } from 'vitest';
import {
  LANDING_LOCALE_CODES,
  loadLandingCopy,
} from './copy';

const EXPECTED_CODES = [
  'am', 'ar', 'de', 'en', 'es', 'fa', 'fr', 'hi',
  'id', 'ja', 'ko', 'pt', 'ru', 'sw', 'tl', 'zh',
];

describe('landing locale chunks', () => {
  it('preserves all 16 supported languages with the complete landing schema', async () => {
    expect([...LANDING_LOCALE_CODES].sort()).toEqual(EXPECTED_CODES);

    const copies = await Promise.all(
      LANDING_LOCALE_CODES.map(async (code) => [code, await loadLandingCopy(code)]),
    );

    // The landing copy is a whole-file swap with NO key-level fallback: whatever
    // a locale's array holds is exactly what that reader sees. So the FAQ list is
    // measured against English rather than a floor — a `>= 3` check once let eight
    // locales ship three questions while everyone else saw five, silently and with
    // every test green.
    const expectedFaqs = (await loadLandingCopy('en')).content.faqs.length;

    for (const [code, copy] of copies) {
      expect(copy.content.signIn, `${code}: sign-in`).toEqual(expect.any(String));
      expect(copy.content.features, `${code}: features`).toHaveLength(9);
      expect(copy.content.steps, `${code}: steps`).toHaveLength(3);
      expect(copy.content.faqs, `${code}: FAQs`).toHaveLength(expectedFaqs);
      expect(copy.benefits, `${code}: benefits`).toHaveLength(3);
      expect(copy.scripturePreviewPoints, `${code}: Scripture points`).toHaveLength(2);
      expect(copy.scriptureReferences, `${code}: Scripture references`).toHaveLength(2);
      expect(copy.heroReassurance, `${code}: device-local promise`).toEqual(expect.any(String));
      expect(copy.privacyFaq, `${code}: privacy promise`).toEqual(expect.any(String));
      expect(copy.todayLabel, `${code}: today label`).toEqual(expect.any(String));
      expect(copy.prayNowLabel, `${code}: pray-now label`).toEqual(expect.any(String));
      expect(copy.languageMenuLabel, `${code}: language menu label`).toEqual(expect.any(String));
      expect(copy.translationInProgress, `${code}: translation status`).toEqual(expect.any(String));
    }
  });

  it('falls back to English for an unknown locale without loading authenticated data', async () => {
    const copy = await loadLandingCopy('unsupported');
    expect(copy.beginLabel).toBe('Begin with a prayer');
    expect(copy.content.signIn).toBe('Sign in');
  });
});
