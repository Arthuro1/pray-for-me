// Bridges the app's localized verse references (e.g. "Philippiens 4:6",
// "腓立比书 4:6") to what the YouVersion Platform API needs: a numeric version id
// per language and a USFM passage id ("PHP.4.6").
import { anthropicFetch } from './anthropic';

// Curated YouVersion version ids per UI language. We pick public-domain /
// openly-licensed translations so the Platform API reliably returns full text.
// Verified ids: 93 = Louis Segond 1910 (French), 206 = World English Bible.
// Discover more via GET /v1/bibles?language_ranges[]=<bcp47>; any language not
// mapped here simply falls back to the AI text path in verseText.js.
export const LANG_VERSION = {
  fr: 93,   // LSG — La Sainte Bible par Louis Segond 1910 (public domain)
  en: 206,  // WEB — World English Bible (public domain)
};

export function versionForLang(lang) {
  return LANG_VERSION[lang] || null;
}

// USFM passage ids: 3-char book code, chapter, optional verse — "1TH.5.17".
const USFM_RE = /^[A-Z0-9]{3}\.\d{1,3}(\.\d{1,3})?$/;
const cacheKey = (reference) => `usfm:${reference}`;

const MODEL = 'claude-haiku-4-5-20251001';

// Convert a (possibly localized) reference into a USFM passage id. This is a
// deterministic citation transform, NOT scripture generation — the authoritative
// verse text still comes from YouVersion; the model only maps the reference.
// Cached permanently per reference string. Uses anthropicFetch directly (not the
// cooldown-throttled callClaudeForJson) so it never blocks the AI text fallback
// that may run on the same tap.
export async function referenceToUsfm(reference) {
  if (!reference) return null;
  try {
    const cached = localStorage.getItem(cacheKey(reference));
    if (cached) return cached;
  } catch {
    // localStorage unavailable — just resolve fresh.
  }

  const prompt = `Convert this Bible reference to a USFM passage id of the form BOOK.CHAPTER.VERSE, using the standard 3-letter USFM book code (Genesis=GEN, Psalms=PSA, Matthew=MAT, John=JHN, Philippians=PHP, 1 Thessalonians=1TH, James=JAS). The reference may be written in any language. For a verse range, use the first verse. Reference: "${reference}". Respond ONLY with JSON: {"usfm":"<CODE.CH.V>"}`;

  let res;
  try {
    res = await anthropicFetch({ model: MODEL, max_tokens: 60, messages: [{ role: 'user', content: prompt }] });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const body = await res.json().catch(() => null);
  const text = body?.content?.[0]?.text || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let usfm;
  try {
    usfm = JSON.parse(match[0]).usfm;
  } catch {
    return null;
  }
  usfm = (usfm || '').trim().toUpperCase();
  if (!USFM_RE.test(usfm)) return null;

  try {
    localStorage.setItem(cacheKey(reference), usfm);
  } catch {
    // best-effort cache only
  }
  return usfm;
}
