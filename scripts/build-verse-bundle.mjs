// Build authoritative offline text for daily verses and ALL public landing-page
// passages. No Scripture is authored or translated here. See the source/license
// ledger in src/content/verses/README.md before changing an edition.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { POOL, BOOK_NAMES } from '../src/content/dailyVerses.js';
import { LANDING_SCRIPTURE_REFS } from '../src/content/landingScripture.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'src/content/verses');
const BOOK_CODES = ('GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV').split(' ');
const BOOK_NUM = Object.fromEntries(BOOK_CODES.map((book, i) => [book, i + 1]));
const ENGLISH_BOOKS = Object.fromEntries(Object.entries(BOOK_NAMES).map(([code, names]) => [names.en, code]));

const SOURCES = {
  fr: { src: 'bolls', tr: 'FRLSG' },
  en: { src: 'bolls', tr: 'WEB' },
  de: { src: 'bolls', tr: 'LUT' },
  zh: { src: 'getbible', tr: 'cus' },
  ko: { src: 'bolls', tr: 'KRV' },
  ar: { src: 'bolls', tr: 'SVD' },
  fa: { src: 'corrected' },
  hi: { src: 'ebible', tr: 'hin2017' },
  ja: { src: 'corrected' },
  es: { src: 'getbible', tr: 'valera' },
  pt: { src: 'getbible', tr: 'livre' },
  ru: { src: 'getbible', tr: 'synodal', skipDailyPsalms: true },
  tl: { src: 'getbible', tr: 'tagalog' },
  am: { src: 'door43', repo: 'STR/am_ulb' },
  sw: { src: 'door43', repo: 'Door43-Catalog/sw_ulb' },
  id: { src: 'indonesian' },
};

const clean = (s) => String(s || '')
  .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, '')
  .replace(/<[^>]*>/g, '')
  .replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/¶/g, '').replace(/\s+/g, ' ').trim();

async function download(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (attempt === 2) throw new Error(`${url}: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
}

function parseReference(reference) {
  const match = /^(.+?) (\d+)(?::(\d+)(?:-(\d+))?)?$/.exec(reference);
  const book = match && ENGLISH_BOOKS[match[1]];
  if (!book) throw new Error(`Unrecognized curated reference: ${reference}`);
  return { book, chapter: Number(match[2]), start: match[3] && Number(match[3]), end: match[3] && Number(match[4] || match[3]) };
}

const passages = LANDING_SCRIPTURE_REFS.map(parseReference);
const requiredBooks = new Set([...passages.map((p) => p.book), ...POOL.map((p) => p.book)]);
// Continuity alone cannot detect a truncated final verse in an upstream file.
// These are the full chapter lengths in the app's canonical reference system.
const CHAPTER_ENDS = { 'PSA 127': 5, 'PSA 72': 20, 'PSA 67': 7, 'HEB 11': 40, 'PSA 121': 8 };

function parseUsfm(usfm, book, bible) {
  // Footnotes, cross references, headings and word attributes are editorial
  // metadata, not verse wording. Keep poetry/paragraph contents in reading order.
  const content = usfm
    .replace(/\\f\s[\s\S]*?\\f\*/g, '')
    .replace(/\\x\s[\s\S]*?\\x\*/g, '')
    .replace(/\\(?:\+?w)\s+([^|\\]+)(?:\|[^\\]*)?\\(?:\+?w)\*/g, '$1')
    .replace(/^\s*\\(?:s\d*|ms\d*|mr|r|d|sp|cl|cp)\b[^\n]*/gm, '');
  for (const chapterMatch of content.matchAll(/\\c\s+(\d+)\s*([\s\S]*?)(?=\\c\s+\d+|$)/g)) {
    const chapter = Number(chapterMatch[1]);
    for (const verseMatch of chapterMatch[2].matchAll(/\\v\s+(\d+)(?:-(\d+))?\s+([\s\S]*?)(?=\\v\s+\d+|$)/g)) {
      const text = clean(verseMatch[3].replace(/\\[+\w-]+\*?\s?/g, ''));
      const extent = verseMatch[2] ? `${Number(verseMatch[1])}-${Number(verseMatch[2])}` : Number(verseMatch[1]);
      if (text) bible.set(`${book} ${chapter}:${extent}`, text);
    }
  }
}

async function loadBible({ src, tr, repo }, lang) {
  if (src === 'ebible') {
    const { loadEbibleUsfmBible } = await import('./verse-source-indonesian.mjs');
    return loadEbibleUsfmBible(tr);
  }
  if (src === 'indonesian') {
    const { loadIndonesianBible } = await import('./verse-source-indonesian.mjs');
    return loadIndonesianBible();
  }
  if (src === 'corrected') {
    const { loadCorrectedBible } = await import('./verse-source-corrections.mjs');
    return loadCorrectedBible(lang);
  }
  const bible = new Map();
  if (src === 'door43') {
    const books = [...requiredBooks];
    // A small bounded worker pool keeps requests modest for the source host.
    await Promise.all(Array.from({ length: 3 }, async () => {
      while (books.length) {
        const book = books.shift();
        const number = BOOK_NUM[book] + (BOOK_NUM[book] >= 40 ? 1 : 0);
        const url = `https://git.door43.org/${repo}/raw/branch/master/${String(number).padStart(2, '0')}-${book}.usfm`;
        parseUsfm(await download(url), book, bible);
      }
    }));
    return bible;
  }
  // Download each edition once rather than making hundreds of chapter requests.
  const url = src === 'bolls'
    ? `https://bolls.life/static/translations/${tr}.json`
    : `https://api.getbible.net/v2/${tr}.json`;
  const data = JSON.parse(await download(url));
  if (src === 'bolls') {
    for (const verse of data) bible.set(`${BOOK_CODES[verse.book - 1]} ${verse.chapter}:${verse.verse}`, clean(verse.text));
  } else {
    for (const book of data.books) {
      for (const chapter of book.chapters) {
        for (const verse of chapter.verses) bible.set(`${BOOK_CODES[book.nr - 1]} ${chapter.chapter}:${verse.verse}`, clean(verse.text));
      }
    }
  }
  return bible;
}

