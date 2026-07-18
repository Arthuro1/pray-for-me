// Deterministic reference → USFM mapping. This is the path that lets plan verses,
// faithfulness/movement Psalms, and range references resolve their text WITHOUT
// the fragile, cost-throttled AI round-trip that used to leave the reader stuck on
// "reference only" (no text) for everything outside the offline bundle.
import { describe, it, expect } from 'vitest';
import { usfmFromReference, versionForLang, versionSupportsUsfm, LANG_VERSION } from './bibleRef';

describe('usfmFromReference — deterministic citation mapping', () => {
  it('maps English single-verse references the plans author', () => {
    expect(usfmFromReference('Joel 2:12')).toBe('JOL.2.12');
    expect(usfmFromReference('Isaiah 58:6')).toBe('ISA.58.6');
    expect(usfmFromReference('Esther 4:16')).toBe('EST.4.16');
    expect(usfmFromReference('Acts 2:42')).toBe('ACT.2.42');
    expect(usfmFromReference('Daniel 6:10')).toBe('DAN.6.10');
  });

  it('maps numbered books', () => {
    expect(usfmFromReference('1 Thessalonians 5:18')).toBe('1TH.5.18');
    expect(usfmFromReference('2 Chronicles 7:14')).toBe('2CH.7.14');
    expect(usfmFromReference('1 Peter 5:7')).toBe('1PE.5.7');
  });

  it('preserves a verse range as BOOK.CH.START-END (whole passage, not just v1)', () => {
    expect(usfmFromReference('Philippians 1:3-11')).toBe('PHP.1.3-11');
    expect(usfmFromReference('Psalm 103:1-5')).toBe('PSA.103.1-5');
    expect(usfmFromReference('Ephesians 2:8-9')).toBe('EPH.2.8-9');
    expect(usfmFromReference('Esther 4:15-16')).toBe('EST.4.15-16');
  });

  it('accepts an en/em dash and stray whitespace in a range', () => {
    expect(usfmFromReference('Philippians 1:3–11')).toBe('PHP.1.3-11'); // en dash
    expect(usfmFromReference('Psalm 103:1 - 5')).toBe('PSA.103.1-5');
  });

  it('maps a chapter-only reference to the whole chapter (BOOK.CH)', () => {
    expect(usfmFromReference('Psalm 100')).toBe('PSA.100');
    expect(usfmFromReference('Psalms 23')).toBe('PSA.23');
    expect(usfmFromReference('1 Corinthians 13')).toBe('1CO.13');
    expect(usfmFromReference('诗篇 100')).toBe('PSA.100'); // zh, chapter only
  });

  it('accepts "Psalm"/"Psalms" and other common aliases', () => {
    expect(usfmFromReference('Psalms 100:4')).toBe('PSA.100.4');
    expect(usfmFromReference('Psalm 116:1-2')).toBe('PSA.116.1-2');
  });

  it('resolves localized book names shipped in BOOK_NAMES', () => {
    expect(usfmFromReference('Philippiens 4:6')).toBe('PHP.4.6'); // fr
    expect(usfmFromReference('腓立比书 4:6')).toBe('PHP.4.6');       // zh
  });

  it('returns null for an unrecognized book (AI fallback territory)', () => {
    expect(usfmFromReference('Nostrabook 1:1')).toBeNull();
    expect(usfmFromReference('not a reference')).toBeNull();
    expect(usfmFromReference('')).toBeNull();
  });
});

// The version map is the licensed-catalog contract: an id the app's YouVersion
// key can't serve gets a 403 upstream, which the reader shows as "reference
// only" for EVERY non-bundled passage in that language. Guard the shape here so
// a language can't silently drop out of the map again.
describe('versionForLang — licensed version per language', () => {
  it('maps every supported UI language, including Swahili and Amharic', () => {
    const LANGS = ['en', 'fr', 'de', 'es', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'fa', 'id', 'tl', 'sw', 'am'];
    for (const lang of LANGS) {
      expect(versionForLang(lang), `no YouVersion version mapped for "${lang}"`).toBeTruthy();
    }
    expect(Object.keys(LANG_VERSION)).toHaveLength(LANGS.length);
  });

  it('returns null for an unsupported language', () => {
    expect(versionForLang('xx')).toBeNull();
  });
});

describe('versionSupportsUsfm — Russian Psalms numbering guard', () => {
  it('keeps Russian Psalms reference-only (Septuagint chapter numbering)', () => {
    expect(versionSupportsUsfm('ru', 'PSA.23.1')).toBe(false);
    expect(versionSupportsUsfm('ru', 'PSA.100')).toBe(false);
  });

  it('allows everything else', () => {
    expect(versionSupportsUsfm('ru', 'JHN.3.16')).toBe(true);
    expect(versionSupportsUsfm('en', 'PSA.23.1')).toBe(true);
    expect(versionSupportsUsfm('fr', 'PSA.100')).toBe(true);
  });
});
