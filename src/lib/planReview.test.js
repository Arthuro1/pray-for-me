import { describe, expect, it } from 'vitest';
import { LANG_CODES } from '../i18n';
import { canUsePlan, hasReviewSignoff, isPlanReviewed } from './planReview';

const signoff = { status: 'approved', reviewer: 'named-reviewer', reviewedAt: '2026-08-26' };
const reviewed = {
  lifeStage: 'engaged',
  review: {
    status: 'approved', theology: signoff, safety: signoff,
    locales: Object.fromEntries(LANG_CODES.map((lang) => [lang, signoff])),
  },
};

describe('plan content release gate', () => {
  it('requires named, real-dated sign-offs', () => {
    expect(hasReviewSignoff(signoff)).toBe(true);
    expect(hasReviewSignoff({ ...signoff, reviewer: '' })).toBe(false);
    expect(hasReviewSignoff({ ...signoff, reviewedAt: '2026-02-31' })).toBe(false);
  });

  it('requires theology, safety, and every shipped locale', () => {
    expect(isPlanReviewed(reviewed)).toBe(true);
    const missingArabic = { ...reviewed, review: { ...reviewed.review, locales: { ...reviewed.review.locales, ar: undefined } } };
    expect(isPlanReviewed(missingArabic)).toBe(false);
    expect(isPlanReviewed({ ...reviewed, review: { ...reviewed.review, safety: null } })).toBe(false);
  });

  it('allows draft preview only through an explicit development switch', () => {
    const pending = { lifeStage: 'married', review: { status: 'needs_review' } };
    expect(canUsePlan(pending, { preview: false })).toBe(false);
    expect(canUsePlan(pending, { preview: true })).toBe(true);
  });
});
