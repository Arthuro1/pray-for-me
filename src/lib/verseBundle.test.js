import { describe, it, expect } from 'vitest';
import { getBundledVerse } from './verseBundle';

// These run against the REAL generated bundle in src/content/verses/*.json, so they
// also guard the build output (e.g. that ru Psalms were correctly excluded).
describe('getBundledVerse — offline curated verse text', () => {
  it('resolves a pool verse from a localized reference (no AI, no network)', async () => {
    const hit = await getBundledVerse({ reference: 'Philippiens 4:6', lang: 'fr' });
    expect(hit?.source).toBe('bundle');
    expect(hit?.text).toMatch(/inquiétez/i);
  });

  it('resolves from a known USFM id too', async () => {
    const hit = await getBundledVerse({ reference: 'Philippians 4:6', lang: 'en', usfm: 'PHP.4.6' });
    expect(hit?.text).toMatch(/anxious/i);
  });

  it('returns null for a reference outside the curated pool', async () => {
    // John 3:16 is not one of the pool's John verses, so it must fall through.
    const hit = await getBundledVerse({ reference: 'Jean 3:16', lang: 'fr' });
    expect(hit).toBeNull();
  });

  it('does not match verse ranges (they need the full-passage runtime path)', async () => {
    const hit = await getBundledVerse({ reference: 'Philippiens 4:6-7', lang: 'fr' });
    expect(hit).toBeNull();
  });

  it('does not match a range or whole-chapter USFM id (full-passage runtime path)', async () => {
    // Even when the caller supplies a USFM id, a range/chapter must fall through so
    // the reader gets the full passage instead of one bundled verse.
    expect(await getBundledVerse({ reference: 'Philippians 1:3-11', lang: 'en', usfm: 'PHP.1.3-11' })).toBeNull();
    expect(await getBundledVerse({ reference: 'Psalm 100', lang: 'en', usfm: 'PSA.100' })).toBeNull();
  });

  it('excludes Russian Psalms (Synodal uses Septuagint numbering — unsafe)', async () => {
    // Must fall through rather than serve a wrongly-numbered verse.
    const hit = await getBundledVerse({ reference: 'Псалтирь 23:1', lang: 'ru' });
    expect(hit).toBeNull();
  });

  it('still serves a non-Psalm Russian verse', async () => {
    const hit = await getBundledVerse({ reference: 'Притчи 3:5', lang: 'ru' });
    expect(hit?.source).toBe('bundle');
  });

  it('returns null for a language with no bundle', async () => {
    const hit = await getBundledVerse({ reference: 'Filipi 4:6', lang: 'id' });
    expect(hit).toBeNull();
  });
});
