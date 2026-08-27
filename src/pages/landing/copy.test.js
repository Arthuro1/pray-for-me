import { describe, expect, it } from 'vitest';
import {
  FALLBACK_LANDING_COPY,
  FALLBACK_LANDING_LANG,
  LANDING_LOCALE_CODES,
  cachedLandingCopy,
  loadLandingCopy,
  resolveLandingCopy,
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

// The landing page paints before any chunk has loaded, so one complete dictionary
// has to be in hand synchronously — and whatever comes back later has to say
// which language it is really in, or the page would label itself wrongly.
describe('the always-available fallback', () => {
  it('has English in memory before anything is loaded', () => {
    expect(cachedLandingCopy(FALLBACK_LANDING_LANG)).toBe(FALLBACK_LANDING_COPY);
    expect(FALLBACK_LANDING_COPY.beginLabel).toBe('Begin with a prayer');
  });

  it('reports the language the copy is genuinely in', async () => {
    expect(await resolveLandingCopy('fr')).toMatchObject({ lang: 'fr' });
    // An unknown code cannot be loaded, so the answer is English AND says so —
    // the page then labels itself `en` instead of claiming a language it is not
    // showing.
    expect(await resolveLandingCopy('unsupported'))
      .toEqual({ lang: FALLBACK_LANDING_LANG, copy: FALLBACK_LANDING_COPY });
  });

  it('caches a language once loaded, so returning to it needs no request', async () => {
    await loadLandingCopy('de');
    expect(cachedLandingCopy('de')).toBeTruthy();
    expect(cachedLandingCopy('de').beginLabel).not.toBe(FALLBACK_LANDING_COPY.beginLabel);
  });
});
