// The prayer-plan quality checks inside `npm run check:content`.
//
// Findings cover what readers actually see — the authored English/French
// prose and every overlay a plan declares ready — and fail CI only when they
// are new relative to plan-quality-baseline.json, exactly like the copy audit.
// Records in review-status.json → planQuality are pinned to the overlay text
// and plan version they were made for. See docs/PRAYER_PLAN_QUALITY.md.
import { digest } from './digest.mjs';

const SOURCE_LOCALES = ['en', 'fr'];
// The copy audit (checks.mjs) already reports these for every catalogue string.
const AUDITED_ELSEWHERE = new Set(['TERM_AVOIDED', 'SCRIPT_MISMATCH']);
const HASH = /^[a-f0-9]{64}$/;

export async function loadPlanQuality(ssrLoad) {
  const [{ PLANS }, { overlayLanguages }, data, model, checks] = await Promise.all([
    ssrLoad('/src/content/prayerPlans.js'),
    ssrLoad('/src/content/plans/translations.js'),
    ssrLoad('/src/content-quality/planQualityData.js'),
    ssrLoad('/src/lib/planQuality.js'),
    ssrLoad('/src/content-quality/planChecks.js'),
  ]);
  const plansById = new Map(PLANS.map((plan) => [plan.id, plan]));
  return {
    plans: PLANS,
    overlayLanguages,
    pairs: data.overlayPairs().filter(({ planId }) => plansById.has(planId)),
    fingerprintOf: (planId, lang) => data.planQualityFingerprint(plansById.get(planId), data.overlayFor(planId, lang)),
    rowsOf: (plan, lang) => checks.localeRows(plan, lang, SOURCE_LOCALES.includes(lang) ? null : data.overlayFor(plan.id, lang)),
    evaluate: model.evaluateLocalizedPlan,
    reviewProblems: model.reviewProblems,
    statuses: model.RECORD_STATUSES,
  };
}

// Keeps every record that still matches its text; anything new or changed
// becomes `needs-review` with current fingerprints. It never grants a status.
export function syncPlanQualityRecords({ pairs, fingerprintOf }, records = {}) {
  const next = {};
  for (const { planId, lang } of pairs) {
    const key = `${lang}/${planId}`;
    const current = fingerprintOf(planId, lang);
    const old = records[key];
    const stillValid = old && old.status !== 'needs-review'
      && old.overlayHash === current.overlayHash && old.contentVersion === current.contentVersion;
    next[key] = stillValid ? old : { status: 'needs-review', ...current };
  }
  return next;
}

export function planQualityRecordErrors({ pairs, fingerprintOf, reviewProblems, statuses }, records = {}) {
  const errors = [];
  const known = new Set(pairs.map(({ planId, lang }) => `${lang}/${planId}`));
  for (const key of Object.keys(records)) if (!known.has(key)) errors.push(`Unknown plan-quality record: ${key}`);
  for (const { planId, lang } of pairs) {
    const key = `${lang}/${planId}`;
    const record = records[key];
    if (!record || !statuses.includes(record.status)) { errors.push(`Missing or invalid plan-quality record: ${key}`); continue; }
    if (!HASH.test(record.overlayHash ?? '') || !HASH.test(record.sourceHash ?? '')) errors.push(`Invalid plan-quality fingerprints: ${key}`);
    if (record.status === 'needs-review') continue;
    const current = fingerprintOf(planId, lang);
    if (record.overlayHash !== current.overlayHash || record.contentVersion !== current.contentVersion) {
      errors.push(`Stale plan-quality record: ${key}; run check:content -- --sync-metadata to reset it to needs-review.`);
    }
    if (record.status === 'legacy-owner-approved' && (!record.since || !record.basis || !record.note)) errors.push(`Legacy plan-quality record needs since, basis and note: ${key}`);
    if (record.status === 'human-reviewed') {
      const problems = reviewProblems(record.review);
      if (problems.length) errors.push(`Incomplete plan-quality review: ${key}: ${problems.join(' ')}`);
    }
  }
  return errors;
}

// One finding per issue a reader could meet, keyed to the exact text it was
// found in so that editing that text cannot inherit a baseline exemption.
export function planQualityFindings({ plans, overlayLanguages, evaluate, rowsOf }, records) {
  const findings = new Map();
  for (const plan of plans) {
    for (const locale of [...SOURCE_LOCALES, ...overlayLanguages(plan)]) {
      const texts = new Map(rowsOf(plan, locale).map((row) => [row.location, row.text]));
      for (const issue of evaluate(plan, locale, { records }).issues) {
        if (issue.severity === 'info' || issue.accepted || issue.category === 'review' || AUDITED_ELSEWHERE.has(issue.code)) continue;
        const scope = issue.scope === 'plan' ? 'plan' : locale;
        const key = `${scope}/${plan.id}/${issue.code}/${issue.location}`;
        if (findings.has(key)) continue;
        findings.set(key, {
          locale: scope,
          id: `plans/${plan.id}:${issue.location}`,
          rule: `plan:${issue.code}`,
          severity: issue.severity,
          message: issue.message,
          fingerprint: digest([scope, plan.id, issue.code, issue.location, issue.message, texts.get(issue.location) ?? null]),
        });
      }
    }
  }
  return [...findings.values()];
}
