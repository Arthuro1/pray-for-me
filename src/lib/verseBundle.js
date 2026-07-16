// Offline, pre-bundled authoritative verse text for the curated daily-verse pool.
//
// This is the FIRST source the reader consults (see verseText.js). It needs NO
// network, NO AI reference→USFM step, and NO YouVersion call, so curated verses
// render instantly, work offline, cost nothing, and can never be misquoted. It's
// what makes the accordion stop falling back to "reference only" for pool verses.
//
// The text lives in src/content/verses/<lang>.json, generated at dev time by
// scripts/build-verse-bundle.mjs from clean public-domain editions. Each file is
// keyed by the neutral "<BOOK> <chapter:verse>" id (e.g. "PHP 4:6"). We resolve an
// incoming reference to that key deterministically — either from a USFM id the
// caller already knows, or by reverse-mapping the localized book name through
// BOOK_NAMES (the very table that rendered the reference), so no model is involved.
import { BOOK_NAMES } from '../content/dailyVerses';

// Lazy, memoized per-language import. A language with no bundle (e.g. id, or a
// reference outside the pool) resolves to null so the caller falls through to the
// runtime pipeline. `import.meta.glob` gives Vite a static view of the directory
// so each language becomes its own on-demand chunk.
const loaders = import.meta.glob('../content/verses/*.json');
const cache = new Map();
async function loadLang(lang) {
  if (cache.has(lang)) return cache.get(lang);
  const loader = loaders[`../content/verses/${lang}.json`];
  let data = null;
  if (loader) {
    try {
      data = (await loader()).default;
    } catch {
      data = null;
    }
  }
  cache.set(lang, data);
  return data;
}

// Reverse index (localized book name → USFM code) per language, built once from
// BOOK_NAMES. English names are included as a fallback because localizedRef() in
// dailyVerses.js falls back to the English book name when a language is missing one.
const reverse = new Map();
function bookCode(lang, name) {
  let idx = reverse.get(lang);
  if (!idx) {
    idx = new Map();
    for (const [code, names] of Object.entries(BOOK_NAMES)) {
      if (names.en && !idx.has(names.en)) idx.set(names.en, code);
    }
    // Language-specific names take priority over the English fallback.
    for (const [code, names] of Object.entries(BOOK_NAMES)) {
      if (names[lang]) idx.set(names[lang], code);
    }
    reverse.set(lang, idx);
  }
  return idx.get(name) || null;
}

// "PHP.4.6" → "PHP 4:6". Returns null for anything that isn't a single verse id —
// a whole chapter ("PSA.100") or a range ("PHP.1.3-11") deliberately does NOT map,
// so it falls through to the runtime path that returns the full passage rather than
// the bundle serving only one verse.
function keyFromUsfm(usfm) {
  const p = String(usfm).split('.');
  if (p.length !== 3 || !/^\d+$/.test(p[2])) return null;
  return `${p[0]} ${Number(p[1])}:${Number(p[2])}`;
}

// "Philippiens 4:6" → "PHP 4:6". Anchored to a single verse: a range (e.g. "4:6-7")
// deliberately does NOT match, so ranges fall through to the runtime path that can
// return the whole passage rather than us serving only the first verse. (\s already
// covers the non-breaking space some locales place before the numbers.)
function keyFromReference(reference, lang) {
  const m = /^(.*?)\s+(\d+):(\d+)\s*$/.exec(String(reference).trim());
  if (!m) return null;
  const code = bookCode(lang, m[1].trim());
  return code ? `${code} ${m[2]}:${m[3]}` : null;
}

// Resolve a reference to pre-bundled authoritative text, or null if it isn't in the
// offline bundle. Prefers a known USFM id (callers like the daily verse pass one),
// else reverse-maps the localized reference. Returns the same { text, ref, source }
// shape as the other authoritative sources in verseText.js.
export async function getBundledVerse({ reference, lang, usfm }) {
  const key = (usfm && keyFromUsfm(usfm)) || (reference && keyFromReference(reference, lang));
  if (!key) return null;
  const data = await loadLang(lang);
  const text = data && data[key];
  return text ? { text, ref: reference || key, source: 'bundle' } : null;
}
