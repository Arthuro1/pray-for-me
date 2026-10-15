// The prayer-plan content quality model. See docs/PRAYER_PLAN_QUALITY.md.
//
// The central question is not "is this a correct translation?" but "would a
// faithful Christian native speaker naturally write or pray it this way?".
// Machines cannot answer that, so the model keeps two facts apart:
//
//   automatically valid  — the detectors (src/content-quality/planChecks.js)
//                          found nothing that blocks it;
//   approved             — a named native Christian reviewer scored it, the
//                          scores meet the thresholds, and no unaccepted
//                          finding caps a dimension below them.
//
// Automated findings never raise a score. They only CAP one: a critical
// pastoral-safety finding caps that dimension at 1 however well a reviewer
// scored it, so a serious failure cannot be averaged away.
//
// Tooling and CI only: the defaults read every overlay, glossary and rule file
// and hash with node:crypto. App runtime keeps reading `proseTranslations`
// (src/content/plans/translations.js), which CI proves is backed by a record
// here (src/content/plans/planQualityGate.test.js).
import { checkLocalizedPlan, SOURCE_LOCALES } from '../content-quality/planChecks';
import { defaultContext } from '../content-quality/planQualityData';
import { overlayLanguages } from '../content/plans/translations';
import { TRADITIONS } from '../content/theologyProfiles';
import { hasNativeReviewEvidence, isPlanReviewed } from './planReview';
import { LANG_CODES } from '../i18n';

export const QUALITY_DIMENSIONS = Object.freeze([
  'linguistic', 'christianLanguage', 'prayerAuthenticity', 'theology', 'pastoralSafety', 'editorial',
]);

// The criteria a reviewer may score within each dimension (0–5 each). A
// dimension may also be scored as one number.
export const DIMENSION_CRITERIA = Object.freeze({
  linguistic: ['grammar', 'naturalness', 'idiomaticity', 'flow', 'vocabulary', 'punctuation', 'register', 'literalness'],
  christianLanguage: ['terminology', 'prayerRegister', 'biblicalVocabulary', 'theologicalPrecision', 'consistency'],
  prayerAuthenticity: ['addressesGod', 'godCentered', 'reverence', 'prayerForms'],
  theology: ['biblicalFidelity', 'doctrinalAccuracy', 'audienceFit', 'godClaims'],
  pastoralSafety: ['guarantees', 'shame', 'abuseSafety', 'careReferral', 'discernment'],
  editorial: ['clarity', 'concision', 'consistency', 'repetition', 'readability'],
});

// What a reviewer judges in each dimension, in plain words (review page, docs).
const guide = (label, text) => Object.freeze({ label, text });
export const DIMENSION_GUIDE = Object.freeze({
  linguistic: guide('Linguistic quality', 'Grammar, natural phrasing, idiom, flow, punctuation and register. Nothing reads like English in disguise.'),
  christianLanguage: guide('Christian language', 'The words Christians in this language actually use for God, prayer, grace, repentance… used consistently. No self-help or wellness vocabulary.'),
  prayerAuthenticity: guide('Prayer authenticity', 'The prayers sound like real prayer: they speak to God, reverently and naturally, and are centred on him rather than on self-improvement.'),
  theology: guide('Theology', 'Faithful to the Scripture passage and to the English meaning. No added doctrine, no overconfident claims about what God intends, no hope turned into a promise.'),
  pastoralSafety: guide('Pastoral safety', 'No guaranteed healing, marriage or wealth; no blame for suffering or "weak faith"; no shame; safe about abuse; points to doctors, counsellors and pastors where needed.'),
  editorial: guide('Editorial quality', 'Clear, concise, consistent, not repetitive, easy to read aloud.'),
});

// The 0–5 scale every dimension uses.
export const SCORE_SCALE = Object.freeze([
  [5, 'Indistinguishable from excellent native Christian writing or prayer'],
  [4, 'Very natural; minor stylistic imperfections'],
  [3, 'Understandable but noticeably translated (or theologically loose)'],
  [2, 'Awkward or literal in several places; or a real theological or pastoral weakness'],
  [1, 'Seriously unnatural, or a serious theological or pastoral problem'],
  [0, 'Broken or unusable'],
]);

