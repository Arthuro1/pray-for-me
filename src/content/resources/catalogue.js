// The curated external-resource catalogue behind "Go deeper".
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY PUBLICATION AND LINK VERIFICATION ARE SEPARATE GATES
// ─────────────────────────────────────────────────────────────────────────────
// Recommending a book or a teaching to someone praying about marriage is a
// pastoral act, so publication is gated on a human:
//
//   • Only `status: 'approved'` entries are eligible (src/lib/resources.js drops
//     everything else). Sensitive entries additionally require explicit content
//     and safety sign-offs, and every rendered edition requires a verified date
//     and usable HTTPS URL.
//   • Approved entries below retain their prior editorial status, while their
//     current editions point to official publisher/ministry pages verified on
//     the recorded date. No title, edition, ISBN or locale is invented.
//   • New or unverified entries remain a curation worksheet until a human checks
//     the content and canonical link. If nothing qualifies, the app shows no
//     "Go deeper" section; external material is never load-bearing.
//
// ─────────────────────────────────────────────────────────────────────────────
// MULTILINGUAL SHAPE
// ─────────────────────────────────────────────────────────────────────────────
// `editions` is keyed by language. A language is present ONLY when a real
// edition in that language has been verified. Locales are NOT expected to match:
// a German reader may get a completely different, German-authored resource on
// the same topic, and that is preferred over a translation. See §fallback in
// src/lib/resources.js for how a reader's language, their explicitly enabled
// fallback languages, and the entry's original language are ranked.
//
// Entry shape:
//   id                  stable id, referenced by replacementResourceId
//   type                one of RESOURCE_TYPES
//   originalLanguage    the language it was written/produced in
//   topics              RESOURCE_TOPICS ids
//   lifeStages          who it actually helps
//   status              draft | needs_review | approved | retired
//   reviewLevel         standard | sensitive (standard when omitted)
//   contentReview       { status: 'approved', reviewedBy, reviewedAt }
//   safetyReview        { status: 'approved', reviewedBy, reviewedAt }
//                       Both are mandatory for sensitive material. `approved`
//                       status alone can never publish a sensitive entry.
//   replacementResourceId  set when retiring something that has a successor
//   description         Pray4Me-authored, one sentence, why it fits — localized
//                       like the rest of our content ({ en, fr, ... })
//   editions            { <lang>: { title, author, publisher, url, available,
//                                   lastVerifiedAt, thumbnail } }
//
// `thumbnail` is OPTIONAL and must be a path to a cover file we host ourselves
// (public/resources/covers/…). Never a publisher's or a retailer's image URL:
// loading one would tell that host the reader's IP and which subject they are
// praying about, before they tap anything. Leave it out and the card draws a
// calm generated tile instead — see src/lib/resourceThumbnail.js.
import { RESOURCE_TOPICS, LIFE_STAGES, RESOURCE_TYPES, RESOURCE_STATUSES, RESOURCE_REVIEW_LEVELS } from './topics';

export { RESOURCE_TOPICS, LIFE_STAGES, RESOURCE_TYPES, RESOURCE_STATUSES, RESOURCE_REVIEW_LEVELS };

