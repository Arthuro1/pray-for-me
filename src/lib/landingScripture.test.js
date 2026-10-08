import { describe, expect, it } from 'vitest';
import { LANDING_SCRIPTURE_REFS } from '../content/landingScripture.js';
import { localizeRef } from '../content/teaching/pick.js';
import { LANDING_LOCALE_CODES } from '../pages/landing/copy.js';
import { usfmFromReference } from './bibleRef.js';
import { versionForSource } from './bibleVersions.js';
import { getBundledVerse } from './verseBundle.js';

const bundles = import.meta.glob('../content/verses/*.json', { eager: true, import: 'default' });

// A range must contain every constituent verse, including any genuine verse
// bridges in its source edition. Testing a first-verse substring would let an
// incomplete passage pass while still showing Scripture.
function expectedPassage(bundle, usfm, context) {
  const [book, chapter, extent] = usfm.split('.');
  if (!extent) return bundle[`${book} ${chapter}`];
  const [start, end = start] = extent.split('-').map(Number);
  const exact = bundle[`${book} ${chapter}:${extent}`];
  const parts = [];
  for (let verse = start; verse <= end;) {
    const single = bundle[`${book} ${chapter}:${verse}`];
    if (single) {
      parts.push(single);
      verse++;
      continue;
    }
    // Editions may join two verses in a single source span. Use the shortest
    // stored bridge from this verse; never duplicate it as separate wording.
    const bridgeEnd = Array.from({ length: end - verse }, (_, i) => verse + i + 1)
      .find((last) => bundle[`${book} ${chapter}:${verse}-${last}`]);
    expect(bridgeEnd, `${context} needs verse ${verse} in ${usfm}`).toBeDefined();
    parts.push(bundle[`${book} ${chapter}:${verse}-${bridgeEnd}`]);
    verse = bridgeEnd + 1;
  }
  const assembled = parts.join(' ');
  if (exact) expect(exact, `${context} must preserve the complete source span`).toBe(assembled);
  return exact || assembled;
}

describe('landing Scripture — complete offline passages in every language', () => {
  it('covers the identity cards, story, letter, circle anchors, themes and facets', () => {
    expect(new Set(LANDING_SCRIPTURE_REFS).size).toBe(LANDING_SCRIPTURE_REFS.length);
    expect(LANDING_SCRIPTURE_REFS).toEqual(expect.arrayContaining([
      'Exodus 30:7-8', 'Hebrews 4:14-16', 'Luke 1:13-17', 'Luke 1:5-17',
      'Psalm 127', 'Hebrews 11', 'Luke 16:10', 'Titus 2:11-12',
    ]));
  });

  for (const lang of LANDING_LOCALE_CODES) {
    it(`resolves every ${lang} passage in full with its edition attribution`, async () => {
      const bundle = bundles[`../content/verses/${lang}.json`];
      expect(bundle, `Missing ${lang} offline Bible bundle`).toBeDefined();
      const version = versionForSource('bundle', lang);
      expect(version?.abbr, `Missing ${lang} edition abbreviation`).toBeTruthy();
      expect(version?.name, `Missing ${lang} edition name`).toBeTruthy();

      for (const reference of LANDING_SCRIPTURE_REFS) {
        const localized = localizeRef(reference, lang);
        const usfm = usfmFromReference(reference);
        expect(usfm, `${lang}: ${reference}`).toBeTruthy();
        const expected = expectedPassage(bundle, usfm, `${lang}: ${reference}`);
        expect(expected, `${lang}: ${reference} is incomplete`).toBeTruthy();
        const actual = await getBundledVerse({ reference: localized, lang });
        expect(actual, `${lang}: ${localized} should resolve offline`).toEqual({
          text: expected, ref: localized, source: 'bundle',
        });
        // The daily verse/reader path may already know the passage's USFM id.
        expect(await getBundledVerse({ reference: localized, lang, usfm })).toEqual(actual);
      }
    });
  }
});
