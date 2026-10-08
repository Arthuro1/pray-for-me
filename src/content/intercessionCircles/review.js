// Publication records for each circle's DEEP layer (deep/<circle>.js). A deep
// layer is AI-drafted theology until a named human approves it, so it stays a
// draft — readable only in a development build or with `?planPreview=1` — until
// its record here is `approved` with dated sign-offs for theology, safety and
// each authored language (lib/circleReview.js, DEEP_LAYER_LANGS).
//
// A sign-off must come from a named human. An assistant may faithfully record
// an explicit human approval and its provenance; it cannot invent one or claim
// that recording it is an independent review. Paul's dated owner approval is
// limited to the current presentation in reviews/paulCircles20261008.js.
//
// Shape of an approved record:
//   {
//     status: 'approved',
//     theology: { status: 'approved', reviewer: 'Name', reviewedAt: 'YYYY-MM-DD' },
//     safety:   { status: 'approved', reviewer: 'Name', reviewedAt: 'YYYY-MM-DD' },
//     locales: { en: { …same… }, fr: { …same… } },
//   }
import {
  PAUL_CIRCLE_APPROVAL, PAUL_CIRCLE_DEEP_APPROVALS, PAUL_CIRCLE_TRANSLATION_APPROVALS,
} from '../reviews/paulCircles20261008';

const pending = () => Object.freeze({ status: 'pending', theology: null, safety: null, locales: Object.freeze({}) });

const priorDeepReviews = Object.freeze({
  self: pending(),
  household: pending(),
  people: pending(),
  church: pending(),
  authorities: pending(),
  nations: pending(),
  kingdom: pending(),
});

// Records for the SHORT layer's translations (translations/<lang>.json). The
// short layer is authored in English and French beside the code; every other
// language is an AI draft, and its circle teaching carries a visible "Draft
// translation" label until a named human approves its presentation here
// (lib/circleReview.js, isCircleTranslationDraft). Publication approval does
// not establish a native-speaker audit; nativeLanguageReview remains false
// on Paul's explicit current-presentation approval.
//
// Shape of an approved record:
//   { status: 'approved', reviewer: 'Name', reviewedAt: 'YYYY-MM-DD' }
const machineDraft = () => Object.freeze({ status: 'machine-draft', reviewer: null, reviewedAt: null });

const priorTranslationReviews = Object.freeze({
  es: machineDraft(),
  pt: machineDraft(),
  de: machineDraft(),
  zh: machineDraft(),
  hi: machineDraft(),
  ja: machineDraft(),
  sw: machineDraft(),
  am: machineDraft(),
  id: machineDraft(),
  tl: machineDraft(),
  ko: machineDraft(),
  ru: machineDraft(),
  ar: machineDraft(),
  fa: machineDraft(),
});

// Retain the original pending/draft records without backdating or rewriting
// them. Only the closed lists in the new approval receive a current sign-off.
export const CIRCLE_REVIEW_HISTORY = Object.freeze([
  Object.freeze({
    supersededBy: PAUL_CIRCLE_APPROVAL.approvalId,
    deepReviews: priorDeepReviews,
    translationReviews: priorTranslationReviews,
  }),
]);

export const CIRCLE_DEEP_REVIEWS = Object.freeze({
  ...priorDeepReviews,
  ...PAUL_CIRCLE_DEEP_APPROVALS,
});

export const CIRCLE_TRANSLATION_REVIEWS = Object.freeze({
  ...priorTranslationReviews,
  ...PAUL_CIRCLE_TRANSLATION_APPROVALS,
});
