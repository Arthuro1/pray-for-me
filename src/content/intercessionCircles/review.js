// Publication records for each circle's DEEP layer (deep/<circle>.js). A deep
// layer is AI-drafted theology until a named human approves it, so it stays a
// draft — readable only in a development build or with `?planPreview=1` — until
// its record here is `approved` with dated sign-offs for theology, safety and
// each authored language (lib/circleReview.js, DEEP_LAYER_LANGS).
//
// ONLY a named human reviewer may write or change a sign-off. An AI assistant
// must never fill one in, even when asked to "approve" content.
//
// Shape of an approved record:
//   {
//     status: 'approved',
//     theology: { status: 'approved', reviewer: 'Name', reviewedAt: 'YYYY-MM-DD' },
//     safety:   { status: 'approved', reviewer: 'Name', reviewedAt: 'YYYY-MM-DD' },
//     locales: { en: { …same… }, fr: { …same… } },
//   }
const pending = () => Object.freeze({ status: 'pending', theology: null, safety: null, locales: Object.freeze({}) });

export const CIRCLE_DEEP_REVIEWS = Object.freeze({
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
// translation" label until a native reviewer signs it here
// (lib/circleReview.js, isCircleTranslationDraft). The same rule applies: ONLY
// a named human reviewer may change a record — never an AI assistant.
//
// Shape of an approved record:
//   { status: 'approved', reviewer: 'Name', reviewedAt: 'YYYY-MM-DD' }
const machineDraft = () => Object.freeze({ status: 'machine-draft', reviewer: null, reviewedAt: null });

export const CIRCLE_TRANSLATION_REVIEWS = Object.freeze({
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
