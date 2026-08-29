// Candidate external resources for "Freedom & Deliverance in Christ".
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT PUBLISHES AN ENTRY HERE
// ─────────────────────────────────────────────────────────────────────────────
// Every entry is `reviewLevel: 'sensitive'`, so `status: 'approved'` alone can
// never put one on screen. src/lib/resources.js additionally requires BOTH named
// human sign-offs, which are somebody's attestation and which an AI must never
// write:
//
//   contentReview: { status: 'approved', reviewedBy: 'Name', reviewedAt: '2026-08-28' },
//   safetyReview:  { status: 'approved', reviewedBy: 'Name', reviewedAt: '2026-08-28' },
//
// Those sign-offs are now present (Paul, 2026-08-26), so this shelf is live.
// Seven entries render; the other three carry no linkable publisher page and
// stay hidden until one exists — see the notes on those editions below. Strip a
// sign-off from any entry and it disappears again, which is the gate working.
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
//
// No localized edition is invented. A language key exists here only where a real
// edition in that language was found on the publisher's or the ministry's own
// site and read on the recorded date; de/fr/es/ru/hi are what that search
// actually turned up. Everything below is a translation of the same book, which
// is the weaker half of rule 2 in src/lib/resources.js — locale-specific African
// and Pentecostal titles are still a curation task nobody has done, and they
// would be the better answer for most of these readers.
//
// Languages deliberately still absent, each for a checked reason:
//   • pt — DPM's own Portuguese pages send readers to the English South African
//     store, so there is no Portuguese product page to link.
//   • fa — derekprinceiran.org serves HTTP only; an http:// URL cannot render.
//   • ar — the domain DPM Arabic used (dpm.name) now also serves unrelated spam
//     pages, so it is not linkable.
//   • id/ko/ja/zh/sw/tl/am — editions are cited in the wild, but no publisher or
//     ministry page for one was found; retailer and library listings do not
//     count.
// A reader in any of those languages gets NO recommendation rather than a
// translated title we cannot stand behind.
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
// COPYRIGHT: these are recommendations. Praystead writes its own prayers (see
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
      en: 'An African Pentecostal treatment of spiritual covenants, curses and renunciation, offered as one perspective within deliverance teaching.',
      fr: "Un traitement pentecôtiste africain des alliances spirituelles, des malédictions et du renoncement, proposé comme une perspective parmi d'autres dans l'enseignement sur la délivrance.",
    },
    editions: {
      en: {
        title: 'Deliverance From Demonic Covenants and Curses',
        author: 'Rev. James A. Solomon',
        publisher: 'Xulon Press',
        isbn: '9781609573386',
        url: 'https://bookstore.xulonpress.com/bookdetail.php?PB_ISBN=9781609573386',
        available: true,
        lastVerifiedAt: '2026-08-28',
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
      en: 'Addresses shrines and altars in family history from an African Pentecostal perspective; read alongside the plan’s rule that a place or object is not evil without actual spiritual use.',
      fr: "Aborde les sanctuaires et les autels dans l'histoire familiale dans une perspective pentecôtiste africaine ; à lire avec la règle du parcours : un lieu ou un objet n'est pas mauvais sans usage spirituel réel.",
    },
    editions: {
      en: {
        title: 'Breaking the Power of Evil Altars',
        author: 'Rev. James A. Solomon',
        publisher: 'Independently published',
        isbn: '9798868521706',
        // Checked 2026-08-28: distributed only through retailers (a 979-8 ISBN),
        // with no publisher or ministry product page to link to. The entry keeps
        // its title, author and ISBN and simply cannot render — the correct
        // failure, not a reason to link a retailer.
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
      en: 'A widely used African Pentecostal prayer and spiritual-warfare manual; a reviewer should weigh its diagnostic language against this plan’s rule that the app never identifies a spiritual cause.',
      fr: "Un manuel de prière et de combat spirituel pentecôtiste africain très répandu ; un relecteur devra peser son langage diagnostique face à la règle de ce parcours : l'application n'identifie jamais une cause spirituelle.",
    },
    editions: {
      en: {
        title: 'Prayer Rain',
        author: 'Dr. D. K. Olukoya',
        publisher: 'Mountain of Fire and Miracles Ministries',
        isbn: '9780615900018',
        // Checked 2026-08-28: mountainoffire.org carries the ministry's prayer
        // programmes but no product page for the book, and Battle Cry has no
        // online bookstore of its own. No canonical link to record.
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
      de: {
        title: 'Sie werden Dämonen austreiben',
        author: 'Derek Prince',
        publisher: 'Internationaler Bibellehrdienst',
        isbn: '9783980445382',
        url: 'https://www.ibl-dpm.de/index.php/shop/buecher/b42ge',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
      fr: {
        title: 'Ils chasseront les démons',
        author: 'Derek Prince',
        // Checked 2026-08-28: the DPM France product page carries no ISBN, so
        // none is recorded. Retailers quote 9782911537233; that is their claim
        // to make, not ours.
        publisher: 'Derek Prince Ministries France',
        url: 'https://derekprince.fr/produit/ils-chasseront-les-demons/',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
      es: {
        title: 'Echarán fuera demonios',
        author: 'Derek Prince',
        publisher: 'Whitaker House Español',
        isbn: '9781603741552',
        url: 'https://www.espanolwh.com/product/span-they-shall-expel-demons/',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
      ru: {
        title: 'Будут изгонять бесов',
        author: 'Дерек Принс',
        // Checked 2026-08-28: DPM Russia's store page gives title, price and a
        // working cart, but no ISBN and no printed author line — the site is
        // his ministry's, listed on derekprince.com/region.
        publisher: 'Служение Дерека Принса (Derek Prince Ministries Russia)',
        url: 'https://derekprince.ru/product/budut-izgonjat-besov',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
      hi: {
        // DPM India titles its Hindi editions in English on the product page,
        // with the Hindi text in the description. The title is recorded as the
        // page shows it rather than back-translated.
        title: 'They Shall Expel Demons – Hindi',
        author: 'Derek Prince',
        publisher: 'Derek Prince Ministries India',
        url: 'https://store.in.derekprince.com/products/they-shall-expel-demons-hindi',
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
      de: {
        title: 'Segen oder Fluch? Sie haben die Wahl',
        author: 'Derek Prince',
        publisher: 'Verlag Gottfried Bernard',
        isbn: '9783925968358',
        url: 'https://www.ibl-dpm.de/index.php/shop/kategorien/buecher/b56ge',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
      fr: {
        title: 'Bénédiction ou malédiction : à vous de choisir',
        author: 'Derek Prince',
        publisher: 'Derek Prince Ministries France',
        isbn: '9782911537240',
        url: 'https://derekprince.fr/produit/benediction-ou-malediction/',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
      es: {
        title: 'Bendición o maldición: Usted puede escoger',
        author: 'Derek Prince',
        publisher: 'Editorial Unilit',
        isbn: '9780789922724',
        url: 'https://www.editorialunilit.com/bendicion-o-maldicion-usted-puede-escoger-favoritos',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
      hi: {
        title: 'Blessing Or Curse You Can Choose – Hindi',
        author: 'Derek Prince',
        publisher: 'Derek Prince Ministries India',
        url: 'https://store.in.derekprince.com/products/blessing-or-curse-you-can-choose-hindi',
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
      de: {
        title: 'Gebete und Proklamationen',
        author: 'Derek Prince',
        publisher: 'Internationaler Bibellehrdienst',
        isbn: '9783944602400',
        url: 'https://www.ibl-dpm.de/index.php/shop/buecher/b59ge',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
      fr: {
        title: 'Prières et proclamations',
        author: 'Derek Prince',
        publisher: 'Derek Prince Ministries France',
        isbn: '9782360050352',
        url: 'https://derekprince.fr/produit/prieres-et-proclamations/',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
      // Checked 2026-08-28: Whitaker House Español lists "Prayers &
      // Proclamations" but the listing itself says the edition is ENG, so there
      // is no Spanish edition to record here.
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
      de: {
        title: 'Der Heilige Geist in Ihnen',
        author: 'Derek Prince',
        publisher: 'Internationaler Bibellehrdienst',
        isbn: '9783932341175',
        url: 'https://www.ibl-dpm.de/index.php/shop/buecher/t60ge',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
      ru: {
        title: 'Святой Дух в тебе',
        author: 'Дерек Принс',
        publisher: 'Служение Дерека Принса (Derek Prince Ministries Russia)',
        url: 'https://derekprince.ru/product/svjatoj-duh-v-tebe',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
      hi: {
        title: 'Holy Spirit In You – Hindi',
        author: 'Derek Prince',
        publisher: 'Derek Prince Ministries India',
        url: 'https://store.in.derekprince.com/products/holy-spirit-in-you-1',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
      // Checked 2026-08-28: DPM France sells "Le Saint-Esprit en vous" only as
      // half of a two-teaching volume ("Le baptême dans le Saint-Esprit"), which
      // is a different product, so no French edition of THIS book is recorded.
      // A Spanish edition (9781603742214) is quoted by retailers, but Whitaker
      // House Español no longer carries a page for it.
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
      en: 'A collection of Scripture-based warfare prayers; recommended as reading, never reproduced — Praystead writes its own prayers.',
      fr: "Un recueil de prières de combat fondées sur l'Écriture ; recommandé en lecture, jamais reproduit — Praystead écrit ses propres prières.",
    },
    editions: {
      en: {
        title: 'Prayers That Rout Demons',
        author: 'John Eckhardt',
        publisher: 'Charisma House',
        isbn: '9781599792460',
        // Checked 2026-08-28: charismahouse.com/products/prayers-that-rout-demons
        // now 301s to mycharismashop.com, which 301s on to an Amazon storefront.
        // The publisher no longer hosts a product page, so there is none to link.
        available: true,
      },
      // Charisma's Spanish imprint still hosts its own product page, so a
      // Spanish reader can reach this book where an English one currently
      // cannot. That asymmetry is real, not a mistake.
      es: {
        title: 'Oraciones que derrotan a los demonios',
        author: 'John Eckhardt',
        publisher: 'Casa Creación',
        isbn: '9781599794396',
        url: 'https://casacreacion.com/site/producto/oraciones-que-derrotan-demonios/',
        available: true,
        lastVerifiedAt: '2026-08-28',
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
      es: {
        // Unilit also sells a shorter "Serie Favoritos" cut and a youth
        // edition; this is the one that corresponds to the English book above.
        title: 'Rompiendo las cadenas, Edición ampliada y revisada',
        author: 'Neil T. Anderson',
        publisher: 'Editorial Unilit',
        isbn: '9780789924902',
        url: 'https://www.editorialunilit.com/rompiendo-las-cadenas-edicion-ampliada-y-revisada',
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
      en: 'On identity in Christ and renewed thinking — the ground the plan’s first and fourth movements stand on.',
      fr: "Sur l'identité en Christ et le renouvellement de l'intelligence — le terrain sur lequel reposent le premier et le quatrième mouvements du parcours.",
    },
    editions: {
      en: {
        title: 'Victory Over the Darkness',
        author: 'Neil T. Anderson',
        publisher: 'Bethany House Publishers',
        isbn: '9780764235993',
        url: 'https://bakerpublishinggroup.com/products/9780764235993_victory-over-the-darkness',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
      es: {
        title: 'Victoria sobre la oscuridad',
        author: 'Neil T. Anderson',
        publisher: 'Editorial Unilit',
        isbn: '9780789919182',
        url: 'https://www.editorialunilit.com/victoria-sobre-la-oscuridad-favoritos',
        available: true,
        lastVerifiedAt: '2026-08-28',
      },
    },
  },
];

export default DELIVERANCE_BOOKS;