export const RESOURCES = [
  {
    id: 'piper-momentary-marriage',
    type: 'book',
    originalLanguage: 'en',
    topics: ['marriage', 'covenant', 'spiritual-formation'],
    lifeStages: ['single', 'engaged', 'married'],
    // Sensitive: publication waits on a `contentReview` and a `safetyReview`.
    // Marking it `approved` without them is a status that never takes effect —
    // the resolver drops the entry either way.
    status: 'approved',
    reviewLevel: 'sensitive',
    contentReview: {
      status: 'approved',
      reviewedBy: 'Paul',
      reviewedAt: '2026-08-26',
    },
    safetyReview: {
      status: 'approved',
      reviewedBy: 'Paul',
      reviewedAt: '2026-08-26',
    },
    description: {
      en: 'Reads marriage as a picture of Christ’s covenant love rather than a route to personal fulfilment.',
      fr: "Lit le mariage comme une image de l'amour d'alliance du Christ plutôt que comme une voie vers l'épanouissement personnel.",
    },
    editions: {
      en: { title: 'This Momentary Marriage', author: 'John Piper', publisher: 'Crossway', url: 'https://www.crossway.org/books/this-momentary-marriage-tpb/', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
  {
    id: 'keller-meaning-of-marriage',
    type: 'book',
    originalLanguage: 'en',
    topics: ['marriage', 'covenant', 'communication', 'character'],
    lifeStages: ['single', 'dating', 'engaged', 'married'],
    status: 'approved',
    reviewLevel: 'sensitive',
    contentReview: {
      status: 'approved',
      reviewedBy: 'Paul',
      reviewedAt: '2026-08-26',
    },
    safetyReview: {
      status: 'approved',
      reviewedBy: 'Paul',
      reviewedAt: '2026-08-26',
    },
    description: {
      en: 'Works through commitment, service and friendship in marriage, with a chapter written for single readers.',
      fr: "Parcourt l'engagement, le service et l'amitié dans le mariage, avec un chapitre écrit pour les lecteurs célibataires.",
    },
    editions: {
      en: { title: 'The Meaning of Marriage', author: 'Timothy Keller with Kathy Keller', publisher: 'Penguin Books', url: 'https://www.penguinrandomhouse.com/books/309809/the-meaning-of-marriage-by-timothy-keller-with-kathy-keller/', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
  {
    id: 'allberry-7-myths-singleness',
    type: 'book',
    originalLanguage: 'en',
    topics: ['singleness', 'identity', 'contentment', 'community'],
    lifeStages: ['single'],
    status: 'approved',
    reviewLevel: 'sensitive',
    contentReview: {
      status: 'approved',
      reviewedBy: 'Paul',
      reviewedAt: '2026-08-26',
    },
    safetyReview: {
      status: 'approved',
      reviewedBy: 'Paul',
      reviewedAt: '2026-08-26',
    },
    description: {
      en: 'Takes apart the assumptions that make singleness feel like a waiting room.',
      fr: "Démonte les idées reçues qui font du célibat une salle d'attente.",
    },
    editions: {
      en: { title: '7 Myths About Singleness', author: 'Sam Allberry', publisher: 'Crossway', url: 'https://www.crossway.org/books/7-myths-about-singleness-tpb/', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
  {
    id: 'danylak-redeeming-singleness',
    type: 'book',
    originalLanguage: 'en',
    topics: ['singleness', 'contentment', 'spiritual-formation'],
    lifeStages: ['single'],
    status: 'approved',
    description: {
      en: 'A biblical-theology treatment of singleness, from the Old Testament promise of offspring to the New Testament church.',
      fr: "Une théologie biblique du célibat, de la promesse d'une descendance dans l'Ancien Testament à l'Église du Nouveau.",
    },
    editions: {
      en: { title: 'Redeeming Singleness', author: 'Barry Danylak', publisher: 'Crossway', url: 'https://www.crossway.org/books/redeeming-singleness-tpb/', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
  {
    id: 'tripp-what-did-you-expect',
    type: 'book',
    originalLanguage: 'en',
    topics: ['marriage', 'conflict', 'forgiveness', 'communication'],
    lifeStages: ['engaged', 'married'],
    status: 'approved',
    description: {
      en: 'On what two sinners actually owe each other: confession, forgiveness and daily repair.',
      fr: 'Sur ce que deux pécheurs se doivent réellement : la confession, le pardon et la réparation quotidienne.',
    },
    editions: {
      en: { title: 'What Did You Expect?', author: 'Paul David Tripp', publisher: 'Crossway', url: 'https://www.crossway.org/books/what-did-you-expect-ebook/', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
  {
    id: 'lane-tripp-how-people-change',
    type: 'book',
    originalLanguage: 'en',
    topics: ['character', 'healing', 'spiritual-formation'],
    lifeStages: ['single', 'dating', 'engaged', 'married'],
    status: 'approved',
    description: {
      en: 'How change actually happens in a Christian — useful for anyone praying about their own character.',
      fr: 'Comment le changement se produit réellement chez un chrétien — utile à quiconque prie pour son propre caractère.',
    },
    editions: {
      en: { title: 'How People Change', author: 'Timothy S. Lane and Paul David Tripp', publisher: 'New Growth Press', url: 'https://newgrowthpress.com/christian-books/biblical-counseling-books/how-people-change/', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
  {
    id: 'welch-when-people-are-big',
    type: 'book',
    originalLanguage: 'en',
    topics: ['identity', 'character', 'healing'],
    lifeStages: ['single', 'dating', 'engaged', 'married'],
    status: 'approved',
    description: {
      en: 'On the fear of other people, and why being chosen can never settle who you are.',
      fr: "Sur la peur des autres, et pourquoi être choisi ne pourra jamais dire qui tu es.",
    },
    editions: {
      en: { title: 'When People Are Big and God Is Small, Second Edition', author: 'Edward T. Welch', publisher: 'P&R Publishing', url: 'https://www.prpbooks.com/book/when-people-are-big-and-god-is-small-second-edition', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
  {
    id: 'cloud-townsend-boundaries-dating',
    type: 'book',
    originalLanguage: 'en',
    topics: ['dating', 'discernment', 'character'],
    lifeStages: ['single', 'dating'],
    status: 'approved',
    description: {
      en: 'Practical wisdom on healthy limits while getting to know someone.',
      fr: "Sagesse pratique sur les limites saines quand on apprend à connaître quelqu'un.",
    },
    editions: {
      en: { title: 'Boundaries in Dating', author: 'Henry Cloud and John Townsend', publisher: 'Zondervan', url: 'https://faithgateway.com/products/boundaries-in-dating-how-healthy-choices-grow-healthy-relationships?variant=13762905571439', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
  {
    id: 'elliot-passion-and-purity',
    type: 'book',
    originalLanguage: 'en',
    topics: ['purity', 'contentment', 'singleness'],
    lifeStages: ['single', 'dating'],
    status: 'approved',
    reviewLevel: 'sensitive',
    contentReview: {
      status: 'approved',
      reviewedBy: 'Paul',
      reviewedAt: '2026-08-26',
    },
    safetyReview: {
      status: 'approved',
      reviewedBy: 'Paul',
      reviewedAt: '2026-08-26',
    },
    description: {
      en: 'A personal account of bringing romantic desire under Christ’s authority over many years of waiting.',
      fr: "Un récit personnel : soumettre le désir amoureux à l'autorité du Christ au fil de longues années d'attente.",
    },
    editions: {
      en: { title: 'Passion and Purity', author: 'Elisabeth Elliot', publisher: 'Revell', url: 'https://bakerpublishinggroup.com/products/9780800746667_passion-and-purity', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
  {
    id: 'ortlund-gentle-and-lowly',
    type: 'book',
    originalLanguage: 'en',
    topics: ['healing', 'identity', 'spiritual-formation'],
    lifeStages: ['single', 'dating', 'engaged', 'married'],
    status: 'approved',
    description: {
      en: 'On the heart of Christ towards the hurting — a good companion for the healing days of this plan.',
      fr: 'Sur le cœur du Christ envers ceux qui souffrent — un bon compagnon pour les jours de guérison de ce parcours.',
    },
    editions: {
      en: { title: 'Gentle and Lowly', author: 'Dane C. Ortlund', publisher: 'Crossway', url: 'https://www.crossway.org/books/gentle-and-lowly-hcj/', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
  {
    id: 'dg-ask-pastor-john',
    type: 'podcast',
    originalLanguage: 'en',
    topics: ['singleness', 'purity', 'marriage', 'discernment'],
    lifeStages: ['single', 'dating', 'engaged', 'married'],
    status: 'needs_review',
    reviewLevel: 'sensitive',
    description: {
      en: 'Short question-and-answer episodes, many of them on singleness, dating and purity.',
      fr: 'De courts épisodes de questions-réponses, dont beaucoup portent sur le célibat, les fréquentations et la pureté.',
    },
    editions: {
      en: { title: 'Ask Pastor John', author: 'John Piper', publisher: 'Desiring God', url: 'https://www.desiringgod.org/ask-pastor-john', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
];

export default RESOURCES;
