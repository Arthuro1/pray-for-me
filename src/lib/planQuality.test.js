import { describe, expect, it } from 'vitest';
import {
  DEFAULT_QUALITY_THRESHOLDS, DIMENSION_CRITERIA, ISSUE_CODES, PATTERN_CODES, QUALITY_DIMENSIONS, SEVERITY_CEILING,
  classifyIssue, decideQuality, dimensionScore, evaluateLocalizedPlan, evaluatePlanQuality, reviewProblems,
} from './planQuality';
import { theologyProfile } from '../content/theologyProfiles';

const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);
const fingerprint = { contentVersion: 1, overlayHash: HASH_A, sourceHash: HASH_B };

const plan = {
  id: 'qualityTest',
  version: 1,
  theologyProfile: theologyProfile(),
  intro: { en: 'Seven days to bring your worries to God and leave them with him.', fr: 'Sept jours pour confier tes soucis à Dieu et les lui laisser.' },
  days: [1, 2].map((n) => ({
    theme: { en: `Day ${n}`, fr: `Jour ${n}`, de: `Tag ${n}` },
    ref: 'Philippians 4:6-7',
    reflection: { en: `Paul invites us to bring every worry to God, day ${n}.`, fr: `Paul nous invite à apporter chaque souci à Dieu, jour ${n}.` },
    prompts: [{ en: 'Lord, I bring you what weighs on me.', fr: 'Seigneur, je t’apporte ce qui me pèse.' }],
  })),
};
const overlay = {
  intro: 'Sieben Tage, um deine Sorgen zu Gott zu bringen und sie bei ihm zu lassen.',
  days: [
    { reflection: 'Paulus lädt uns ein, jede Sorge zu Gott zu bringen – Tag 1.', prompts: ['Herr, ich bringe dir, was mich belastet.'] },
    { reflection: 'Paulus lädt uns ein, jede Sorge zu Gott zu bringen – Tag 2.', prompts: ['Herr, ich bringe dir, was mich bedrückt.'] },
  ],
};
const reviewer = { name: 'Native reviewer', reviewedAt: '2026-10-12', nativeSpeaker: true, christianReview: true };
const fullReview = (score = 5, extra = {}) => ({
  linguistic: { grammar: score, naturalness: score, idiomaticity: score, register: score },
  christianLanguage: { terminology: score, prayerRegister: score, biblicalVocabulary: score, theologicalPrecision: score },
  prayerAuthenticity: score,
  theology: { biblicalFidelity: score, doctrinalAccuracy: score, audienceFit: score, godClaims: score },
  pastoralSafety: score,
  editorial: { clarity: score, consistency: score, repetition: score },
  reviewer,
  ...extra,
});
const humanRecord = (review) => ({ status: 'human-reviewed', ...fingerprint, review });
const issue = (code, extra = {}) => classifyIssue({ code, location: 'day-1.reflection', message: 'm', ...extra });

describe('the quality model', () => {
  it('gives every issue code a known category and severity', () => {
    const categories = [...QUALITY_DIMENSIONS, 'integrity', 'review'];
    for (const [code, spec] of Object.entries(ISSUE_CODES)) {
      expect(code).toMatch(/^[A-Z][A-Z_]+$/);
      expect(categories, code).toContain(spec.category);
      expect(Object.keys(SEVERITY_CEILING), code).toContain(spec.severity);
    }
    for (const code of PATTERN_CODES) expect(ISSUE_CODES[code], code).toBeTruthy();
    for (const dimension of QUALITY_DIMENSIONS) expect(DIMENSION_CRITERIA[dimension].length).toBeGreaterThan(0);
  });

  it('refuses an unknown code rather than guessing its weight', () => {
    expect(() => classifyIssue({ code: 'NOT_A_CODE', location: 'x', message: 'm' })).toThrow(/Unknown/);
  });

  it('scores a dimension from one number or the mean of its criteria', () => {
    expect(dimensionScore(4)).toBe(4);
    expect(dimensionScore({ grammar: 5, naturalness: 4 })).toBe(4.5);
    expect(dimensionScore({ grammar: 6 })).toBeNull();
    expect(dimensionScore({})).toBeNull();
    expect(dimensionScore(undefined)).toBeNull();
  });

  it('allows qualified claims and negated safeguards, but never qualified speaking-for-God', () => {
    expect(issue('GUARANTEED_HEALING', { qualified: true }).severity).toBe('info');
    expect(issue('GUARANTEED_HEALING').severity).toBe('critical');
    expect(issue('GOD_SPEAKS_FOR_READER', { qualified: true }).severity).toBe('critical');
    expect(issue('ABUSE_ENDANGERMENT', { negated: true }).severity).toBe('info');
  });
});

