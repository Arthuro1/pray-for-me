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

// The landing page does NOT use t(): src/pages/landing/copy.js swaps in one
// whole dictionary per language, so there is no per-key fallback to catch a
// gap. Whatever a locale's file holds is exactly what that reader sees — an
// absent key renders as `undefined`, and a short array simply renders fewer
// items, silently. English is the reference because copy.js falls back to it.
const LANDING_DIR = join(__dirname, '..', 'src', 'pages', 'landing', 'locales');
const LANDING_REFERENCE = 'en';

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

// ── Landing bundle ─────────────────────────────────────────────────────────
// Flatten the nested landing dictionary to leaf paths ("content.faqs[3].q") so
// a missing FAQ or a dropped benefit is a named key rather than a silent shape
// difference. Array indices are part of the path on purpose: these arrays are
// rendered positionally, so a short one IS a missing key.
function flattenLanding(value, path = '', out = {}) {
  if (Array.isArray(value)) {
    value.forEach((v, i) => flattenLanding(v, `${path}[${i}]`, out));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) flattenLanding(v, path ? `${path}.${k}` : k, out);
  } else {
    out[path] = value;
  }
  return out;
}

// `icon` and `color` are structural (a lucide name and a hex value) and are
// identical in every language by design — never a translation gap.
const isStructuralLandingKey = (key) => /\.(icon|color)$/.test(key);

async function checkLanding() {
  const codes = (await readdir(LANDING_DIR))
    .filter((f) => f.startsWith('landing-') && f.endsWith('.js'))
    .map((f) => f.replace(/^landing-|\.js$/g, ''));

  const load = async (code) => flattenLanding(
    (await import(pathToFileURL(join(LANDING_DIR, `landing-${code}.js`)).href)).default,
  );

  const ref = await load(LANDING_REFERENCE);
  const refKeys = Object.keys(ref);
  const results = [];
  let hard = 0;

  for (const code of codes) {
    if (code === LANDING_REFERENCE) continue;
    const loc = await load(code);
    const locKeys = new Set(Object.keys(loc));

    const missing = refKeys.filter((k) => !locKeys.has(k));
    const extra = [...locKeys].filter((k) => !(k in ref));
    const empty = [];
    const badPlaceholders = [];
    let untranslated = 0;

    for (const key of refKeys) {
      if (!locKeys.has(key)) continue;
      const value = loc[key];
      if (typeof ref[key] !== 'string') continue;
      if (typeof value !== 'string' || value.trim() === '') {
        empty.push(key);
        continue;
      }
      if (!setsEqual(placeholders(value), placeholders(ref[key]))) badPlaceholders.push(key);
      // Soft signal: English left in place. Structural keys are excluded, so
      // this counts only strings a reader actually reads.
      if (!isStructuralLandingKey(key) && value === ref[key] && value.length > 2) untranslated += 1;
    }

    const bad = missing.length + empty.length + badPlaceholders.length;
    hard += bad;
    results.push({ code, missing, extra, empty, badPlaceholders, untranslated, hard: bad });
  }

  console.log(`\n\nLanding copy — reference: ${LANDING_REFERENCE} (${refKeys.length} leaf values)\n`);
  const pad = (s, n) => String(s).padEnd(n);
  console.log(pad('lang', 6) + pad('missing', 9) + pad('empty', 7) + pad('ph-drift', 10) + pad('extra', 7) + 'english-left?');
  console.log('─'.repeat(54));
  for (const r of results.sort((a, b) => b.hard - a.hard || b.untranslated - a.untranslated)) {
    console.log(
      pad(r.code, 6) + pad(r.missing.length, 9) + pad(r.empty.length, 7)
      + pad(r.badPlaceholders.length, 10) + pad(r.extra.length, 7) + pad(r.untranslated, 12)
      + (r.hard > 0 ? ' ✗' : '  '),
    );
  }

  if (showDetails) {
    for (const r of results) {
      if (r.hard === 0 && r.extra.length === 0) continue;
      console.log(`\n── landing/${r.code} ──`);
      if (r.missing.length) console.log(`  missing (${r.missing.length}): ${r.missing.join(', ')}`);
      if (r.empty.length) console.log(`  empty (${r.empty.length}): ${r.empty.join(', ')}`);
      if (r.badPlaceholders.length) console.log(`  placeholder drift (${r.badPlaceholders.length}): ${r.badPlaceholders.join(', ')}`);
      if (r.extra.length) console.log(`  extra (${r.extra.length}): ${r.extra.join(', ')}`);
    }
  }

  return hard;
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

  const landingFailures = await checkLanding();
  const total = hardFailures + landingFailures;

  console.log('');
  if (total > 0) {
    console.error(`✗ ${total} hard failure(s) across locales (missing / empty / placeholder drift)`
      + ` — ${hardFailures} in the UI strings, ${landingFailures} in the landing copy.`);
    console.error('  Run with --details to list them.');
    process.exit(1);
  }
  console.log('✓ All locales structurally complete (keys + placeholders match the reference).');
  console.log('  Note: "untranslated?" / "english-left?" are review hints, not failures — quality still needs a native pass.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
