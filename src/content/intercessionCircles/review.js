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
});