function normalizeBridges(lang, bible) {
  // These are combined verses in the source editions, not missing wording.
  // Keep their extent explicit; never duplicate or invent a component verse.
  for (const [book, chapter, start, end] of lang === 'zh' ? [['EPH', 6, 2, 3]] : lang === 'ar' ? [['PSA', 72, 19, 20]] : []) {
    const key = `${book} ${chapter}:${start}`;
    const text = bible.get(key);
    if (!text) throw new Error(`Missing source verse bridge ${lang}: ${key}`);
    const following = bible.get(`${book} ${chapter}:${end}`);
    if (lang === 'ar' ? following : following !== 'a') {
      throw new Error(`Source verse bridge changed ${lang}: ${key}`);
    }
    bible.delete(key);
    for (let verse = start + 1; verse <= end; verse++) bible.delete(`${book} ${chapter}:${verse}`);
    bible.set(`${key}-${end}`, text);
  }
}

// App citations use English/WEB numbering. These edition-specific offsets come
// from comparing the source chapters, including their numbered superscriptions.
const FRENCH_PSALM_OFFSETS = new Set([34, 46, 62, 67, 85]);
function sourceCoordinate(lang, book, chapter, verse) {
  if (book !== 'PSA') return { chapter, verse };
  if (lang === 'fr' && FRENCH_PSALM_OFFSETS.has(chapter)) return { chapter, verse: verse + 1 };
  if (lang === 'ru') {
    // Only this explicitly checked landing-page set is normalized; do not
    // generalize this to all Synodal Psalms (the numbering is not uniform).
    const chapters = { 1: 1, 34: 33, 46: 45, 62: 61, 67: 66, 72: 71, 78: 77,
      82: 81, 85: 84, 103: 102, 119: 118, 121: 120, 127: 126, 141: 140,
      145: 144, 146: 145 };
    if (!chapters[chapter]) throw new Error(`Unchecked Russian Psalm ${chapter}`);
    return { chapter: chapters[chapter], verse: verse + (FRENCH_PSALM_OFFSETS.has(chapter) ? 1 : 0) };
  }
  return { chapter, verse };
}

