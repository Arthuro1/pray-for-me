// AYT supplies the complete Indonesian Bible, including Psalms. Its publisher
// permits noncommercial redistribution with attribution; this text is not MIT
// licensed. See https://ebible.org/indayt/copyright.htm for the complete terms.
// Only Scripture wording is retained: USFM layout, headings, notes and printed
// alternative verse numbers are removed. No translation or paraphrase occurs.
import { inflateRawSync } from 'node:zlib';

export const INDONESIAN_SOURCE = Object.freeze({
  abbr: 'AYT',
  name: 'Alkitab Yang Terbuka',
  copyright: 'Copyright © 2011-2024 YLSA-AYT',
  sourceUrl: 'https://ebible.org/indayt/',
  archiveUrl: 'https://ebible.org/Scriptures/indayt_usfm.zip',
  licenseUrl: 'https://ebible.org/indayt/copyright.htm',
  terms: 'Noncommercial redistribution with attribution; preserve the original text.',
});

// The upstream ZIP uses ordinary stored/deflated entries. Read its central
// directory in memory, without extracting files or introducing a ZIP dependency.
function usfmFiles(archive) {
  let end = archive.length - 22;
  const minimum = Math.max(0, archive.length - 22 - 0xffff);
  while (end >= minimum && archive.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < minimum) throw new Error('eBible archive has no ZIP directory');
  const count = archive.readUInt16LE(end + 10);
  let offset = archive.readUInt32LE(end + 16);
  const files = [];
  for (let i = 0; i < count; i++) {
    if (archive.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid eBible ZIP entry');
    const method = archive.readUInt16LE(offset + 10);
    const compressedSize = archive.readUInt32LE(offset + 20);
    const originalSize = archive.readUInt32LE(offset + 24);
    const nameLength = archive.readUInt16LE(offset + 28);
    const extraLength = archive.readUInt16LE(offset + 30);
    const commentLength = archive.readUInt16LE(offset + 32);
    const local = archive.readUInt32LE(offset + 42);
    const name = archive.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    offset += 46 + nameLength + extraLength + commentLength;
    if (!name.endsWith('.usfm')) continue;
    if (archive.readUInt32LE(local) !== 0x04034b50) throw new Error('Invalid eBible ZIP file');
    const start = local + 30 + archive.readUInt16LE(local + 26) + archive.readUInt16LE(local + 28);
    const compressed = archive.subarray(start, start + compressedSize);
    const content = method === 8 ? inflateRawSync(compressed) : method === 0 ? compressed : null;
    if (!content || content.length !== originalSize) throw new Error(`Cannot decode eBible file ${name}`);
    files.push(content.toString('utf8'));
  }
  if (files.length < 66) throw new Error(`Expected at least 66 Bible books, received ${files.length}`);
  return files;
}

function cleanVerse(text, book, id) {
  let cleaned = text
    .replace(/\\w\s+([^|\\]+)(?:\|[^\\]*)?\\w\*/g, '$1')
    .replace(/\\\+?[a-z][a-z0-9]*\*?[ \t]*/gi, ' ');
  // These parenthetical chapter-verse labels are editorial alternative numbering
  // in AYT's Psalms, not part of the wording of the verse.
  if (id === 'indayt' && book === 'PSA') cleaned = cleaned.replace(/\(\d{1,3}-\d{1,3}\)/g, '');
  return cleaned.replace(/\s+/g, ' ').trim();
}

function addBook(usfm, verses, id) {
  const book = /\\id\s+([A-Z0-9]{3})/.exec(usfm)?.[1];
  if (!book) throw new Error(`${id} book has no USFM identifier`);
  let content = usfm.replace(/\r\n?/g, '\n')
    .replace(/\\(?:f|fe|x)\s[\s\S]*?\\(?:f|fe|x)\*/g, '')
    .replace(/\\fig\s[\s\S]*?\\fig\*/g, '')
    .replace(/\\(?:va|vp|ca)\s[\s\S]*?\\(?:va|vp|ca)\*/g, '');
  if (id === 'hin2017') {
    // IRV marks its parenthetical cross references in bold italics. These
    // publisher notes are not part of the verse body.
    content = content.replace(/\\bdit\s+\([^)]*\)\s*\\bdit\*/g, '');
  }
  if (id === 'indayt' && book === 'PSA') {
    // AYT places some superscriptions inside the first \v 1, before a \b.
    // Keep the marker and the ensuing verse body, excluding the title itself.
    content = content.replace(/\\d[ \t]*\n\\v\s+1\s+[\s\S]*?(?=\\b(?:\s|$))/g, '\\v 1\n');
  }
  content = content.replace(/^\\(?:s\d*|ms\d*|r|d|rem)\b[^\n]*(?:\n|$)/gm, '');
  const chapters = content.split(/\\c\s+(\d+)\s*/);
  for (let i = 1; i < chapters.length; i += 2) {
    const number = Number(chapters[i]);
    const body = chapters[i + 1];
    for (const match of body.matchAll(/\\v\s+(\d+)(?:-(\d+))?\s+([\s\S]*?)(?=\\v\s+\d+|$)/g)) {
      if (match[2]) throw new Error(`${id} verse bridge needs explicit handling: ${book} ${number}:${match[1]}-${match[2]}`);
      const text = cleanVerse(match[3], book, id);
      // Some complete editions contain empty verse markers outside the curated
      // passages. Keep them absent so the builder can reject any required hole.
      if (!text) continue;
      verses.set(`${book} ${number}:${Number(match[1])}`, text);
    }
  }
}

// Other verified editions can use the same USFM/ZIP reader. Callers remain
// responsible for checking their license and source-specific versification.
export async function loadEbibleUsfmBible(id) {
  if (!/^[a-z0-9-]+$/i.test(id)) throw new Error('Invalid eBible edition identifier');
  const response = await fetch(`https://ebible.org/Scriptures/${id}_usfm.zip`);
  if (!response.ok) throw new Error(`${id} archive returned HTTP ${response.status}`);
  const archive = Buffer.from(await response.arrayBuffer());
  const verses = new Map();
  for (const usfm of usfmFiles(archive)) addBook(usfm, verses, id);
  return verses;
}

export async function loadIndonesianBible() {
  return loadEbibleUsfmBible('indayt');
}
