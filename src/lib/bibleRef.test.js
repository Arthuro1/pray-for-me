// Deterministic reference → USFM mapping. This is the path that lets plan verses,
// faithfulness/movement Psalms, and range references resolve their text WITHOUT
// the fragile, cost-throttled AI round-trip that used to leave the reader stuck on
// "reference only" (no text) for everything outside the offline bundle.
import { describe, it, expect } from 'vitest';
import { usfmFromReference } from './bibleRef';

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

  it('uses the first verse of a range (proxy serves single verses only)', () => {
    expect(usfmFromReference('Psalm 103:1-5')).toBe('PSA.103.1');
    expect(usfmFromReference('Ephesians 2:8-9')).toBe('EPH.2.8');
    expect(usfmFromReference('Esther 4:15-16')).toBe('EST.4.15');
  });

  it('accepts "Psalm"/"Psalms" and other common aliases', () => {
    expect(usfmFromReference('Psalms 100:4')).toBe('PSA.100.4');
    expect(usfmFromReference('Psalm 116:1-2')).toBe('PSA.116.1');
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
