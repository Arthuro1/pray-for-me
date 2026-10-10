// Complete, authoritative copies of the same public-domain editions used by
// the offline bundle. The earlier API copies had missing verses/chapters and
// duplicated final verses. These readers only parse publisher-supplied text;
// they never compose, translate, or repair Scripture wording.
import { loadEbibleUsfmBible } from './verse-source-indonesian.mjs';

export const CORRECTED_SOURCES = Object.freeze({
  fa: {
    name: 'Persian Old Version 1895',
    sourceUrl: 'https://ebible.org/pesOPV/',
    archiveUrl: 'https://ebible.org/Scriptures/pesOPV_usfm.zip',
    licenseUrl: 'https://ebible.org/pesOPV/copyright.htm',
    terms: 'Public Domain',
  },
  ja: {
    name: 'Japanese Kougo-yaku 1954/55',
    sourceUrl: 'https://ekotoba.org/',
    archiveUrl: 'https://ekotoba.org/data/Kougo1955_Japanese.txt',
    licenseUrl: 'https://ekotoba.org/',
    terms: 'Public Domain; the 1955 edition copyright expired at the end of 2005.',
  },
});

const BOOK_CODES = ('GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV').split(' ');

async function loadJapaneseBible() {
  const response = await fetch(CORRECTED_SOURCES.ja.archiveUrl, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Kougo-yaku source returned HTTP ${response.status}`);
  const verses = new Map();
  const books = new Set();
  // The source is UTF-8 TSV: edition, canonical book number, Japanese book name,
  // chapter:verse, and the exact verse wording. Japanese punctuation is retained.
  for (const line of (await response.text()).replace(/^\uFEFF/, '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [edition, bookNumber, , coordinate, text, extra] = line.split('\t');
    const book = BOOK_CODES[Number(bookNumber) - 1];
    if (edition !== 'KG1955' || !book || !text?.trim() || extra !== undefined) {
      throw new Error('Invalid Kougo-yaku source row');
    }
    // Psalm superscriptions are editorial titles numbered zero in this source.
    if (book === 'PSA' && /^\d+[.:]0$/.test(coordinate)) continue;
    const match = /^(\d+):(\d+(?:,\d+)*)$/.exec(coordinate);
    if (!match) throw new Error(`Invalid Kougo-yaku coordinate: ${coordinate}`);
    const numbers = match[2].split(',').map(Number);
    if (numbers.some((number, i) => number !== numbers[0] + i)) throw new Error(`Nonconsecutive Kougo-yaku bridge: ${coordinate}`);
    // Some Japanese verses reorder two or three adjacent English verses. Keep
    // the exact combined wording under its full extent, without splitting it.
    const extent = numbers.length > 1 ? `${numbers[0]}-${numbers.at(-1)}` : match[2];
    const key = `${book} ${match[1]}:${extent}`;
    if (verses.has(key)) throw new Error(`Duplicate Kougo-yaku verse: ${key}`);
    verses.set(key, text.trim());
    books.add(book);
  }
  if (books.size !== 66 || verses.size < 30000) throw new Error('Incomplete Kougo-yaku source');
  return verses;
}

export async function loadCorrectedBible(lang) {
  if (lang === 'fa') {
    const bible = await loadEbibleUsfmBible('pesOPV');
    // OPV's published wording combines these pairs; the following verse marker
    // is empty in the source. Expose the true extent so the bundle generator
    // includes the combined wording exactly once and never fabricates a verse.
    for (const [start, end] of [['MAT 9:37', 38], ['PSA 72:19', 20]]) {
      const text = bible.get(start);
      const next = start.replace(/:\d+$/, `:${end}`);
      if (!text || bible.has(next)) throw new Error(`Unexpected OPV verse bridge: ${start}`);
      bible.delete(start);
      bible.set(`${start}-${end}`, text);
    }
    return bible;
  }
  if (lang === 'ja') return loadJapaneseBible();
  throw new Error(`No corrected Scripture source for ${lang}`);
}
