// Maintenance pass over the guided-plan translation overlays that are actually
// SERVED (the languages listed in a plan's `proseTranslations`).
//
// An overlay day may legitimately repeat a value when the SOURCE repeats it too.
// What is not legitimate is an overlay reusing one day's wording where the
// source says something different — that reader gets one sentence over and over
// while an English reader gets five distinct invitations.
//
// This removes only those wrong repeats. The field then falls back through
// pick() to the authored English/French, which is the documented behaviour for
// any field an overlay leaves out.
//
//   node scripts/prune-overlay-duplicates.mjs [--write]
//
// Scope note: only `covenant21` is handled. Its days are hand-written JSON, so
// the source can be read reliably without a bundler. `marriage30` is built by a
// day() factory that renames its fields (`together` → `prayTogether`), which
// this parser would misread — and none of its overlays are served today, so
// there is nothing to prune. Teach the parser the factory before adding it.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'plans');
const write = process.argv.includes('--write');

const FIELDS = ['reflection', 'selfPrompt', 'spousePrompt', 'marriagePrompt', 'childPrompt',
  'practice', 'conversationPrompt', 'prayTogether', 'safetyNote'];

const PLAN_ID = 'covenant21';
const SOURCE_FILE = 'preparingForCovenantDays.js';
const PLAN_FILE = 'preparingForCovenant.js';

// The languages the plan declares ready, read straight from the plan module so
// this can never drift from what the app serves.
function servedLanguages() {
  const declared = readFileSync(join(root, PLAN_FILE), 'utf8')
    .match(/proseTranslations:\s*\[([^\]]*)\]/);
  if (!declared) throw new Error(`${PLAN_FILE} does not declare a proseTranslations list`);
  return [...declared[1].matchAll(/'([a-z]{2})'/g)].map((m) => m[1]);
}

// The authored English value of each field, per day, read as text.
function sourceDays() {
  const days = [];
  let current = null;
  let open = null;
  for (const line of readFileSync(join(root, SOURCE_FILE), 'utf8').split('\n')) {
    if (/^ {2}\{\s*$/.test(line)) { current = {}; days.push(current); open = null; }
    if (!current) continue;
    const field = FIELDS.find((f) => new RegExp(`^\\s*"${f}":\\s*\\{`).test(line));
    if (field) { open = field; continue; }
    const en = line.match(/^\s*"en":\s*("(?:[^"\\]|\\.)*")\s*,?\s*$/);
    if (en && open) { current[open] = en[1]; open = null; }
  }
  return days;
}

const dir = join(root, 'translations', PLAN_ID);
if (!existsSync(dir)) { console.log('no overlays to prune'); process.exit(0); }

const source = sourceDays();
const languages = servedLanguages();
console.log(`${PLAN_ID}: ${source.length} source days, serving ${languages.join(', ') || '(none)'}`);

let touched = 0;
for (const lang of languages) {
  const path = join(dir, `${lang}.json`);
  if (!existsSync(path)) { console.log(`${PLAN_ID}/${lang}.json: MISSING`); continue; }
  const json = JSON.parse(readFileSync(path, 'utf8'));
  const days = json[PLAN_ID]?.days || [];
  let removed = 0;

  for (const field of FIELDS) {
    const seen = new Map(); // translated value -> first day index that used it
    days.forEach((day, i) => {
      const value = day?.[field];
      if (typeof value !== 'string' || !value.trim()) return;
      const first = seen.get(value);
      if (first === undefined) { seen.set(value, i); return; }
      // A repeat is fine when the source repeats it too.
      if (source[first]?.[field] !== undefined && source[first][field] === source[i]?.[field]) return;
      delete day[field];
      removed += 1;
    });
  }

  console.log(`${PLAN_ID}/${lang}.json: ${removed ? `removed ${removed} duplicated value(s)` : 'clean'}`);
  if (removed) {
    touched += 1;
    if (write) writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  }
}

console.log(touched ? `${touched} file(s) ${write ? 'rewritten' : 'would change (pass --write)'}` : 'nothing to prune');
