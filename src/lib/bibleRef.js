// Bridges the app's localized verse references (e.g. "Philippiens 4:6",
// "腓立比书 4:6") to what the YouVersion Platform API needs: a numeric version id
// per language and a USFM passage id ("PHP.4.6").
import { anthropicFetch } from './anthropic';
import { BOOK_NAMES } from '../content/dailyVerses';

// Curated YouVersion version ids per UI language. The binding constraint is the
// app's Platform API key: the upstream returns 403 "Access denied for <id>" for
// any version the key isn't licensed to serve — even famous public-domain ones —
// which the reader surfaces as "reference only" for EVERY non-bundled passage in
// that language. So every id below MUST come from the key's own catalog
// (GET /v1/bibles?language_ranges[]=<lang>) and was verified to return text for
// all three passage shapes (verse, range, whole chapter). Every id is also the
// number in its bible.com URL — e.g. bible.com/versions/51-delut-… → 51 — so
// outbound "open in Bible" links stay on the same translation.
export const LANG_VERSION = {
  fr: 93,    // LSG   — Louis Segond 1910
  en: 206,   // WEB   — World English Bible
  de: 51,    // DELUT — Lutherbibel 1912
  es: 147,   // RVES  — Reina-Valera Antigua
  pt: 129,   // NVI   — Nova Versão Internacional
  ru: 143,   // НРП   — Новый русский перевод (New Russian Translation)
  zh: 36,    // CCB   — 当代译本 (Chinese Contemporary Bible, simplified)
  ja: 81,    // 口語訳 — Colloquial Japanese 1955
  ko: 86,    // KLB   — 현대인의 성경 (Korean Living Bible)
  ar: 101,   // NAV   — كتاب الحياة (New Arabic Version)
  hi: 819,   // HHBD  — Hindi Holy Bible
  fa: 1619,  // PCB   — Persian Contemporary Bible 2022
  id: 320,   // TSI   — Terjemahan Sederhana Indonesia (no Psalms upstream —
             //         Psalm passages fall back to reference-only for id)
  tl: 177,   // TLAB  — Ang Biblia
  sw: 1627,  // NEN   — Kiswahili Contemporary Version (Neno)
  am: 1260,  // NASV  — New Amharic Standard Version 2024
};

export function versionForLang(lang) {
  return LANG_VERSION[lang] || null;
}

// The Russian version above numbers the Psalms in the Russian/Septuagint
// tradition — most psalms sit one chapter off the Western numbering the app's
// references use (its PSA.22 is "The LORD is my shepherd", i.e. Western Psalm
// 23), and superscriptions shift verse numbers inside many psalms too. Rather
// than show the wrong psalm as Scripture, Psalms stay reference-only in Russian
// (the offline bundle already excludes them for the same reason).
export function versionSupportsUsfm(lang, usfm) {
  return !(lang === 'ru' && String(usfm).startsWith('PSA.'));
}

// USFM passage ids: 3-char book code, chapter, optional verse, optional range end
// — "1TH.5.17" (verse), "PHP.1.3-11" (range), "PSA.100" (whole chapter).
const USFM_RE = /^[A-Z0-9]{3}\.\d{1,3}(\.\d{1,3}(-\d{1,3})?)?$/;
const cacheKey = (reference) => `usfm:${reference}`;

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

// Deterministically map a reference to a USFM passage id, PRESERVING the passage's
// extent so the reader gets the whole thing rather than just its first verse:
//   "Philippians 1:3-11" → "PHP.1.3-11"  (verse range within a chapter)
//   "Philippians 4:6"    → "PHP.4.6"      (single verse)
//   "Psalm 100"          → "PSA.100"      (whole chapter — no verse given)
// Returns null if the book name isn't recognized. The range and chapter forms are
// exactly what the YouVersion passages endpoint accepts (BOOK.CH.START-END and
// BOOK.CH), so the passage resolves in full instead of collapsing to verse 1.
// Anchored, and tolerant of an en/em dash and surrounding whitespace in the range.
export function usfmFromReference(reference) {
  const m = /^\s*(.+?)\s+(\d{1,3})(?::(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?)?\s*$/.exec(String(reference || ''));
  if (!m) return null;
  const code = bookIndex.get(normalizeBook(m[1]));
  if (!code) return null;
  const [, , chapter, verse, verseEnd] = m;
  if (!verse) return `${code}.${Number(chapter)}`;                                  // whole chapter
  if (verseEnd) return `${code}.${Number(chapter)}.${Number(verse)}-${Number(verseEnd)}`; // range
  return `${code}.${Number(chapter)}.${Number(verse)}`;                             // single verse
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

  let res;
  try {
    res = await anthropicFetch('bible_reference_to_usfm', { reference });
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
