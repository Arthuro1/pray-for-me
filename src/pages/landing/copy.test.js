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

function landingSchema(value) {
  if (Array.isArray(value)) return value.map(landingSchema);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, landingSchema(child)]),
    );
  }
  return typeof value;
}

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
    const englishCopy = await loadLandingCopy('en');
    const expectedSchema = landingSchema(englishCopy);
    const expectedFaqs = englishCopy.content.faqs.length;

    for (const [code, copy] of copies) {
      expect(landingSchema(copy), `${code}: complete landing schema`).toEqual(expectedSchema);
      expect(copy.content.signIn, `${code}: sign-in`).toEqual(expect.any(String));
      expect(copy.content.faqs, `${code}: FAQs`).toHaveLength(expectedFaqs);
      expect(copy.movements, `${code}: the seven movements, Come to Remember`).toHaveLength(7);
      expect(copy.circles.items, `${code}: the seven Intercession Circles`).toHaveLength(7);
      expect(copy.preview.rows, `${code}: Today preview rows`).toHaveLength(2);
      expect(copy.remember.nextSteps, `${code}: faithful next steps`).toHaveLength(3);
      expect(copy.facts.items, `${code}: facts strip`).toHaveLength(6);
      expect(copy.letter.storyBody.split('\n\n').length, `${code}: letter paragraphs`).toBeGreaterThan(1);
      expect(copy.hero.title, `${code}: hero title`).toEqual(expect.any(String));
      // The landing never carries authored Bible text — references only, and
      // those live in the components, written once and localized at render.
      expect(copy.content.verse, `${code}: no quoted verse`).toBeUndefined();
      expect(copy.content.ctaVerse, `${code}: no quoted verse`).toBeUndefined();
      expect(copy.scriptureReferences, `${code}: no per-locale references`).toBeUndefined();
      expect(copy.content.faqs[0].a, `${code}: privacy promise`).toEqual(expect.any(String));
      expect(copy.todayLabel, `${code}: today label`).toEqual(expect.any(String));
      expect(copy.prayNowLabel, `${code}: pray-now label`).toEqual(expect.any(String));
      expect(copy.languageMenuLabel, `${code}: language menu label`).toEqual(expect.any(String));
      expect(copy.translationInProgress, `${code}: translation status`).toEqual(expect.any(String));
    }
  });

  it('keeps optional YouTube controls complete in every language', async () => {
    const musicKeys = [
      'heading', 'invitation', 'title', 'caption', 'recording', 'play', 'close',
      'privacy', 'fallback', 'external', 'externalNotice',
    ];

    for (const code of LANDING_LOCALE_CODES) {
      const { music } = await loadLandingCopy(code);
      expect(Object.keys(music), `${code}: YouTube copy schema`).toEqual(musicKeys);
      for (const key of musicKeys) {
        expect(music[key], `${code}: music.${key}`).toEqual(expect.any(String));
        expect(music[key].trim(), `${code}: nonempty music.${key}`).not.toBe('');
      }
      expect(music.title, `${code}: canonical song title`).toBe('He Answers Prayers');
      expect(music.play.match(/\{title\}/g), `${code}: song-title interpolation`).toHaveLength(1);
      expect(music.play.replace('{title}', music.title), `${code}: resolved watch label`)
        .not.toMatch(/\{[^}]+\}/);
      for (const key of ['privacy', 'fallback', 'external', 'externalNotice']) {
        expect(music[key], `${code}: YouTube disclosure in music.${key}`).toContain('YouTube');
      }
    }
  });

  // Guard, not a unit test: the landing page shows the About page's words —
  // the author's letter above all — in every language, never a second version
  // of them. If this fails, copy the app locale's text, don't edit the test.
  it('speaks the About page\'s own words: the author\'s letter, the name and the access through Christ', async () => {
    for (const code of LANDING_LOCALE_CODES) {
      const copy = await loadLandingCopy(code);
      const app = (await import(`../../i18n/locales/${code}.js`)).default;
      expect(copy.letter.storyBody, `${code}: the letter`).toBe(app.aboutStoryBody);
      expect(copy.letter.quote, `${code}: the letter's line`).toBe(app.aboutPullQuote);
      expect(copy.letter.prayer, `${code}: the closing prayer`).toBe(app.aboutStoryPrayer);
      expect(copy.letter.title, `${code}: the letter's title`).toBe(app.aboutStoryTitle);
      expect(copy.come.nameBody, `${code}: the name`).toBe(app.aboutNameBody);
      expect(copy.come.christBody, `${code}: through Christ`).toBe(app.aboutAccessBody);
      expect(copy.hero.title, `${code}: the tagline`).toBe(app.aboutTagline);
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