describe('the verdict', () => {
  it('is needs-review without a human review, however clean the automated result', () => {
    const verdict = decideQuality({ issues: [] });
    expect(verdict.status).toBe('needs-review');
    expect(verdict.automated.valid).toBe(true);
    expect(verdict.score).toBeNull();
  });

  it('approves a complete review that meets every threshold', () => {
    const verdict = decideQuality({ issues: [], review: fullReview(5) });
    expect(verdict.status).toBe('approved');
    expect(verdict.score.overall).toBe(5);
    expect(verdict.meetsPreferred).toBe(true);
  });

  it('rejects any critical safety or theology finding, regardless of the scores', () => {
    for (const code of ['GUARANTEED_MARRIAGE', 'GOD_SPEAKS_FOR_READER', 'SUFFERING_BLAME']) {
      const verdict = decideQuality({ issues: [issue(code)], review: fullReview(5) });
      expect(verdict.status, code).toBe('rejected');
      expect(verdict.automated.valid, code).toBe(false);
    }
  });

  it('never lets strong dimensions average away a weak critical one', () => {
    // 5, 5, 5, 5, 3, 5 averages 4.67 — above the overall target — and still fails.
    const verdict = decideQuality({ issues: [], review: fullReview(5, { pastoralSafety: 3 }) });
    expect(verdict.score.overall).toBeGreaterThan(DEFAULT_QUALITY_THRESHOLDS.minimumOverall);
    expect(verdict.status).toBe('rejected');
    expect(verdict.failures.join(' ')).toMatch(/pastoralSafety 3 < 4 \(critical\)/);
  });

  it('holds non-critical dimensions to a floor', () => {
    const verdict = decideQuality({ issues: [], review: fullReview(5, { linguistic: 2.5 }) });
    expect(verdict.status).toBe('rejected');
    expect(verdict.failures.join(' ')).toMatch(/linguistic 2.5 < 3/);
  });

  it('lets an automated finding cap a reviewer score, never raise it', () => {
    const verdict = decideQuality({ issues: [issue('TERM_INCONSISTENCY')], review: fullReview(5) });
    expect(verdict.score.christianLanguage).toBe(4);
    expect(verdict.score.overall).toBe(4.83);
    expect(verdict.status).toBe('approved');
    const capped = decideQuality({ issues: [issue('TERM_AVOIDED')], review: fullReview(5) });
    expect(capped.score.christianLanguage).toBe(3);
    expect(capped.status).toBe('rejected');
  });

  it('ignores a finding the reviewer accepted with a reason', () => {
    const accepted = { ...issue('TERM_AVOIDED'), accepted: true };
    expect(decideQuality({ issues: [accepted], review: fullReview(5) }).status).toBe('approved');
  });

  it('treats an integrity error as blocking', () => {
    expect(decideQuality({ issues: [issue('PLACEHOLDER_MISMATCH')], review: fullReview(5) }).status).toBe('rejected');
  });

  it('distinguishes the minimum from the preferred overall score', () => {
    const verdict = decideQuality({ issues: [], review: fullReview(4.25) });
    expect(verdict.status).toBe('approved');
    expect(verdict.meetsPreferred).toBe(false);
  });

  it('takes configurable thresholds', () => {
    const strict = { ...DEFAULT_QUALITY_THRESHOLDS, minimumOverall: 4.8 };
    expect(decideQuality({ issues: [], review: fullReview(4.5), thresholds: strict }).status).toBe('rejected');
    expect(decideQuality({ issues: [], review: fullReview(4.5) }).status).toBe('approved');
  });
});