// `minimumDimension` binds the critical dimensions; `floorDimension` binds the
// rest, so no dimension can sink far enough to be carried by the others.
export const DEFAULT_QUALITY_THRESHOLDS = Object.freeze({
  minimumOverall: 4,
  preferredOverall: 4.5,
  minimumDimension: 4,
  floorDimension: 3,
  criticalDimensions: Object.freeze(['theology', 'pastoralSafety', 'christianLanguage']),
});

// The highest score a dimension can keep while it has an unaccepted finding
// of this severity.
export const SEVERITY_CEILING = Object.freeze({ critical: 1, error: 3, warning: 4, info: 5 });

const spec = (category, severity, extra = {}) => Object.freeze({ category, severity, ...extra });

// Stable issue codes. CI baselines and tooling key on these strings: never
// rename one; retire it and add a new code instead. `qualifiable` codes are
// allowed when their sentence is qualified as hope, prayer, possibility or a
// statement of what Scripture teaches.
export const ISSUE_CODES = Object.freeze({
  // Integrity — a precondition: an integrity error blocks automatically.
  OVERLAY_MALFORMED: spec('integrity', 'critical'),
  OVERLAY_DAY_COUNT: spec('integrity', 'critical'),
  OVERLAY_PROMPT_COUNT: spec('integrity', 'critical'),
  OVERLAY_STRUCTURAL_FIELD: spec('integrity', 'critical'),
  OVERLAY_UNKNOWN_FIELD: spec('integrity', 'error'),
  OVERLAY_FIELD_NOT_IN_SOURCE: spec('integrity', 'error'),
  SCRIPTURE_REFERENCE_INVENTED: spec('integrity', 'critical'),
  SCRIPTURE_TEXT_SUSPECTED: spec('integrity', 'warning'),
  PLACEHOLDER_MISMATCH: spec('integrity', 'error'),
  UNTRANSLATED_COPY: spec('integrity', 'error'),
  MISSING_TRANSLATION: spec('integrity', 'info'),
  // Linguistic
  ENGLISH_FRAGMENT: spec('linguistic', 'warning'),
  MIXED_SCRIPT: spec('linguistic', 'warning'),
  SCRIPT_MISMATCH: spec('linguistic', 'error'),
  MT_ARTIFACT: spec('linguistic', 'warning'),
  LITERAL_CALQUE: spec('linguistic', 'warning'),
  // Editorial
  WRONG_REPEAT: spec('editorial', 'error'),
  TEMPLATE_FRAME: spec('editorial', 'error'),
  // Christian language
  TERM_AVOIDED: spec('christianLanguage', 'error'),
  TERM_INCONSISTENCY: spec('christianLanguage', 'warning'),
  SELF_HELP_LANGUAGE: spec('christianLanguage', 'warning'),
  // Prayer authenticity
  PRAYER_NOT_ADDRESSED_TO_GOD: spec('prayerAuthenticity', 'warning'),
  PROMPTS_NOT_GOD_CENTERED: spec('prayerAuthenticity', 'info'),
  COACHING_TONE: spec('prayerAuthenticity', 'warning'),
  // Theology — "Scripture teaches…" is allowed; speaking for God is not.
  GOD_SPEAKS_FOR_READER: spec('theology', 'critical'),
  GUARANTEED_OUTCOME: spec('theology', 'critical', { qualifiable: true }),
  PRAYER_TECHNIQUE: spec('theology', 'critical'),
  CERTAINTY_CLAIM: spec('theology', 'critical', { qualifiable: true }),
  UNDECLARED_THEOLOGY_PROFILE: spec('theology', 'error'),
  INVALID_THEOLOGY_PROFILE: spec('theology', 'error'),
  UNDECLARED_DISPUTED_TOPIC: spec('theology', 'warning'),
  CHARISMATIC_CONFLICT: spec('theology', 'warning'),
  TRADITION_CONFLICT: spec('theology', 'warning'),
  // Pastoral safety
  GUARANTEED_HEALING: spec('pastoralSafety', 'critical', { qualifiable: true }),
  GUARANTEED_MARRIAGE: spec('pastoralSafety', 'critical', { qualifiable: true }),
  PROSPERITY_PROMISE: spec('pastoralSafety', 'critical', { qualifiable: true }),
  FAITH_DEFICIT_BLAME: spec('pastoralSafety', 'critical'),
  SUFFERING_BLAME: spec('pastoralSafety', 'critical'),
  SHAME_LANGUAGE: spec('pastoralSafety', 'critical'),
  ABUSE_ENDANGERMENT: spec('pastoralSafety', 'critical'),
  CARE_REPLACEMENT: spec('pastoralSafety', 'critical'),
  COERCIVE_CONFRONTATION: spec('pastoralSafety', 'error'),
  SPIRITUAL_MANIPULATION: spec('pastoralSafety', 'critical'),
  // Review records — never block content; they decide whether a record counts.
  REVIEW_STALE: spec('review', 'warning'),
  REVIEW_INCOMPLETE: spec('review', 'error'),
  SOURCE_CHANGED_SINCE_REVIEW: spec('review', 'warning'),
});

