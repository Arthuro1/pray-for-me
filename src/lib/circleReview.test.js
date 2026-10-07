import { describe, expect, it } from 'vitest';
import {
  canShowCircleDeep, DEEP_LAYER_LANGS, isCircleDeepDraft, isCircleDeepReviewed, isCircleTranslationDraft, SHORT_LAYER_LANGS,
} from './circleReview';
import { CIRCLE_DEEP_REVIEWS, CIRCLE_TRANSLATION_REVIEWS } from '../content/intercessionCircles/review';
import { hasCircleOverlay, hasDeepLayer } from '../content/intercessionCircles';
import { CIRCLES } from './circles';
import { hasReviewSignoff } from './planReview';
import { LANG_CODES } from '../i18n';

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

describe('the short layer’s translations', () => {
  const others = LANG_CODES.filter((lang) => !SHORT_LAYER_LANGS.includes(lang));

  it('has a record for every AI-drafted language, and only for those', () => {
    expect(Object.keys(CIRCLE_TRANSLATION_REVIEWS).sort()).toEqual([...others].sort());
    for (const lang of others) expect(hasCircleOverlay(lang), lang).toBe(true);
  });

  // A machine draft is labelled as one; an "approved" record without a named
  // reviewer and a real date is a mistake — and only a human may write one.
  it('labels every unreviewed language as a draft, and never the authored ones', () => {
    for (const lang of others) {
      const record = CIRCLE_TRANSLATION_REVIEWS[lang];
      if (record.status === 'approved') expect(hasReviewSignoff(record), lang).toBe(true);
      else expect(record, lang).toEqual({ status: 'machine-draft', reviewer: null, reviewedAt: null });
      expect(isCircleTranslationDraft(lang), lang).toBe(!hasReviewSignoff(record));
    }
    for (const lang of SHORT_LAYER_LANGS) expect(isCircleTranslationDraft(lang), lang).toBe(false);
  });

  it('drops the label only for a named, dated sign-off', () => {
    const reviews = (record) => ({ de: record });
    expect(isCircleTranslationDraft('de', reviews({ status: 'approved', reviewer: 'A. Reviewer', reviewedAt: '2026-10-07' }))).toBe(false);
    expect(isCircleTranslationDraft('de', reviews({ status: 'approved', reviewer: '', reviewedAt: '2026-10-07' }))).toBe(true);
    expect(isCircleTranslationDraft('de', reviews({ status: 'approved', reviewer: 'A. Reviewer', reviewedAt: 'soon' }))).toBe(true);
    expect(isCircleTranslationDraft('de', reviews({ status: 'machine-draft', reviewer: null, reviewedAt: null }))).toBe(true);
    expect(isCircleTranslationDraft('de', {})).toBe(true);
  });
});
