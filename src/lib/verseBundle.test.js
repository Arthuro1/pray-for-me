import { describe, it, expect } from 'vitest';
import { getBundledVerse } from './verseBundle';

// These run against the REAL generated bundle in src/content/verses/*.json, so they
// also guard full-passage coverage and safe edition-specific Psalm mappings.
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

  it('returns every verse in a bundled range in order', async () => {
    const hit = await getBundledVerse({ reference: 'Philippiens 4:6-7', lang: 'fr' });
    const first = await getBundledVerse({ reference: 'Philippiens 4:6', lang: 'fr' });
    const last = await getBundledVerse({ reference: 'Philippiens 4:7', lang: 'fr' });
    expect(hit?.text).toBe(`${first.text} ${last.text}`);
  });

  it('resolves long ranges but does not mistake sparse verses for a full chapter', async () => {
    const range = await getBundledVerse({ reference: 'Philippians 1:3-11', lang: 'en', usfm: 'PHP.1.3-11' });
    expect(range?.text).toMatch(/thank my God/i);
    expect(range?.text).toMatch(/fruits of righteousness/i);
    expect(await getBundledVerse({ reference: 'Psalm 100', lang: 'en', usfm: 'PSA.100' })).toBeNull();
    const chapter = await getBundledVerse({ reference: 'Hebrews 11', lang: 'en', usfm: 'HEB.11' });
    expect(chapter?.text).toMatch(/faith is assurance/i);
    expect(chapter?.text).toMatch(/apart from us/i);
  });

  it('rejects incomplete ranges instead of showing only the available verses', async () => {
    expect(await getBundledVerse({ reference: 'Philippians 1:1-11', lang: 'en' })).toBeNull();
    expect(await getBundledVerse({ reference: 'Psalm 141:1-3', lang: 'de' })).toBeNull();
  });

  it('preserves edition verse bridges without inventing an individual verse', async () => {
    expect(await getBundledVerse({ reference: 'Ephesians 6:3', lang: 'zh' })).toBeNull();
    const bridge = await getBundledVerse({ reference: 'Ephesians 6:2-3', lang: 'zh' });
    const passage = await getBundledVerse({ reference: 'Ephesians 6:1-4', lang: 'zh' });
    expect(bridge?.text).toContain('孝敬');
    expect(passage?.text).toContain(bridge.text);
    expect(passage?.text).not.toMatch(/并于|上节/);
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

  it('serves explicitly mapped Russian Psalms with the intended wording', async () => {
    const incense = await getBundledVerse({ reference: 'Psalm 141:2', lang: 'ru' });
    expect(incense?.text).toMatch(/молитва.*фимиам/i);
    const still = await getBundledVerse({ reference: 'Psalm 46:10', lang: 'ru' });
    expect(still?.text).toMatch(/Остановитесь/);
  });

  it('accounts for French Psalm superscriptions', async () => {
    expect((await getBundledVerse({ reference: 'Psaume 46:10', lang: 'fr' }))?.text).toMatch(/Arrêtez/i);
    expect((await getBundledVerse({ reference: 'Psaume 62:8', lang: 'fr' }))?.text).toMatch(/confiez-vous/i);
  });

  it('serves newly bundled Indonesian passages', async () => {
    const hit = await getBundledVerse({ reference: 'Filipi 4:6', lang: 'id' });
    expect(hit?.source).toBe('bundle');
    expect(hit?.text).toMatch(/khawatir/i);
  });

  it('returns null for unknown languages and malformed passage extents', async () => {
    expect(await getBundledVerse({ reference: 'Philippians 4:6', lang: 'unknown' })).toBeNull();
    for (const usfm of ['PHP.0.6', 'PHP.4.0', 'PHP.4.7-6', 'PHP.4.1-9999']) {
      expect(await getBundledVerse({ reference: 'Philippians 4:6', lang: 'en', usfm })).toBeNull();
    }
  });
});