describe('native-Christian review records', () => {
  it('list what a review lacks', () => {
    expect(reviewProblems(fullReview(5))).toEqual([]);
    expect(reviewProblems({ ...fullReview(5), reviewer: { ...reviewer, nativeSpeaker: false } }).join(' ')).toMatch(/nativeSpeaker/);
    expect(reviewProblems({ ...fullReview(5), editorial: undefined }).join(' ')).toMatch(/editorial/);
    expect(reviewProblems({ ...fullReview(5), linguistic: { grammer: 5 } }).join(' ')).toMatch(/unknown criteria grammer/);
    expect(reviewProblems({ ...fullReview(5), reviewer: { ...reviewer, tradition: 'unknown' } }).join(' ')).toMatch(/tradition/);
    expect(reviewProblems({ ...fullReview(5), acceptedIssues: [{ code: 'TERM_AVOIDED', location: 'day-1.reflection' }] }).join(' ')).toMatch(/reason/);
  });
});

describe('evaluateLocalizedPlan', () => {
  const evaluate = (options) => evaluateLocalizedPlan(plan, 'de', { overlay, fingerprint, record: null, ...options });

  it('separates automatically valid from human-reviewed and approved', () => {
    const result = evaluate();
    expect(result.automated.valid).toBe(true);
    expect(result.status).toBe('needs-review');
    expect(result.servingBasis).toBeNull();
    expect(result.score.overall).toBeNull();
    expect(result.stages).toMatchObject({ integrity: 'pass', nativeReview: 'pending' });
  });

  it('approves and serves an overlay with a complete, current native review', () => {
    const result = evaluate({ record: humanRecord(fullReview(5)) });
    expect(result.status).toBe('approved');
    expect(result.servingBasis).toBe('native-reviewed');
    expect(result.stages.nativeReview).toBe('approved');
  });

  it('voids a review when the reviewed overlay changes', () => {
    const result = evaluate({ record: { ...humanRecord(fullReview(5)), overlayHash: HASH_B } });
    expect(result.status).toBe('needs-review');
    expect(result.servingBasis).toBeNull();
    expect(result.issues.map((i) => i.code)).toContain('REVIEW_STALE');
  });

  it('keeps a review when only the English source changed, flagged for the reviewer', () => {
    const result = evaluate({ record: { ...humanRecord(fullReview(5)), sourceHash: HASH_A } });
    expect(result.status).toBe('approved');
    expect(result.issues.map((i) => i.code)).toContain('SOURCE_CHANGED_SINCE_REVIEW');
  });

  it('does not count an incomplete review', () => {
    const result = evaluate({ record: humanRecord({ ...fullReview(5), reviewer: { name: 'AI critic' } }) });
    expect(result.status).toBe('needs-review');
    expect(result.issues.map((i) => i.code)).toContain('REVIEW_INCOMPLETE');
  });

  it('serves a legacy overlay without calling it approved', () => {
    const result = evaluate({ record: { status: 'legacy-owner-approved', ...fingerprint } });
    expect(result.status).toBe('needs-review');
    expect(result.servingBasis).toBe('legacy-owner-approved');
    expect(result.stages.nativeReview).toBe('legacy');
  });

  it('rejects a guarantee introduced by a translation', () => {
    const risky = { ...overlay, days: [{ ...overlay.days[0], reflection: 'Gott wird dich ganz sicher heilen.' }, overlay.days[1]] };
    const result = evaluate({ overlay: risky, record: humanRecord(fullReview(5)) });
    expect(result.status).toBe('rejected');
    expect(result.servingBasis).toBeNull();
    expect(result.stages.pastoralSafety).toBe('fail');
  });

  it('reports the authored source as its own serving basis', () => {
    const result = evaluateLocalizedPlan(plan, 'en', { fingerprint });
    expect(result.servingBasis).toBe('authored-source');
    expect(result.stages.nativeReview).toBe('not-required');
  });

  it('evaluates a whole plan per locale', () => {
    const report = evaluatePlanQuality(plan, { locales: ['en', 'de'], perLocale: { de: { overlay, fingerprint } } });
    expect(Object.keys(report.locales)).toEqual(['en', 'de']);
    expect(report.summary.needsReview).toEqual(['en', 'de']);
    expect(report.theologyProfile.tradition).toBe('pentecostal-charismatic');
  });
});
