// Build the OFFLINE verse-text bundle for the curated daily-verse pool.
//
// WHY: the in-app reader used to resolve every verse at runtime through a fragile
// chain (AI reference→USFM conversion → YouVersion round-trip → session auth). Any
// weak link made the accordion silently fall back to "reference only". Since the
// pool is a FIXED, curated set of references, we can resolve their text ONCE here,
// at build time, from clean public-domain sources and ship it as static JSON. The
// reader then reads Scripture instantly, offline, at zero recurring cost, and can
// never misquote (the text is authoritative and immutable).
//
// SOURCES — public-domain editions only, from redistribution-friendly JSON APIs
// (NOT the YouVersion Platform API, whose terms forbid caching its responses):
//   • bolls.life        — https://bolls.life/get-chapter/{TR}/{book}/{chapter}/
//   • getbible.net v2   — https://api.getbible.net/v2/{tr}/{book}/{chapter}.json
// Each chosen edition is public domain (copyright-expired) and, where possible, the
// SAME edition the app already curated per language (see src/lib/bibleRef.js).
//
// OUTPUT: one file per language at src/content/verses/<lang>.json, keyed by the
// neutral "<BOOK> <chapter:verse>" id (e.g. "PHP 4:6") — the same key shape the
// SEED map in dailyVerses.js already uses — mapping to the verse text.
//
// Run with:  node scripts/build-verse-bundle.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { POOL } from '../src/content/dailyVerses.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'content', 'verses');

// USFM 3-letter book code → canonical 1–66 book number (the numbering both APIs
// use). Only the books the pool references need to be present.
const BOOK_NUM = {
  GEN: 1, EXO: 2, LEV: 3, NUM: 4, DEU: 5, JOS: 6, JDG: 7, RUT: 8, '1SA': 9, '2SA': 10,
  '1KI': 11, '2KI': 12, '1CH': 13, '2CH': 14, EZR: 15, NEH: 16, EST: 17, JOB: 18, PSA: 19,
  PRO: 20, ECC: 21, SNG: 22, ISA: 23, JER: 24, LAM: 25, EZK: 26, DAN: 27, HOS: 28, JOL: 29,
  AMO: 30, OBA: 31, JON: 32, MIC: 33, NAM: 34, HAB: 35, ZEP: 36, HAG: 37, ZEC: 38, MAL: 39,
  MAT: 40, MRK: 41, LUK: 42, JHN: 43, ACT: 44, ROM: 45, '1CO': 46, '2CO': 47, GAL: 48,
  EPH: 49, PHP: 50, COL: 51, '1TH': 52, '2TH': 53, '1TI': 54, '2TI': 55, TIT: 56, PHM: 57,
  HEB: 58, JAS: 59, '1PE': 60, '2PE': 61, '1JN': 62, '2JN': 63, '3JN': 64, JUD: 65, REV: 66,
};

// Per-language source + public-domain edition. `src` selects the fetcher; `tr` is
// that source's translation code. `skipBooks` excludes books whose versification in
// that edition does NOT match the pool's (Masoretic) references — shipping those
// would misquote (wrong verse under the right reference), which is the one thing
// this feature must never do; excluded books fall back to the runtime path.
//
// Omitted languages: Indonesian (id), Amharic (am), Swahili (sw) — no complete
// public-domain edition is available from a clean source, so they keep using the
// runtime fallback (no regression: the runtime path never had them anyway).
const SOURCES = {
  fr: { src: 'bolls',    tr: 'FRLSG',    name: 'Louis Segond 1910' },
  en: { src: 'bolls',    tr: 'WEB',      name: 'World English Bible' },
  de: { src: 'bolls',    tr: 'LUT',      name: 'Luther 1912' },
  zh: { src: 'bolls',    tr: 'CUNPS',    name: 'Chinese Union (Simplified) 1988' },
  ko: { src: 'bolls',    tr: 'KRV',      name: '개역한글 (Korean Revised)' },
  ar: { src: 'bolls',    tr: 'SVD',      name: 'Smith & Van Dyke' },
  fa: { src: 'bolls',    tr: 'POV',      name: 'Persian Old Version' },
  hi: { src: 'bolls',    tr: 'HIOV',     name: 'Hindi Old Version' },
  ja: { src: 'getbible', tr: 'japkougo', name: 'Japanese Kougo-yaku 1954/55' },
  es: { src: 'getbible', tr: 'valera',   name: 'Reina Valera 1909' },
  pt: { src: 'getbible', tr: 'livre',    name: 'Bíblia Livre' },
  // Synodal numbers the Psalms by the Septuagint (Masoretic 51 = Synodal 50), so
  // Psalm references would resolve to the WRONG verse — exclude the whole book.
  // Every other Synodal book uses Masoretic numbering (verified) and is safe.
  ru: { src: 'getbible', tr: 'synodal',  name: 'Synodal 1876', skipBooks: ['PSA'] },
  tl: { src: 'getbible', tr: 'tagalog',  name: 'Ang Dating Biblia 1905' },
};

