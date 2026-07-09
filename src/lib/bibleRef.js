// Bridges the app's localized verse references (e.g. "Philippiens 4:6",
// "腓立比书 4:6") to what the YouVersion Platform API needs: a numeric version id
// per language and a USFM passage id ("PHP.4.6").
import { anthropicFetch } from './anthropic';
import { BOOK_NAMES } from '../content/dailyVerses';

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

const MODEL = 'claude-haiku-4-5-20251001';

// Canonical English book name → USFM code, for every book of the Protestant
// canon. This lets us map the app's own references (plan days, faithfulness and
// ACTS-movement Psalms, user-typed refs) to USFM WITHOUT an AI round-trip — the
// same deterministic, offline, un-throttled path the offline bundle already uses.
// Book-name→code is a low-stakes citation transform, not Scripture wording.
const ENGLISH_BOOKS = {
  GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers', DEU: 'Deuteronomy',
  JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth', '1SA': '1 Samuel', '2SA': '2 Samuel',
  '1KI': '1 Kings', '2KI': '2 Kings', '1CH': '1 Chronicles', '2CH': '2 Chronicles',
  EZR: 'Ezra', NEH: 'Nehemiah', EST: 'Esther', JOB: 'Job', PSA: 'Psalms', PRO: 'Proverbs',
  ECC: 'Ecclesiastes', SNG: 'Song of Songs', ISA: 'Isaiah', JER: 'Jeremiah', LAM: 'Lamentations',
  EZK: 'Ezekiel', DAN: 'Daniel', HOS: 'Hosea', JOL: 'Joel', AMO: 'Amos', OBA: 'Obadiah',
  JON: 'Jonah', MIC: 'Micah', NAM: 'Nahum', HAB: 'Habakkuk', ZEP: 'Zephaniah', HAG: 'Haggai',
  ZEC: 'Zechariah', MAL: 'Malachi', MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke', JHN: 'John',
  ACT: 'Acts', ROM: 'Romans', '1CO': '1 Corinthians', '2CO': '2 Corinthians', GAL: 'Galatians',
  EPH: 'Ephesians', PHP: 'Philippians', COL: 'Colossians', '1TH': '1 Thessalonians',
  '2TH': '2 Thessalonians', '1TI': '1 Timothy', '2TI': '2 Timothy', TIT: 'Titus', PHM: 'Philemon',
  HEB: 'Hebrews', JAS: 'James', '1PE': '1 Peter', '2PE': '2 Peter', '1JN': '1 John',
  '2JN': '2 John', '3JN': '3 John', JUD: 'Jude', REV: 'Revelation',
};

// A few common alternate spellings that appear in real references.
const BOOK_ALIASES = {
  Psalm: 'PSA', 'Song of Solomon': 'SNG', Songs: 'SNG', Canticles: 'SNG',
  Revelations: 'REV', Philemon: 'PHM',
};

// Normalize a book name for lookup: trim, collapse whitespace, lower-case (a
// no-op for non-Latin scripts, but folds case for Latin-script languages).
const normalizeBook = (s) => String(s).trim().replace(/\s+/g, ' ').toLowerCase();

// Reverse index (normalized book name → USFM code), built once from the English
// canon, common aliases, and every localized name the app already ships in
// BOOK_NAMES — so a reference written in any supported language resolves locally.
const bookIndex = (() => {
  const idx = new Map();
  for (const [code, name] of Object.entries(ENGLISH_BOOKS)) idx.set(normalizeBook(name), code);
  for (const [name, code] of Object.entries(BOOK_ALIASES)) idx.set(normalizeBook(name), code);
  for (const [code, names] of Object.entries(BOOK_NAMES)) {
    for (const name of Object.values(names)) {
      if (name && !idx.has(normalizeBook(name))) idx.set(normalizeBook(name), code);
    }
  }
  return idx;
})();

// Deterministically map "<Book> <chapter>:<verse>" (with optional range) to a USFM
// passage id, or null if the book name isn't recognized. Uses the first verse of a
// range, matching the AI fallback (the proxy serves single verses only). Anchored
// so a trailing range like "1-5" is accepted but only its start verse is used.
export function usfmFromReference(reference) {
  const m = /^\s*(.+?)\s+(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*\d{1,3})?\s*$/.exec(String(reference || ''));
  if (!m) return null;
  const code = bookIndex.get(normalizeBook(m[1]));
  return code ? `${code}.${Number(m[2])}.${Number(m[3])}` : null;
}

// Convert a (possibly localized) reference into a USFM passage id. This is a
// deterministic citation transform, NOT scripture generation — the authoritative
// verse text still comes from YouVersion; only the reference is mapped. We resolve
// it locally first (offline, free, un-throttled) and only fall back to an AI call
// for a book name we don't recognize. Cached permanently per reference string.
// Uses anthropicFetch directly (not the cooldown-throttled callClaudeForJson) so
// it never blocks the AI text fallback that may run on the same tap.
export async function referenceToUsfm(reference) {
  if (!reference) return null;
  try {
    const cached = localStorage.getItem(cacheKey(reference));
    if (cached) return cached;
  } catch {
    // localStorage unavailable — just resolve fresh.
  }

  // Deterministic path: covers every reference the app itself generates (plan
  // verses, faithfulness/movement Psalms) plus user refs in a supported language.
  const local = usfmFromReference(reference);
  if (local) {
    try { localStorage.setItem(cacheKey(reference), local); } catch { /* best-effort */ }
    return local;
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