// Codes the locale detection rules (src/content-quality/plan-rules/) supply
// patterns for.
export const PATTERN_CODES = Object.freeze([
  'GOD_SPEAKS_FOR_READER', 'GUARANTEED_OUTCOME', 'PRAYER_TECHNIQUE', 'CERTAINTY_CLAIM',
  'GUARANTEED_HEALING', 'GUARANTEED_MARRIAGE', 'PROSPERITY_PROMISE', 'FAITH_DEFICIT_BLAME',
  'SUFFERING_BLAME', 'SHAME_LANGUAGE', 'ABUSE_ENDANGERMENT', 'CARE_REPLACEMENT',
  'COERCIVE_CONFRONTATION', 'SPIRITUAL_MANIPULATION', 'SELF_HELP_LANGUAGE', 'COACHING_TONE', 'LITERAL_CALQUE',
]);

// Plan-quality record statuses (review-status.json → planQuality).
export const RECORD_STATUSES = Object.freeze(['needs-review', 'legacy-owner-approved', 'human-reviewed']);

const BLOCKING_ERROR_CATEGORIES = new Set(['integrity']);

// --- Issues ---------------------------------------------------------------------

// A qualified claim ("we pray that God will heal") is allowed language; a
// negated one ("it never asks anyone to submit to abuse") is usually the
// safeguard itself. Both stay visible to reviewers, as info.
function allowance(finding, definition) {
  if (finding.negated) return 'Negated, likely a safeguard';
  if (finding.qualified && definition.qualifiable) return 'Qualified, allowed';
  return null;
}

export function classifyIssue(finding) {
  const definition = ISSUE_CODES[finding.code];
  if (!definition) throw new Error(`Unknown plan-quality issue code: ${finding.code}`);
  const allowed = allowance(finding, definition);
  return {
    code: finding.code,
    category: definition.category,
    severity: allowed ? 'info' : definition.severity,
    location: finding.location,
    message: allowed ? `${allowed}: ${finding.message}` : finding.message,
    ...(finding.excerpt ? { excerpt: finding.excerpt } : {}),
    ...(finding.scope ? { scope: finding.scope } : {}),
  };
}

const isActive = (issue) => !issue.accepted && issue.severity !== 'info';
const isBlocking = (issue) => isActive(issue)
  && (issue.severity === 'critical' || (issue.severity === 'error' && BLOCKING_ERROR_CATEGORIES.has(issue.category)));

export function scoreCeilings(issues) {
  const ceilings = Object.fromEntries(QUALITY_DIMENSIONS.map((d) => [d, 5]));
  for (const issue of issues.filter(isActive)) {
    if (ceilings[issue.category] !== undefined) {
      ceilings[issue.category] = Math.min(ceilings[issue.category], SEVERITY_CEILING[issue.severity]);
    }
  }
  return ceilings;
}

// --- Human review scores ----------------------------------------------------------

const isScore = (value) => typeof value === 'number' && value >= 0 && value <= 5;

export function dimensionScore(value) {
  if (isScore(value)) return value;
  if (!value || typeof value !== 'object') return null;
  const scores = Object.values(value);
  if (!scores.length || !scores.every(isScore)) return null;
  return scores.reduce((sum, n) => sum + n, 0) / scores.length;
}

