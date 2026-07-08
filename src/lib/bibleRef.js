// Bridges the app's localized verse references (e.g. "Philippiens 4:6",
// "腓立比书 4:6") to what the YouVersion Platform API needs: a numeric version id
// per language and a USFM passage id ("PHP.4.6").
import { aiFetch, extractText, AI_MODEL } from './aiClient';

// Curated YouVersion version ids per UI language. Each is a public-domain (or
// copyright-expired, freely served) translation, so the Platform API reliably
// returns full text. Every id is the number in its bible.com URL —
// e.g. bible.com/versions/51-delut-… → 51. Languages with no trustworthy
// public-domain edition on YouVersion (Swahili, Amharic) are intentionally left
// out and fall back to the AI text path in verseText.js.
export const LANG_VERSION = {
  fr: 93,    // LSG    — Louis Segond 1910
  en: 206,   // WEB    — World English Bible
  de: 51,    // DELUT  — Lutherbibel 1912
  es: 147,   // RVES   — Reina-Valera Antigua
  pt: 215,   // ARC    — Almeida Revista e Corrigida
  ru: 167,   // СИНОД  — Синодальный перевод (Synodal)
  zh: 48,    // CUNPSS — 新标点和合本, 神版 (Chinese Union, simplified)
  ja: 1820,  // 口語訳 — Colloquial Japanese 1955
  ko: 88,    // KRV    — 개역한글 (Korean Revised)
  ar: 13,    // AVD    — الكتاب المقدس، فان دايك (Smith & Van Dyke)
  hi: 819,   // HHBD   — Hindi Holy Bible
  fa: 136,   // POV    — Persian Old Version (Tarjumeh-ye Qadim)
  id: 2861,  // LAI-TL — Alkitab Terjemahan Lama
  tl: 2196,  // ABTAG  — Ang Biblia (1905/1982)
};

export function versionForLang(lang) {
  return LANG_VERSION[lang] || null;
}

// USFM passage ids: 3-char book code, chapter, optional verse — "1TH.5.17".
const USFM_RE = /^[A-Z0-9]{3}\.\d{1,3}(\.\d{1,3})?$/;
const cacheKey = (reference) => `usfm:${reference}`;

const MODEL = AI_MODEL;

// Convert a (possibly localized) reference into a USFM passage id. This is a
// deterministic citation transform, NOT scripture generation — the authoritative
// verse text still comes from YouVersion; the model only maps the reference.
// Cached permanently per reference string. Uses aiFetch directly (not the
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
    res = await aiFetch({ model: MODEL, max_tokens: 60, messages: [{ role: 'user', content: prompt }] });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const body = await res.json().catch(() => null);
  const text = extractText(body);
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
