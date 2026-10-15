// Turns a reviewer's downloaded review file into plan-quality records
// (docs/PRAYER_PLAN_QUALITY.md § How a language is approved). Pure: the CLI
// (scripts/import-plan-review.mjs) reads and writes the files.
//
// Every score comes from the reviewer's own file. A review counts only for the
// exact translation the reviewer read: if the overlay or the plan version has
// changed since the page was generated, that plan's review is refused.
const SOURCE_LOCALES = ['en', 'fr'];
const HASH = /^[a-f0-9]{64}$/;

export function parsePlanReviewFile(value) {
  if (value?.kind !== 'qetoret-plan-review' || value.version !== 1) throw new Error('Not a Qetoret plan review file.');
  const problems = [];
  if (typeof value.lang !== 'string' || SOURCE_LOCALES.includes(value.lang)) problems.push('Invalid language.');
  if (!value.reviewer || typeof value.reviewer !== 'object') problems.push('Missing reviewer.');
  if (!Array.isArray(value.reviews)) problems.push('Missing reviews.');
  for (const review of value.reviews || []) {
    const valid = typeof review?.planId === 'string' && HASH.test(review.overlayHash ?? '') && HASH.test(review.sourceHash ?? '')
      && (review.scores === null || typeof review.scores === 'object')
      && Array.isArray(review.acceptedIssues) && Array.isArray(review.suggestions);
    if (!valid) problems.push(`Malformed review entry: ${review?.planId ?? '?'}.`);
  }
  if (problems.length) throw new Error(problems.join(' '));
  return value;
}

// → { records, recorded, unscored, rejected }. `pairs` and `fingerprintOf` come
// from planQualityAudit.loadPlanQuality; `evidence` names the archived file.
export function planReviewRecords(file, { pairs, fingerprintOf, reviewProblems, evidence }) {
  const translated = new Set(pairs.filter((pair) => pair.lang === file.lang).map((pair) => pair.planId));
  const result = { records: {}, recorded: [], unscored: [], rejected: [] };
  for (const entry of file.reviews) {
    const reject = (reason) => result.rejected.push({ planId: entry.planId, reason });
    if (!translated.has(entry.planId)) { reject(`there is no ${file.lang} translation of this plan`); continue; }
    if (!entry.scores) { result.unscored.push(entry.planId); continue; }
    const current = fingerprintOf(entry.planId, file.lang);
    if (entry.overlayHash !== current.overlayHash || entry.contentVersion !== current.contentVersion) {
      reject('the translation changed after this review page was generated: build a new page and ask for a new review');
      continue;
    }
    const review = {
      ...entry.scores,
      reviewer: file.reviewer,
      acceptedIssues: entry.acceptedIssues,
      ...(entry.notes ? { notes: entry.notes } : {}),
    };
    const problems = reviewProblems(review);
    if (problems.length) { reject(problems.join(' ')); continue; }
    result.records[`${file.lang}/${entry.planId}`] = {
      status: 'human-reviewed',
      contentVersion: entry.contentVersion,
      overlayHash: entry.overlayHash,
      // What the reviewer read: a later source edit is then flagged, not hidden.
      sourceHash: entry.sourceHash,
      review,
      evidence,
    };
    result.recorded.push(entry.planId);
  }
  return result;
}
