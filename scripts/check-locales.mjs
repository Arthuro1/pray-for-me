// Locale integrity + review checker.
//
// French (`fr`) is the bundled fallback in src/i18n.js — `t()` falls back to
// `loaded.fr[key]`, so fr is the canonical superset every other locale is
// measured against. This script checks the things a machine *can* verify
// objectively (and that silently degrade UX when wrong):
//
//   1. Missing keys      — key exists in fr but not in the locale. At runtime it
//                          falls back to FRENCH, so e.g. a Korean user sees a
//                          stray French string. Hard failure.
//   2. Placeholder drift — the {name}/{n} tokens don't match fr for that key.
//                          A dropped/renamed placeholder renders a literal
//                          "{n}" or an empty slot to the user. Hard failure.
//   3. Empty / non-string values. Hard failure.
//   4. Extra keys        — key in the locale but not in fr (dead string, or a
//                          typo'd key that never resolves). Warning.
//
// It also prints a per-locale "possibly untranslated" count (value identical to
// the fr *and* en source) as a soft signal for the native-review pass — quality
// itself can't be machine-checked, but this points reviewers at the right rows.
//
// Usage:
//   node scripts/check-locales.mjs            # summary + exit 1 on any hard failure
//   node scripts/check-locales.mjs --details  # also list every offending key
//   node scripts/check-locales.mjs --worksheet <lang>  # CSV of every key: en | fr | <lang>

import { readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, '..', 'src', 'i18n', 'locales');
const REFERENCE = 'fr'; // the bundled fallback / canonical key set

const args = process.argv.slice(2);
const showDetails = args.includes('--details');
const worksheetLang = args.includes('--worksheet') ? args[args.indexOf('--worksheet') + 1] : null;

const PLACEHOLDER = /\{(\w+)\}/g;
function placeholders(value) {
  if (typeof value !== 'string') return new Set();
  return new Set(Array.from(value.matchAll(PLACEHOLDER), (m) => m[1]));
}
function setsEqual(a, b) {
  return a.size === b.size && [...a].every((x) => b.has(x));
}

async function loadLocale(code) {
  const mod = await import(pathToFileURL(join(LOCALES_DIR, `${code}.js`)).href);
  return mod.default;
}

function csvCell(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const files = (await readdir(LOCALES_DIR)).filter((f) => f.endsWith('.js'));
  const codes = files.map((f) => f.replace(/\.js$/, ''));

  const ref = await loadLocale(REFERENCE);
  const en = codes.includes('en') ? await loadLocale('en') : {};
  const refKeys = Object.keys(ref);

  // One-off worksheet export for a native reviewer, then exit.
  if (worksheetLang) {
    if (!codes.includes(worksheetLang)) {
      console.error(`Unknown locale "${worksheetLang}". Available: ${codes.join(', ')}`);
      process.exit(2);
    }
    const target = await loadLocale(worksheetLang);
    const rows = [['key', 'en', 'fr', worksheetLang]];
    for (const key of refKeys) rows.push([key, en[key], ref[key], target[key]]);
    console.log(rows.map((r) => r.map(csvCell).join(',')).join('\n'));
    return;
  }

  const results = [];
  let hardFailures = 0;

  for (const code of codes) {
    if (code === REFERENCE) continue;
    const loc = await loadLocale(code);
    const locKeys = new Set(Object.keys(loc));

    const missing = refKeys.filter((k) => !locKeys.has(k));
    const extra = [...locKeys].filter((k) => !(k in ref));
    const empty = [];
    const badPlaceholders = [];
    let untranslated = 0;

    for (const key of refKeys) {
      if (!locKeys.has(key)) continue;
      const value = loc[key];
      const refValue = ref[key];

      // Some values are structured (e.g. `days` is a 7-element weekday array),
      // not translatable strings. Check them by shape, not by emptiness.
      if (Array.isArray(refValue)) {
        if (!Array.isArray(value) || value.length !== refValue.length) empty.push(key);
        continue;
      }
      if (typeof refValue !== 'string') continue; // objects/other — nothing to assert

      if (typeof value !== 'string' || value.trim() === '') {
        empty.push(key);
        continue;
      }
      if (!setsEqual(placeholders(value), placeholders(refValue))) badPlaceholders.push(key);
      // Soft signal: identical to BOTH source languages ⇒ likely never translated.
      if (value === refValue && en[key] !== undefined && value === en[key]) untranslated += 1;
    }

    const hard = missing.length + empty.length + badPlaceholders.length;
    hardFailures += hard;
    results.push({ code, missing, extra, empty, badPlaceholders, untranslated, hard });
  }

  // ── Report ────────────────────────────────────────────────────────────────
  console.log(`Locale check — reference: ${REFERENCE} (${refKeys.length} keys)\n`);
  const pad = (s, n) => String(s).padEnd(n);
  console.log(pad('lang', 6) + pad('missing', 9) + pad('empty', 7) + pad('ph-drift', 10) + pad('extra', 7) + 'untranslated?');
  console.log('─'.repeat(54));
  for (const r of results.sort((a, b) => b.hard - a.hard || b.untranslated - a.untranslated)) {
    const flag = r.hard > 0 ? ' ✗' : '  ';
    console.log(
      pad(r.code, 6) + pad(r.missing.length, 9) + pad(r.empty.length, 7)
      + pad(r.badPlaceholders.length, 10) + pad(r.extra.length, 7) + pad(r.untranslated, 12) + flag,
    );
  }

  if (showDetails) {
    for (const r of results) {
      if (r.hard === 0 && r.extra.length === 0) continue;
      console.log(`\n── ${r.code} ──`);
      if (r.missing.length) console.log(`  missing (${r.missing.length}): ${r.missing.join(', ')}`);
      if (r.empty.length) console.log(`  empty (${r.empty.length}): ${r.empty.join(', ')}`);
      if (r.badPlaceholders.length) console.log(`  placeholder drift (${r.badPlaceholders.length}): ${r.badPlaceholders.join(', ')}`);
      if (r.extra.length) console.log(`  extra (${r.extra.length}): ${r.extra.join(', ')}`);
    }
  }

  console.log('');
  if (hardFailures > 0) {
    console.error(`✗ ${hardFailures} hard failure(s) across locales (missing / empty / placeholder drift).`);
    console.error('  Run with --details to list them.');
    process.exit(1);
  }
  console.log('✓ All locales structurally complete (keys + placeholders match the reference).');
  console.log('  Note: "untranslated?" is a review hint, not a failure — quality still needs a native pass.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
