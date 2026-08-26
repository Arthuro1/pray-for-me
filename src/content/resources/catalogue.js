// The curated external-resource catalogue behind "Go deeper".
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY EVERY ENTRY BELOW IS `needs_review`, AND WHY NONE HAS A URL
// ─────────────────────────────────────────────────────────────────────────────
// Recommending a book or a teaching to someone praying about marriage is a
// pastoral act, so publication is gated on a human:
//
//   • Only `status: 'approved'` entries are ever shown (src/lib/resources.js
//     drops everything else), and the resolver additionally requires a
//     `lastVerifiedAt` date on the edition's language before it will render.
//   • Titles and authors below are seeded as a CURATION WORKSHEET. Nothing here
//     was looked up at runtime and no URL, ISBN, publisher page or translated
//     edition has been invented to fill a locale: an edition that has not been
//     verified to exist simply is not listed. That is the rule for every future
//     entry too — see docs/RESOURCES.md.
//   • Until a curator verifies an entry, fills in its canonical URL and flips it
//     to `approved`, the app shows NO "Go deeper" section at all. The plan is
//     complete without it, which is the point: external material is
//     supplementary, never load-bearing.
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
//   replacementResourceId  set when retiring something that has a successor
//   description         Pray4Me-authored, one sentence, why it fits — localized
//                       like the rest of our content ({ en, fr, ... })
//   editions            { <lang>: { title, author, publisher, url, available,
//                                   lastVerifiedAt } }
import { RESOURCE_TOPICS, LIFE_STAGES, RESOURCE_TYPES, RESOURCE_STATUSES } from './topics';

export { RESOURCE_TOPICS, LIFE_STAGES, RESOURCE_TYPES, RESOURCE_STATUSES };

