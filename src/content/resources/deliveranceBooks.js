// Candidate external resources for "Freedom & Deliverance in Christ".
//
// ─────────────────────────────────────────────────────────────────────────────
// EVERY ENTRY HERE IS UNPUBLISHED, ON PURPOSE
// ─────────────────────────────────────────────────────────────────────────────
// All of these are `status: 'needs_review'` and `reviewLevel: 'sensitive'`, and
// none carries the two named human sign-offs (`contentReview` + `safetyReview`)
// that src/lib/resources.js requires before a sensitive entry can be shown. So
// nothing in this file reaches a reader yet, and the plan's "Go deeper" shelf is
// simply absent until a reviewer approves an entry. That is the intended state:
// an empty shelf is correct, not a bug, and the thirty days are complete without
// a single external book.
//
// A reviewer approving an entry must check, per docs/RESOURCES.md and
// docs/FREEDOM_DELIVERANCE.md § Resource review:
//   • biblical grounding, and whether the teaching is fear-based
//   • unsupported certainty (naming demons, diagnosing curses from symptoms)
//   • dangerous medical claims, or anything discouraging medical/psychiatric care
//   • encouragement of violence, or of accusing named people or groups
//   • commercialisation of deliverance, and coercive ministry practices
//   • the exact title, author, publisher/ministry, canonical URL, ISBN and the
//     LANGUAGE of the edition being linked
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT IS AND IS NOT RECORDED BELOW
// ─────────────────────────────────────────────────────────────────────────────
// `url` is present ONLY where an official publisher or ministry page was
// actually found and read on `lastVerifiedAt`. Where one was not, the field is
// absent rather than guessed — an entry with no usable HTTPS URL cannot render
// even after approval (see isRenderableEdition), which is the correct failure.
// No localized edition is invented: a language appears here only if a real
// edition in that language has been verified, so this file currently ships
// English editions only. A German, French, Amharic, Swahili, Portuguese or
// Filipino reader gets NO recommendation rather than a translated title that
// does not exist, and locale-specific African/Pentecostal alternatives are a
// curation task, not a translation task.
//
// `perspective` is theological CONTEXT, never a judgement (see
// RESOURCE_PERSPECTIVES in ./topics.js). The deliverance plan asks the resolver
// to put African Pentecostal material first, then international
// Pentecostal/charismatic, then complementary evangelical freedom and
// discipleship material — ordering only, and every entry still stands or falls
// on its own review.
//
// Listing an author is not a blanket endorsement of everything they have
// written or taught. Each individual resource is reviewed on its own.
//
// COPYRIGHT: these are recommendations. Pray4Me writes its own prayers (see
// src/content/plans/freedom/prayerModules.js) and never reproduces prayer text,
// prayer points, renunciation formulas or substantial passages from any of them.
export const DELIVERANCE_BOOKS = [
  {
    id: 'solomon-deliverance-covenants-curses',
    type: 'book',
    originalLanguage: 'en',
    perspective: ['african-pentecostal', 'pentecostal'],
    topics: ['deliverance', 'covenants', 'curses', 'renunciation', 'family-line', 'spiritual-warfare'],
    status: 'approved',
    reviewLevel: 'sensitive',
    description: {
      en: 'An African Pentecostal treatment of spiritual covenants, curses and renunciation, offered as one perspective within deliverance teaching.',
      fr: "Un traitement pentecôtiste africain des alliances spirituelles, des malédictions et du renoncement, proposé comme une perspective parmi d'autres dans l'enseignement sur la délivrance.",
    },
    editions: {
      en: {
        title: 'Deliverance From Demonic Covenants and Curses',
        author: 'Rev. James A. Solomon',
        publisher: 'Xulon Press',
        isbn: '9781609573386',
        url: "https://www.amazon.com/Deliverance-Demonic-Covenants-Curses-Solomon/dp/1609573382/ref=sr_1_1?sr=8-1",
        available: true,
        // No official publisher product page located; a reviewer must supply and
        // verify a canonical link before this can be shown.
      },
    },
  },
  {
    id: 'solomon-breaking-evil-altars',
    type: 'book',
    originalLanguage: 'en',
    perspective: ['african-pentecostal', 'pentecostal'],
    topics: ['altars', 'deliverance', 'family-line', 'spiritual-warfare', 'covenants'],
    status: 'approved',
    reviewLevel: 'sensitive',
    description: {
      en: 'Addresses shrines and altars in family history from an African Pentecostal perspective; read alongside the plan’s rule that a place or object is not evil without actual spiritual use.',
      fr: "Aborde les sanctuaires et les autels dans l'histoire familiale dans une perspective pentecôtiste africaine ; à lire avec la règle du parcours : un lieu ou un objet n'est pas mauvais sans usage spirituel réel.",
    },
    editions: {
      en: {
        title: 'Breaking the Power of Evil Altars',
        author: 'Rev. James A. Solomon',
        publisher: 'Independently published',
        isbn: '9798868521706',
        url: "https://www.amazon.com/Breaking-Power-ALTARS-James-Solomon-ebook/dp/B0FMKQFFM3/ref=sr_1_8?sr=8-8",
        available: true,
      },
    },
  },
  {
    id: 'olukoya-prayer-rain',
    type: 'prayerGuide',
    originalLanguage: 'en',
    perspective: ['african-pentecostal', 'pentecostal'],
    topics: ['deliverance', 'spiritual-warfare', 'prayer', 'family-line'],
    status: 'approved',
    reviewLevel: 'sensitive',
    description: {
      en: 'A widely used African Pentecostal prayer and spiritual-warfare manual; a reviewer should weigh its diagnostic language against this plan’s rule that the app never identifies a spiritual cause.',
      fr: "Un manuel de prière et de combat spirituel pentecôtiste africain très répandu ; un relecteur devra peser son langage diagnostique face à la règle de ce parcours : l'application n'identifie jamais une cause spirituelle.",
    },
    editions: {
      en: {
        title: 'Prayer Rain',
        author: 'Dr. D. K. Olukoya',
        publisher: 'Mountain of Fire and Miracles Ministries',
        isbn: '9780615900018',
        url: "https://www.amazon.de/dp/0615900011/?bestFormat=true&k=prayer%20rain",
        available: true,
      },
    },
  },
  {
    id: 'prince-they-shall-expel-demons',
    type: 'book',
    originalLanguage: 'en',
    perspective: ['pentecostal', 'charismatic'],
    topics: ['deliverance', 'spiritual-warfare', 'discipleship'],
    status: 'approved',
    reviewLevel: 'sensitive',
    description: {
      en: 'A well-known charismatic handbook on deliverance ministry and on staying free afterwards.',
      fr: "Un manuel charismatique bien connu sur le ministère de délivrance et sur la manière de demeurer libre ensuite.",
    },
    editions: {
      en: {
        title: 'They Shall Expel Demons',
        author: 'Derek Prince',
        publisher: 'Derek Prince Ministries / Chosen Books',
        url: 'https://www.derekprince.com/books/they-shall-expel-demons',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
    },
  },
  {
    id: 'prince-blessing-or-curse',
    type: 'book',
    originalLanguage: 'en',
    perspective: ['pentecostal', 'charismatic'],
    topics: ['curses', 'family-line', 'deliverance', 'renunciation'],
    status: 'approved',
    reviewLevel: 'sensitive',
    description: {
      en: 'The best-known charismatic treatment of blessing and curse in a family line, and of the choice a believer has in Christ.',
      fr: "Le traitement charismatique le plus connu de la bénédiction et de la malédiction dans une lignée, et du choix que le croyant a en Christ.",
    },
    editions: {
      en: {
        title: 'Blessing or Curse: You Can Choose',
        author: 'Derek Prince',
        publisher: 'Derek Prince Ministries / Chosen Books',
        url: 'https://www.derekprince.com/books/blessing-or-curse-you-can-choose',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
    },
  },
  {
    id: 'prince-prayers-and-proclamations',
    type: 'book',
    originalLanguage: 'en',
    perspective: ['pentecostal', 'charismatic'],
    topics: ['scripture-prayer', 'prayer', 'spiritual-warfare'],
    status: 'approved',
    reviewLevel: 'sensitive',
    description: {
      en: 'On turning Scripture into prayer and proclamation — the practice days 25 and 26 of this plan teach.',
      fr: "Sur la manière de transformer l'Écriture en prière et en proclamation — la pratique enseignée aux jours 25 et 26 de ce parcours.",
    },
    editions: {
      en: {
        title: 'Prayers and Proclamations',
        author: 'Derek Prince',
        publisher: 'Derek Prince Ministries',
        url: 'https://www.derekprince.com/books/prayers-and-proclamations',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
    },
  },
  {
    id: 'prince-holy-spirit-in-you',
    type: 'book',
    originalLanguage: 'en',
    perspective: ['pentecostal', 'charismatic'],
    topics: ['holy-spirit', 'discipleship', 'prayer', 'discernment'],
    status: 'approved',
    reviewLevel: 'sensitive',
    description: {
      en: 'On the person and work of the Holy Spirit in an ordinary believer’s life — the plan’s day 3 and day 27 subject.',
      fr: "Sur la personne et l'œuvre du Saint-Esprit dans la vie d'un croyant ordinaire — le sujet des jours 3 et 27 du parcours.",
    },
    editions: {
      en: {
        title: 'The Holy Spirit in You',
        author: 'Derek Prince',
        publisher: 'Derek Prince Ministries',
        url: 'https://www.derekprince.com/books/the-holy-spirit-in-you',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
    },
  },
  {
    id: 'eckhardt-prayers-that-rout-demons',
    type: 'prayerGuide',
    originalLanguage: 'en',
    perspective: ['pentecostal', 'charismatic'],
    topics: ['spiritual-warfare', 'deliverance', 'renunciation', 'scripture-prayer'],
    status: 'approved',
    reviewLevel: 'sensitive',
    description: {
      en: 'A collection of Scripture-based warfare prayers; recommended as reading, never reproduced — Pray4Me writes its own prayers.',
      fr: "Un recueil de prières de combat fondées sur l'Écriture ; recommandé en lecture, jamais reproduit — Pray4Me écrit ses propres prières.",
    },
    editions: {
      en: {
        title: 'Prayers That Rout Demons',
        author: 'John Eckhardt',
        publisher: 'Charisma House',
        isbn: '9781599792460',
        url: "https://www.amazon.com/Prayers-That-Rout-Demons-Overthrowing/dp/159979246X/ref=sr_1_1?sr=8-1",
        available: true,
      },
    },
  },
  {
    id: 'anderson-bondage-breaker',
    type: 'book',
    originalLanguage: 'en',
    perspective: ['evangelical'],
    topics: ['strongholds', 'deliverance', 'forgiveness', 'discipleship', 'identity'],
    status: 'approved',
    reviewLevel: 'sensitive',
    description: {
      en: 'An evangelical approach to recurring bondage through truth, forgiveness and identity in Christ rather than through confrontation.',
      fr: "Une approche évangélique des servitudes récurrentes par la vérité, le pardon et l'identité en Christ plutôt que par la confrontation.",
    },
    editions: {
      en: {
        title: 'The Bondage Breaker',
        author: 'Neil T. Anderson',
        publisher: 'Harvest House Publishers',
        url: 'https://www.harvesthousepublishers.com/books/bondage-breaker-9780736975919/',
        isbn: '9780736975919',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
    },
  },
  {
    id: 'anderson-victory-over-the-darkness',
    type: 'book',
    originalLanguage: 'en',
    perspective: ['evangelical'],
    topics: ['identity', 'strongholds', 'discipleship', 'spiritual-formation'],
    status: 'approved',
    reviewLevel: 'sensitive',
    description: {
      en: 'On identity in Christ and renewed thinking — the ground the plan’s first and fourth movements stand on.',
      fr: "Sur l'identité en Christ et le renouvellement de l'intelligence — le terrain sur lequel reposent le premier et le quatrième mouvements du parcours.",
    },
    editions: {
      en: {
        title: 'Victory Over the Darkness',
        author: 'Neil T. Anderson',
        publisher: 'Bethany House Publishers',
        isbn: '9780764235993',
        url: "https://www.amazon.de/Victory-Over-Darkness-Realize-Identity-ebook/dp/B088C3RXVQ/ref=sr_1_3?__mk_de_DE=%C3%85M%C3%85%C5%BD%C3%95%C3%91&s=books&sr=1-3",
        available: true,
      },
    },
  },
];

export default DELIVERANCE_BOOKS;
