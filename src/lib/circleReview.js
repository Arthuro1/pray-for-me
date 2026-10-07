// The publication gate for a circle's deep teaching layer — the same discipline
// as guided plans (lib/planReview.js): a draft is readable in a development
// build or in review mode (`?planPreview=1`, one switch for all drafts), and a
// production build shows it only once a named human has signed it.
import { hasReviewSignoff, isPlanPreviewOn } from './planReview';
import { CIRCLE_DEEP_REVIEWS, CIRCLE_TRANSLATION_REVIEWS } from '../content/intercessionCircles/review';
import { hasDeepLayer } from '../content/intercessionCircles';

// The deep layer is authored in these languages; every other language reads the
// English, so these are the only language sign-offs a deep layer needs.
export const DEEP_LAYER_LANGS = Object.freeze(['en', 'fr']);

export function isCircleDeepReviewed(review) {
  return review?.status === 'approved'
    && hasReviewSignoff(review.theology)
    && hasReviewSignoff(review.safety)
    && DEEP_LAYER_LANGS.every((lang) => hasReviewSignoff(review.locales?.[lang]));
}

export function canShowCircleDeep(
  circle,
  { preview = import.meta.env.DEV || isPlanPreviewOn(), reviews = CIRCLE_DEEP_REVIEWS } = {},
) {
  if (!hasDeepLayer(circle)) return false;
  return isCircleDeepReviewed(reviews[circle]) || preview === true;
}

// Is what canShowCircleDeep reveals still a draft? Drives the "review pending"
// label, so a reviewer always knows what they are reading.
export const isCircleDeepDraft = (circle, reviews = CIRCLE_DEEP_REVIEWS) => !isCircleDeepReviewed(reviews[circle]);

// The short layer is authored in these languages; the others are AI drafts.
export const SHORT_LAYER_LANGS = Object.freeze(['en', 'fr']);

// Is the short-layer teaching in `lang` still a machine draft? It ships (the
// landing must never mix languages), but says so with a visible "Draft
// translation" label until a native reviewer's dated, named sign-off exists.
export const isCircleTranslationDraft = (lang, reviews = CIRCLE_TRANSLATION_REVIEWS) => (
  !SHORT_LAYER_LANGS.includes(lang) && !hasReviewSignoff(reviews[lang])
);