export const RESOURCES = [
  {
    id: 'piper-momentary-marriage',
    type: 'book',
    originalLanguage: 'en',
    topics: ['marriage', 'covenant', 'spiritual-formation'],
    lifeStages: ['single', 'engaged', 'married'],
    status: 'approved',
    description: {
      en: 'Reads marriage as a picture of Christ’s covenant love rather than a route to personal fulfilment.',
      fr: "Lit le mariage comme une image de l'amour d'alliance du Christ plutôt que comme une voie vers l'épanouissement personnel.",
    },
    editions: {
      en: { title: 'This Momentary Marriage', author: 'John Piper', publisher: 'Crossway', url: "https://www.amazon.com/This-Momentary-Marriage-Parable-Permanence/dp/1433531119", available: true, lastVerifiedAt: "26.08.2026" },
    },
  },
  {
    id: 'keller-meaning-of-marriage',
    type: 'book',
    originalLanguage: 'en',
    topics: ['marriage', 'covenant', 'communication', 'character'],
    lifeStages: ['single', 'dating', 'engaged', 'married'],
    status: 'approved',
    description: {
      en: 'Works through commitment, service and friendship in marriage, with a chapter written for single readers.',
      fr: "Parcourt l'engagement, le service et l'amitié dans le mariage, avec un chapitre écrit pour les lecteurs célibataires.",
    },
    editions: {
      en: { title: 'The Meaning of Marriage', author: 'Timothy Keller with Kathy Keller', publisher: 'Penguin', url: "https://www.amazon.com/Meaning-Marriage-Facing-Complexities-Commitment/dp/1594631875", available: true, lastVerifiedAt: "26.08.2026" },
    },
  },
  {
    id: 'allberry-7-myths-singleness',
    type: 'book',
    originalLanguage: 'en',
    topics: ['singleness', 'identity', 'contentment', 'community'],
    lifeStages: ['single'],
    status: 'approved',
    description: {
      en: 'Takes apart the assumptions that make singleness feel like a waiting room.',
      fr: "Démonte les idées reçues qui font du célibat une salle d'attente.",
    },
    editions: {
      en: { title: '7 Myths About Singleness', author: 'Sam Allberry', publisher: 'Crossway', url: "https://www.amazon.com/Myths-about-Singleness-Sam-Allberry/dp/1433561522", available: true, lastVerifiedAt: "26.08.2026" },
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
      en: { title: 'Redeeming Singleness', author: 'Barry Danylak', publisher: 'Crossway', url: "https://www.amazon.com/Redeeming-Singleness-Storyline-Scripture-Affirms/dp/1433505886", available: true, lastVerifiedAt: "26.08.2026" },
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
      en: { title: 'What Did You Expect?', author: 'Paul David Tripp', publisher: 'Crossway', url: "https://www.amazon.com/-/de/dp/143354945X/ref=sr_1_1?__mk_de_DE=%C3%85M%C3%85%C5%BD%C3%95%C3%91&s=books&sr=1-1", available: true, lastVerifiedAt: "26.08.2026" },
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
      en: { title: 'How People Change', author: 'Timothy S. Lane and Paul David Tripp', publisher: 'New Growth Press', url: "https://www.amazon.com/-/de/dp/1934885533/ref=sr_1_1?__mk_de_DE=%C3%85M%C3%85%C5%BD%C3%95%C3%91&s=books&sr=1-1", available: true, lastVerifiedAt: "26.08.2026" },
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
      en: { title: 'When People Are Big and God Is Small', author: 'Edward T. Welch', publisher: 'P&R Publishing', url: "https://www.amazon.com/-/de/dp/1629958077/ref=sr_1_1?__mk_de_DE=%C3%85M%C3%85%C5%BD%C3%95%C3%91&nsdOptOutParam=true&s=books&sr=1-1", available: true, lastVerifiedAt: "26.08.2026" },
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
      en: { title: 'Boundaries in Dating', author: 'Henry Cloud and John Townsend', publisher: 'Zondervan', url: "https://www.amazon.com/-/de/dp/0310200342/ref=sr_1_1?__mk_de_DE=%C3%85M%C3%85%C5%BD%C3%95%C3%91&s=books&sr=1-1", available: true, lastVerifiedAt: "26.08.2026" },
    },
  },
  {
    id: 'elliot-passion-and-purity',
    type: 'book',
    originalLanguage: 'en',
    topics: ['purity', 'contentment', 'singleness'],
    lifeStages: ['single', 'dating'],
    status: 'approved',
    description: {
      en: 'A personal account of bringing romantic desire under Christ’s authority over many years of waiting.',
      fr: "Un récit personnel : soumettre le désir amoureux à l'autorité du Christ au fil de longues années d'attente.",
    },
    editions: {
      en: { title: 'Passion and Purity', author: 'Elisabeth Elliot', publisher: 'Revell', url: "https://www.amazon.com/-/de/dp/080074666X/ref=sr_1_1?__mk_de_DE=%C3%85M%C3%85%C5%BD%C3%95%C3%91&s=books&sr=1-1", available: true, lastVerifiedAt: "26.08.2026" },
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
      en: { title: 'Gentle and Lowly', author: 'Dane C. Ortlund', publisher: 'Crossway', url: "https://www.amazon.com/-/de/dp/1433566133/ref=sr_1_1?__mk_de_DE=%C3%85M%C3%85%C5%BD%C3%95%C3%91&s=books&sr=1-1", available: true, lastVerifiedAt: "26.08.2026" },
    },
  },
  {
    id: 'dg-ask-pastor-john',
    type: 'podcast',
    originalLanguage: 'en',
    topics: ['singleness', 'purity', 'marriage', 'discernment'],
    lifeStages: ['single', 'dating', 'engaged', 'married'],
    status: 'approved',
    description: {
      en: 'Short question-and-answer episodes, many of them on singleness, dating and purity.',
      fr: 'De courts épisodes de questions-réponses, dont beaucoup portent sur le célibat, les fréquentations et la pureté.',
    },
    editions: {
      en: { title: 'Ask Pastor John', author: 'John Piper', publisher: 'Desiring God', url: "https://www.youtube.com/playlist?list=PLFF7F6AE365DA3564", available: true, lastVerifiedAt: "26.08.2026" },
    },
  },
];

export default RESOURCES;