// Why a native-Christian review record cannot count yet; empty when complete.
export function reviewProblems(review) {
  if (!review || typeof review !== 'object') return ['No review.'];
  const problems = [];
  const reviewer = review.reviewer || {};
  if (!hasNativeReviewEvidence(reviewer)) {
    problems.push('Reviewer needs a name, an ISO reviewedAt date, nativeSpeaker: true and christianReview: true.');
  }
  if (reviewer.tradition !== undefined && !TRADITIONS.includes(reviewer.tradition)) problems.push(`Unknown reviewer tradition "${reviewer.tradition}".`);
  for (const dimension of QUALITY_DIMENSIONS) {
    const value = review[dimension];
    if (dimensionScore(value) === null) { problems.push(`${dimension} needs a 0–5 score.`); continue; }
    if (typeof value === 'object') {
      const unknown = Object.keys(value).filter((key) => !DIMENSION_CRITERIA[dimension].includes(key));
      if (unknown.length) problems.push(`${dimension}: unknown criteria ${unknown.join(', ')}.`);
    }
  }
  for (const accepted of review.acceptedIssues || []) {
    if (!ISSUE_CODES[accepted.code] || !accepted.location || !accepted.reason?.trim()) {
      problems.push('Each accepted issue needs a known code, a location and a reason.');
      break;
    }
  }
  return problems;
}

export const reviewScores = (review) => Object.fromEntries(QUALITY_DIMENSIONS.map((d) => [d, dimensionScore(review[d])]));

const round = (n) => Math.round(n * 100) / 100;

export function thresholdFailures(score, thresholds = DEFAULT_QUALITY_THRESHOLDS) {
  const failures = [];
  for (const dimension of QUALITY_DIMENSIONS) {
    const critical = thresholds.criticalDimensions.includes(dimension);
    const minimum = critical ? thresholds.minimumDimension : thresholds.floorDimension;
    if (score[dimension] < minimum) failures.push(`${dimension} ${round(score[dimension])} < ${minimum}${critical ? ' (critical)' : ''}`);
  }
  if (score.overall < thresholds.minimumOverall) failures.push(`overall ${score.overall} < ${thresholds.minimumOverall}`);
  return failures;
}

// The verdict from classified issues and (optionally) a valid human review.
export function decideQuality({ issues, review = null, thresholds = DEFAULT_QUALITY_THRESHOLDS }) {
  const blocking = issues.filter(isBlocking);
  const ceilings = scoreCeilings(issues);
  const automated = { valid: blocking.length === 0, blocking: blocking.length };
  if (!review) return { status: blocking.length ? 'rejected' : 'needs-review', automated, ceilings, score: null, failures: [], meetsPreferred: false };
  const human = reviewScores(review);
  const score = Object.fromEntries(QUALITY_DIMENSIONS.map((d) => [d, round(Math.min(human[d], ceilings[d]))]));
  score.overall = round(QUALITY_DIMENSIONS.reduce((sum, d) => sum + score[d], 0) / QUALITY_DIMENSIONS.length);
  const failures = thresholdFailures(score, thresholds);
  const status = blocking.length || failures.length ? 'rejected' : 'approved';
  return { status, automated, ceilings, score, failures, meetsPreferred: status === 'approved' && score.overall >= thresholds.preferredOverall };
}

// --- Records ----------------------------------------------------------------------

// A record counts only for the exact overlay and plan version it was made
// for. A changed English source keeps it, flagged for the reviewer.
function recordState(record, fingerprint) {
  if (!record || record.status === 'needs-review') return { record: null, issues: [] };
  const issues = [];
  if (fingerprint) {
    if (record.overlayHash !== fingerprint.overlayHash || record.contentVersion !== fingerprint.contentVersion) {
      return { record: null, issues: [{ code: 'REVIEW_STALE', location: 'review', message: 'The reviewed text or plan version changed after this record; it no longer counts.' }] };
    }
    if (record.sourceHash !== fingerprint.sourceHash) {
      issues.push({ code: 'SOURCE_CHANGED_SINCE_REVIEW', location: 'review', message: 'The English/French source changed after review; ask the reviewer to confirm the translation still matches.' });
    }
  }
  if (record.status === 'human-reviewed') {
    const problems = reviewProblems(record.review);
    if (problems.length) return { record: null, issues: [...issues, { code: 'REVIEW_INCOMPLETE', location: 'review', message: problems.join(' ') }] };
  }
  return { record, issues };
}

