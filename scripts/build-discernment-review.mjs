// Standalone editorial reader built only from the versioned application copy.
// No translation calls, account, journal storage or approval signatures.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { LANGUAGES, RTL_LANGS } from '../src/i18n.js';
import { BOOK_NAMES } from '../src/content/dailyVerses.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const base = 'src/content/plans/discernment';
const themes = readJson(`${base}/themes.json`);
const references = readJson(`${base}/references.json`);
const content = {};
const labelKeys = [
  'planDiscernmentReading', 'planDiscernmentReflection', 'planDiscernmentPrayer',
  'planDiscernmentListening', 'planDiscernmentJournal', 'planDiscernmentDeeper',
  'planDiscernmentReview', 'planPracticeToday', 'planDayLabel',
];

for (const { code } of LANGUAGES) {
  const locale = (await import(pathToFileURL(resolve(root, `src/i18n/locales/${code}.js`)))).default;
  const prose = ['en', 'fr'].includes(code)
    ? readJson(`${base}/${code}.json`)
    : readJson(`src/content/plans/translations/discernment28/${code}.json`).discernment28;
  const copy = (key) => {
    if (typeof locale[key] !== 'string' || !locale[key].trim()) throw new Error(`${code}: missing ${key}`);
    return locale[key];
  };
  if (prose.days.length !== 28) throw new Error(`${code}: expected 28 days`);
  for (const [index, day] of prose.days.entries()) {
    if (!themes[index][code] || !day.reflection || !day.practice || day.discernment?.questions?.length !== 3) {
      throw new Error(`${code}: incomplete day ${index + 1}`);
    }
    for (const field of ['reading', 'prayer', 'listening', 'deeper']) {
      if (!day.discernment[field]) throw new Error(`${code}: missing day ${index + 1}/${field}`);
    }
  }
  content[code] = {
    title: copy('planDiscernmentTitle'), subtitle: copy('planDiscernmentSub'),
    movements: [1, 2, 3, 4].map((n) => copy(`planDiscernmentMovement${n}`)),
    labels: Object.fromEntries(labelKeys.map((key) => [key, copy(key)])),
    intro: prose.intro.replace(/\n{3,}/g, '\n\n').replace(/ - /g, '\n- '),
    biblical: prose.biblical, completion: prose.completion,
    days: prose.days.map((day, index) => ({ ...day, theme: themes[index][code] })),
  };
}
const payload = { languages: LANGUAGES, rtl: RTL_LANGS, references, books: BOOK_NAMES, content };
const data = JSON.stringify(payload);
const fingerprint = createHash('sha256').update(data).digest('hex').slice(0, 12);
// JSON is embedded as inert data. Escape '<' to prevent script-end injection.
const safeData = data.replace(/</g, '\\u003c');
const template = readFileSync(new URL('./discernment-review.html', import.meta.url), 'utf8');
const html = template.replace('<!-- CONTENT_DATA -->', () => safeData).replaceAll('CONTENT_FINGERPRINT', fingerprint);
const destination = resolve(root, 'design-qa/discernment-review.html');
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, html);
console.log(`Editorial reader: ${destination}`);
console.log(`${LANGUAGES.length} languages · 28 days · source ${fingerprint} · no approval recorded`);
