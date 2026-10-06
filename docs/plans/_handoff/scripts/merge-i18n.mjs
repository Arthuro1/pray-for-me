/* global process */
// Merge { key: { en, fr, ...16 } } JSON files into src/i18n/locales/*.js.
// Inserts after the "planCategoryStudy" line. Refuses duplicate keys (a
// duplicate JS object key silently overrides — the dupe-key trap).
// Usage: node merge-i18n.mjs <repo> <file.json> [...more.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [repo, ...files] = process.argv.slice(2);
const LANGS = ['en', 'fr', 'de', 'es', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'fa', 'hi', 'id', 'sw', 'tl', 'am'];
const merged = {};
for (const f of files) {
  const data = JSON.parse(readFileSync(f, 'utf8'));
  for (const [key, vals] of Object.entries(data)) {
    if (merged[key]) throw new Error(`duplicate key across inputs: ${key}`);
    for (const l of LANGS) if (typeof vals[l] !== 'string' || !vals[l].trim()) throw new Error(`${f}: ${key} missing ${l}`);
    merged[key] = vals;
  }
}
const keys = Object.keys(merged);
for (const l of LANGS) {
  const path = join(repo, 'src/i18n/locales', `${l}.js`);
  let src = readFileSync(path, 'utf8');
  for (const k of keys) if (src.includes(`"${k}":`)) throw new Error(`${l}: key already exists: ${k}`);
  const anchor = src.match(/^.*"planCategoryStudy":.*$/m);
  if (!anchor) throw new Error(`${l}: anchor missing`);
  const lines = keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(merged[k][l])},`).join('\n');
  src = src.replace(anchor[0], `${anchor[0]}\n${lines}`);
  writeFileSync(path, src);
}
console.log(`merged ${keys.length} keys into ${LANGS.length} locales`);