const acceptedBy = (review) => (issue) => (review?.acceptedIssues || [])
  .some((a) => a.code === issue.code && a.location === issue.location);

function stageOf(issues, categories) {
  const relevant = issues.filter((i) => categories.includes(i.category) && isActive(i));
  if (relevant.some((i) => i.severity === 'critical' || i.severity === 'error')) return 'fail';
  return relevant.length ? 'warn' : 'pass';
}

function servingBasis({ locale, status, record, automated }) {
  if (SOURCE_LOCALES.includes(locale)) return 'authored-source';
  if (status === 'approved') return 'native-reviewed';
  if (record?.status === 'legacy-owner-approved' && automated.valid) return 'legacy-owner-approved';
  return null;
}

// --- Public API ---------------------------------------------------------------------

// options (all optional; defaults read the repository): overlay, glossary,
// rules, contentRules, sources, record, fingerprint, thresholds.
export function evaluateLocalizedPlan(plan, locale, options = {}) {
  const ctx = { ...defaultContext(plan, locale, options), ...options };
  const thresholds = { ...DEFAULT_QUALITY_THRESHOLDS, ...(options.thresholds || {}) };
  const { findings } = checkLocalizedPlan(plan, locale, ctx);
  const { record, issues: recordIssues } = recordState(ctx.record, ctx.fingerprint);
  const review = record?.status === 'human-reviewed' ? record.review : null;
  const accepted = acceptedBy(review);
  const issues = [...findings, ...recordIssues].map(classifyIssue).map((issue) => (accepted(issue) ? { ...issue, accepted: true } : issue));
  const verdict = decideQuality({ issues, review, thresholds });
  const source = SOURCE_LOCALES.includes(locale);
  return {
    planId: plan.id,
    locale,
    status: verdict.status,
    automated: verdict.automated,
    servingBasis: servingBasis({ locale, status: verdict.status, record, automated: verdict.automated }),
    score: verdict.score ? verdict.score : { overall: null, ...Object.fromEntries(QUALITY_DIMENSIONS.map((d) => [d, null])) },
    ceilings: verdict.ceilings,
    meetsPreferred: verdict.meetsPreferred,
    failures: verdict.failures,
    stages: {
      validPlan: Array.isArray(plan.days) && plan.days.length > 0 ? 'pass' : 'fail',
      integrity: stageOf(issues, ['integrity']),
      linguistic: stageOf(issues, ['linguistic', 'editorial']),
      christianLanguage: stageOf(issues, ['christianLanguage', 'prayerAuthenticity']),
      theology: stageOf(issues, ['theology']),
      pastoralSafety: stageOf(issues, ['pastoralSafety']),
      nativeReview: source ? 'not-required' : review ? verdict.status : record ? 'legacy' : 'pending',
      signoffs: isPlanReviewed(plan) ? 'pass' : 'pending',
    },
    issues,
  };
}

export function evaluatePlanQuality(plan, options = {}) {
  const { locales = LANG_CODES, perLocale = {}, ...shared } = options;
  const results = Object.fromEntries(locales.map((locale) => [
    locale, evaluateLocalizedPlan(plan, locale, { ...shared, ...(perLocale[locale] || {}) }),
  ]));
  const served = overlayLanguages(plan);
  const byStatus = (status) => locales.filter((l) => results[l].status === status);
  return {
    planId: plan.id,
    version: plan.version ?? null,
    theologyProfile: plan.theologyProfile ?? null,
    locales: results,
    servedOverlays: Object.fromEntries(served.map((lang) => [lang, results[lang]?.servingBasis ?? null])),
    summary: { approved: byStatus('approved'), needsReview: byStatus('needs-review'), rejected: byStatus('rejected') },
  };
}
