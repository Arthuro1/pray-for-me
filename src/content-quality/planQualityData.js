// The repository data a plan-quality evaluation reads by default: overlays,
// glossaries, detection rules, review records, and the fingerprints that pin a
// record to the exact text it was made for.
//
// Tooling and CI only. It eager-loads every overlay and hashes with
// node:crypto, so app runtime code must never import it.
import contentRules from './content-rules.json';
import reviewStatus from './review-status.json';
import { SOURCE_LOCALES, localeRows, planFields } from './planChecks';
import { digest } from '../../scripts/content-quality/digest.mjs';

const OVERLAY_DIR = '../content/plans/translations';
const overlayModules = import.meta.glob(['../content/plans/translations/*.json', '../content/plans/translations/*/*.json'], { eager: true, import: 'default' });
const glossaryModules = import.meta.glob('./glossary/*.json', { eager: true, import: 'default' });
const ruleModules = import.meta.glob('./plan-rules/*.json', { eager: true, import: 'default' });

// A language's overlay for one plan: the legacy flat file, then the plan's own
// directory, exactly as src/content/plans/translations.js merges them.
export function overlayFor(planId, lang) {
  const flat = overlayModules[`${OVERLAY_DIR}/${lang}.json`];
  const scoped = overlayModules[`${OVERLAY_DIR}/${planId}/${lang}.json`];
  return { ...(flat || {}), ...(scoped || {}) }[planId] || null;
}

// Every { planId, lang } that has an overlay file on disk, ready or not.
export function overlayPairs() {
  const pairs = new Set();
  for (const [path, overlay] of Object.entries(overlayModules)) {
    const lang = path.match(/\/([a-z]{2})\.json$/)?.[1];
    for (const planId of Object.keys(overlay || {})) pairs.add(`${planId}/${lang}`);
  }
  return [...pairs].sort().map((pair) => {
    const [planId, lang] = pair.split('/');
    return { planId, lang };
  });
}

export const glossaryFor = (lang) => glossaryModules[`./glossary/${lang}.json`] || null;
export const planRulesFor = (lang) => ruleModules[`./plan-rules/${lang}.json`] || null;
export const PLAN_RULE_LOCALES = Object.keys(ruleModules).map((path) => path.match(/(\w+)\.json$/)[1]).sort();

export const recordKey = (lang, planId) => `${lang}/${planId}`;
export const committedPlanQualityRecords = () => reviewStatus.planQuality || {};

// What a quality record is pinned to. A different overlay or plan version
// voids the record; a different English/French source only flags it.
export function planQualityFingerprint(plan, overlay) {
  return {
    contentVersion: plan.version ?? null,
    overlayHash: overlay ? digest(overlay) : null,
    sourceHash: digest(Object.entries(planFields(plan)).map(([key, field]) => [key, field.en ?? null, field.fr ?? null])),
  };
}

// The authored source each plan-level judgment (theology profile) reads.
const sourceCache = new WeakMap();
export function sourceContexts(plan) {
  if (!sourceCache.has(plan)) {
    sourceCache.set(plan, SOURCE_LOCALES.map((lang) => ({ rows: localeRows(plan, lang), rules: planRulesFor(lang) })));
  }
  return sourceCache.get(plan);
}

export function defaultContext(plan, lang, options = {}) {
  const overlay = 'overlay' in options ? options.overlay : (SOURCE_LOCALES.includes(lang) ? null : overlayFor(plan.id, lang));
  const records = options.records || committedPlanQualityRecords();
  return {
    overlay,
    glossary: glossaryFor(lang),
    rules: planRulesFor(lang),
    contentRules,
    sources: sourceContexts(plan),
    record: records[recordKey(lang, plan.id)] || null,
    fingerprint: planQualityFingerprint(plan, overlay),
  };
}
