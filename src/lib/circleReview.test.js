import { describe, expect, it } from 'vitest';
import { canShowCircleDeep, DEEP_LAYER_LANGS, isCircleDeepDraft, isCircleDeepReviewed } from './circleReview';
import { CIRCLE_DEEP_REVIEWS } from '../content/intercessionCircles/review';
import { hasDeepLayer } from '../content/intercessionCircles';
import { CIRCLES } from './circles';

const signed = (reviewer = 'A. Reviewer') => ({ status: 'approved', reviewer, reviewedAt: '2026-10-07' });
const approved = () => ({
  status: 'approved',
  theology: signed(),
  safety: signed(),
  locales: Object.fromEntries(DEEP_LAYER_LANGS.map((lang) => [lang, signed()])),
});

describe('the deep-layer review gate', () => {
  it('keeps a draft hidden outside review mode', () => {
    const reviews = { self: { status: 'pending' } };
    expect(canShowCircleDeep('self', { preview: false, reviews })).toBe(false);
    expect(canShowCircleDeep('self', { preview: true, reviews })).toBe(true);
    expect(isCircleDeepDraft('self', reviews)).toBe(true);
  });

  it('shows a signed layer to everyone', () => {
    const reviews = { self: approved() };
    expect(canShowCircleDeep('self', { preview: false, reviews })).toBe(true);
    expect(isCircleDeepDraft('self', reviews)).toBe(false);
  });

  it('needs theology, safety and every authored language signed by a named person on a real date', () => {
    expect(isCircleDeepReviewed(approved())).toBe(true);
    expect(isCircleDeepReviewed({ ...approved(), safety: null })).toBe(false);
    expect(isCircleDeepReviewed({ ...approved(), locales: { en: signed() } })).toBe(false);
    expect(isCircleDeepReviewed({ ...approved(), theology: signed('  ') })).toBe(false);
    expect(isCircleDeepReviewed({ ...approved(), theology: { ...signed(), reviewedAt: '2026-02-30' } })).toBe(false);
    expect(isCircleDeepReviewed({ ...approved(), status: 'pending' })).toBe(false);
  });

  it('never shows a deep layer that does not exist, even in review mode', () => {
    for (const circle of CIRCLES.filter((c) => !hasDeepLayer(c))) {
      expect(canShowCircleDeep(circle, { preview: true, reviews: { [circle]: approved() } })).toBe(false);
    }
    expect(canShowCircleDeep('galaxies', { preview: true })).toBe(false);
  });

  it('has a record for every deep layer, and any approval carries real evidence', () => {
    for (const circle of CIRCLES.filter(hasDeepLayer)) {
      const review = CIRCLE_DEEP_REVIEWS[circle];
      expect(review, circle).toBeTruthy();
      // An "approved" status without every dated, named sign-off is a mistake —
      // and only a human reviewer may ever write one.
      if (review.status === 'approved') expect(isCircleDeepReviewed(review), circle).toBe(true);
    }
  });
});