// Normalize verse text from either source: drop any markup (footnote/Strong's/ruby
// tags), collapse whitespace, drop pilcrows, trim.
const clean = (s) => (s || '')
  .replace(/<[^>]*>/g, '')
  .replace(/¶/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fetch one chapter as a { verseNumber: text } map, memoized per (source, tr,
// book, chapter). Retries a couple times so a transient blip doesn't leave a hole.
const chapterCache = new Map();
async function fetchChapter(src, tr, bookNum, chapter) {
  const key = `${src}:${tr}:${bookNum}:${chapter}`;
  if (chapterCache.has(key)) return chapterCache.get(key);

  const url = src === 'bolls'
    ? `https://bolls.life/get-chapter/${tr}/${bookNum}/${chapter}/`
    : `https://api.getbible.net/v2/${tr}/${bookNum}/${chapter}.json`;

  let verses = null;
  for (let attempt = 0; attempt < 3 && !verses; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) { await sleep(500); continue; }
      const body = await res.json();
      const list = src === 'bolls' ? body : body.verses;
      const map = {};
      for (const v of list) map[v.verse] = clean(v.text);
      verses = map;
    } catch {
      await sleep(500);
    }
  }
  chapterCache.set(key, verses || {});
  await sleep(src === 'bolls' ? 120 : 60); // be polite: throttle only real fetches
  return verses || {};
}

async function build() {
  mkdirSync(OUT_DIR, { recursive: true });
  const summary = [];

  for (const [lang, { src, tr, name, skipBooks = [] }] of Object.entries(SOURCES)) {
    const out = {};
    let missing = 0;
    const misses = [];

    for (const { book, cv } of POOL) {
      if (skipBooks.includes(book)) continue; // intentionally excluded (versification)
      const bookNum = BOOK_NUM[book];
      const [chapter, verse] = cv.split(':').map(Number);
      if (!bookNum) { missing++; misses.push(`${book} ${cv}`); continue; }

      const chap = await fetchChapter(src, tr, bookNum, chapter);
      const text = chap[verse];
      if (text) {
        out[`${book} ${cv}`] = text;
      } else {
        missing++;
        misses.push(`${book} ${cv}`);
      }
    }

    writeFileSync(join(OUT_DIR, `${lang}.json`), JSON.stringify(out, null, 0) + '\n');
    const covered = Object.keys(out).length;
    const skipped = POOL.length - covered - missing;
    summary.push({ lang, name, covered, total: POOL.length, misses });
    console.log(`${lang}  (${name})  ${covered}/${POOL.length} verses`
      + (skipped ? `  (${skipped} excluded by versification)` : '')
      + (missing ? `  — ${missing} missing` : (skipped ? '' : '  ✓')));
    if (misses.length) console.log('     missing:', misses.join(', '));
  }

  console.log('\nWrote', Object.keys(SOURCES).length, 'language files to src/content/verses/');
  const weak = summary.filter((s) => s.covered / s.total < 0.9);
  if (weak.length) console.log('LOW COVERAGE:', weak.map((s) => `${s.lang} ${s.covered}/${s.total}`).join(', '));
}

build();
