// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LANG_CODES } from '../i18n';
import {
  canUsePlan, hasReviewSignoff, isPlanPreviewOn, isPlanReviewed, setPlanPreview, syncPlanPreviewFromUrl,
} from './planReview';

const signoff = { status: 'approved', reviewer: 'named-reviewer', reviewedAt: '2026-08-26' };
const reviewed = {
  lifeStage: 'engaged',
  review: {
    status: 'approved', theology: signoff, safety: signoff,
    locales: Object.fromEntries(LANG_CODES.map((lang) => [lang, signoff])),
  },
};
const pending = { lifeStage: 'married', review: { status: 'needs_review' } };

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
    expect(canUsePlan(pending, { preview: false })).toBe(false);
    expect(canUsePlan(pending, { preview: true })).toBe(true);
  });
});

// Review mode is how a human reads a draft in order to correct it. It is a
// device setting: it must never make a plan look reviewed, and must never leak
// to a reader who did not ask for it.
describe('review mode', () => {
  beforeEach(() => { localStorage.clear(); vi.stubEnv('DEV', false); });
  afterEach(() => { localStorage.clear(); vi.unstubAllEnvs(); });

  it('is off until someone asks for it, and a production build honours that', () => {
    expect(isPlanPreviewOn()).toBe(false);
    expect(canUsePlan(pending)).toBe(false);
  });

  it('opens draft plans on the device that pasted the link, and closes them again', () => {
    expect(syncPlanPreviewFromUrl('?planPreview=1')).toBe(true);
    expect(canUsePlan(pending)).toBe(true);

    expect(syncPlanPreviewFromUrl('?planPreview=0')).toBe(false);
    expect(canUsePlan(pending)).toBe(false);
  });

  it('leaves an unrelated query string alone', () => {
    setPlanPreview(true);
    expect(syncPlanPreviewFromUrl('?action=install')).toBe(true);
    expect(syncPlanPreviewFromUrl('')).toBe(true);
  });

  it('never reports a draft as reviewed', () => {
    setPlanPreview(true);
    expect(isPlanReviewed(pending)).toBe(false);
    expect(isPlanReviewed(reviewed)).toBe(true);
  });
});