function chapterEntries(bible, book, chapter) {
  const prefix = `${book} ${chapter}:`;
  return [...bible.entries()].filter(([key, text]) => key.startsWith(prefix) && text)
    .map(([key, text]) => {
      const [start, end = start] = key.slice(prefix.length).split('-').map(Number);
      return [start, end, text];
    }).filter(([verse]) => verse > 0)
    .sort((a, b) => a[0] - b[0]);
}

async function buildLanguage(lang, source) {
  const bible = await loadBible(source, lang);
  normalizeBridges(lang, bible);
  const previousFile = join(OUT_DIR, `${lang}.json`);
  // Preserve existing daily-verse wording while adding the public passages.
  const out = existsSync(previousFile) && !['zh', 'fa', 'ja', 'hi'].includes(lang) ? JSON.parse(readFileSync(previousFile, 'utf8')) : {};
  for (const { book, cv } of POOL) {
    if (book === 'PSA' && source.skipDailyPsalms) continue;
    const key = `${book} ${cv}`;
    if (!out[key] && bible.get(key)) out[key] = bible.get(key);
  }
  for (const { book, chapter, start, end } of passages) {
    if (!start) {
      const coordinate = sourceCoordinate(lang, book, chapter, 1);
      const entries = chapterEntries(bible, book, coordinate.chapter);
      let next = 1;
      for (const [start, end] of entries) {
        if (start !== next) throw new Error(`${lang}: incomplete chapter ${book} ${chapter} at ${next}`);
        next = end + 1;
      }
      if (!entries.length) throw new Error(`${lang}: empty chapter ${book} ${chapter}`);
      if (next - coordinate.verse !== CHAPTER_ENDS[`${book} ${chapter}`]) {
        throw new Error(`${lang}: wrong final verse for ${book} ${chapter}`);
      }
      // Drop a separately numbered superscription when the edition counts it.
      const full = entries.filter(([verse]) => verse >= coordinate.verse);
      out[`${book} ${chapter}`] = full.map(([, , text]) => text).join(' ');
      for (const [start, end, text] of full) {
        const extent = start === end ? start - coordinate.verse + 1 : `${start - coordinate.verse + 1}-${end - coordinate.verse + 1}`;
        out[`${book} ${chapter}:${extent}`] = text;
      }
    } else {
      const parts = [];
      for (let verse = start; verse <= end; verse++) {
        const coordinate = sourceCoordinate(lang, book, chapter, verse);
        let text = bible.get(`${book} ${coordinate.chapter}:${coordinate.verse}`);
        let bridgeEnd = verse;
        if (!text) {
          const bridge = chapterEntries(bible, book, coordinate.chapter).find(([first, last]) => first === coordinate.verse && last <= sourceCoordinate(lang, book, chapter, end).verse);
          if (bridge) { text = bridge[2]; bridgeEnd = verse + bridge[1] - bridge[0]; }
        }
        if (!text) throw new Error(`${lang}: missing ${book} ${chapter}:${verse}`);
        const extent = bridgeEnd === verse ? verse : `${verse}-${bridgeEnd}`;
        out[`${book} ${chapter}:${extent}`] = text;
        parts.push(text);
        verse = bridgeEnd;
      }
      if (end > start) out[`${book} ${chapter}:${start}-${end}`] = parts.join(' ');
    }
  }
  console.log(`${lang}: ${passages.length}/${passages.length} landing passages, ${Object.keys(out).length} bundled entries`);
  return out;
}

async function build() {
  const requested = process.argv.find((arg) => arg.startsWith('--langs='))?.slice(8).split(',');
  const outputs = [];
  for (const [lang, source] of Object.entries(SOURCES)) {
    if (requested && !requested.includes(lang)) continue;
    outputs.push([lang, await buildLanguage(lang, source)]);
  }
  // A failed download or incomplete passage must never overwrite a good bundle.
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [lang, out] of outputs) writeFileSync(join(OUT_DIR, `${lang}.json`), `${JSON.stringify(out)}\n`);
  console.log(`Wrote ${outputs.length} language bundles.`);
}

build().catch((error) => { console.error(error.message); process.exitCode = 1; });
