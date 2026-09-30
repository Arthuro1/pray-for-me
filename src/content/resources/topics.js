// The resource taxonomy — deliberately small and flat.
//
// A plan day names the topics it is about (`resourceTopics`), a catalogue entry
// names the topics it covers, and the resolver matches the two. That is the
// whole system: no hierarchy, no per-locale tag sets, nothing to maintain in 16
// languages. Keep it short — a tag nobody uses is worse than no tag.
export const RESOURCE_TOPICS = [
  'wisdom-literature',
  'wisdom-james',
  'prayer',
  'singleness',
  'identity',
  'contentment',
  'dating',
  'premarital',
  'discernment',
  'healing',
  'purity',
  'character',
  'future-spouse',
  'marriage',
  'covenant',
  'communication',
  'listening',
  'conflict',
  'forgiveness',
  'trust',
  'sexuality',
  'sexual-intimacy',
  'finances',
  'work',
  'community',
  'church',
  'family',
  'children',
  'parenting',
  'family-discipleship',
  'family-of-origin',
  'boundaries',
  'friendship',
  'spiritual-formation',
  'spiritual-rhythms',
  'prayer-together',
  'hospitality',
  'suffering',
  'grief',
  'infertility',
  'miscarriage',
  'marriage-crisis',
  'abuse-safety',
  'trauma',
  'divorce',
  'pornography',
  'addiction',
  'infidelity',
  'illness',
  'marriage-roles',
  'generosity',
  'mission',
  // ── Freedom & deliverance ────────────────────────────────────────────────
  // Added for the 30-day "Freedom & Deliverance in Christ" plan. Deliberately
  // descriptive rather than diagnostic: they say what a resource is ABOUT, and
  // never what is true of a reader. Everything under this heading raises the
  // review level to `sensitive` — see SENSITIVE_RESOURCE_TOPICS in
  // src/lib/resources.js.
  'deliverance',
  'spiritual-warfare',
  'holy-spirit',
  'repentance',
  'renunciation',
  'covenants',
  'curses',
  'altars',
  'occult',
  'idolatry',
  'secret-societies',
  'dedications',
  'family-line',
  'generational-patterns',
  'strongholds',
  'fear',
  'armor-of-god',
  'scripture-prayer',
  'discipleship',
  'victory',
  'cross',
  // Historical and literary study: scoped away from prayer-resource domains.
  'david',
  'ancient-israel',
  'biblical-geography',
  'biblical-archaeology',
  'biblical-narrative',
  'kingship',
  'philistines',
  'ancient-worship',
  // General Christian life, added 2026-09-23 with the author collections in
  // ./authors/. The "Growing in Christ" plans reuse them rather than invent
  // near-duplicates.
  'gospel',
  'calling',
  'leadership',
  'holiness',
  'wisdom',
  'worship',
  'blessing',
  'kingdom-of-god',
  'end-times',
  'bible-overview',
  'pastoral-care',
  'mental-health',
  // Added 2026-09-23 for the thirteen plans in docs/NEW_PLANS_2026-09-23.md.
  // Each one names a subject that recurs across several plans or resources;
  // none of them is a per-plan label. Existing tags were preferred wherever
  // they already fit (identity, calling, work, holy-spirit, kingdom-of-god,
  // parenting, children, forgiveness, grief, discernment…).
  'intercession',        // praying for others as a discipline (prodigals, unbelievers, the kingdom)
  'evangelism',          // personal witness and gospel conversations, not mission agencies
  'apologetics',         // answering questions about the faith with gentleness
  'persecution',         // the persecuted church and suffering for the faith
  'prodigals',           // loved ones who have wandered from faith they once held
  'pregnancy',           // expecting a child; loss and infertility keep their own sensitive tags
  'manhood',             // what Scripture says about living as a man — roles stay on marriage-roles
  'womanhood',           // what Scripture says about living as a woman — roles stay on marriage-roles
  'fruit-of-the-spirit', // Galatians 5 and the character the Spirit produces
  'spiritual-gifts',     // Romans 12, 1 Corinthians 12–14, Ephesians 4
  'spirit-baptism',      // filling, baptism in the Spirit and tongues — disputed, described fairly
  'prophecy',            // sensitive: prophetic ministry and testing it
  'psalms',              // the Psalter as a book and as a prayer book
  'lament',              // honest complaint and grief brought to God
  'lords-prayer',        // the prayer Jesus taught (Matthew 6, Luke 11)
  'justice',             // God's justice, oppression, wrongdoing and its victims
  'sabbath',             // rest, limits and Sabbath rhythms
  'church-hurt',         // sensitive: wounds received in a church or ministry
  'spiritual-abuse',     // sensitive: coercive or abusive spiritual leadership
];

// The FAMILY OF PLANS a resource belongs on.
//
// The taxonomy above is flat and shared, which is what keeps it maintainable —
// but it also means one tag can mean two different things in two different
// worlds. 'discernment' on a dating book is discerning a partner; 'discernment'
// on day 7 of the deliverance plan is discerning occult influence. Matching on
// topics alone therefore put "Boundaries in Dating" and "Who Should I Marry?"
// on a day about renouncing occult covenants — relevant-looking, pastorally
// wrong, and impossible to fix by retagging without breaking the plans those
// tags were written for.
//
// A domain is the coarse scope the topic match happens INSIDE. A plan declares
// the domains it draws from (`resourceDomains`), an entry declares the domains
// it belongs to (`domains`), and a plan that declares neither stays unscoped
// and matches on topics alone. See resolveResources() in src/lib/resources.js.
//
// `christian-living` is general discipleship — prayer, calling, holiness,
// leadership. It was held back for plans still being written; since 2026-09-23
// the "Growing in Christ" plans (category `formation`) read it, and only they
// do. A plan in any other category that names it is a test failure.
//
// `intercession` is praying for a loved one in a particular need — first of
// all a prodigal who has wandered from faith — so the shelf helps the one
// praying without pulling in books written for the person prayed for.
//
// `mission` is praying for, and witnessing to, people who do not yet believe:
// evangelism, apologetics with gentleness, unreached peoples, the persecuted
// church. It is separate from `intercession` because both shelves share
// generic tags ('intercession', 'prayer', 'family', 'trust'): on one shelf a
// parent praying for a wandering son was offered "unreached people group of
// the day" guides, and the unbelievers plan was offered books on wayward children.
//
// `care` holds wounds, recovery and safeguarding: church hurt and spiritual
// abuse first. It exists because 'forgiveness', 'identity' and 'healing' on
// the freedom shelf mean renouncing, deliverance and strongholds — a reader
// recovering from an abusive church must not be handed a deliverance book on
// the strength of a shared tag.
export const RESOURCE_DOMAINS = ['relationships', 'freedom', 'bible-study', 'christian-living', 'intercession', 'mission', 'care'];

// The theological tradition a resource comes out of. This is CONTEXT for a
// reader, never a judgement: labelling a book "african-pentecostal" says where
// its teaching sits, not that it is better or worse than anything else. Used to
// ORDER an already-approved shelf (a plan may declare a preferred order), never
// to filter one.
export const RESOURCE_PERSPECTIVES = [
  'african-pentecostal',
  'pentecostal',
  'charismatic',
  'evangelical',
  'reformed',
  'anglican',
  'catholic',
  'orthodox',
];

// Where in life a resource actually helps. Used to keep a book written for
// married couples out of a single person's list unless it is genuinely about
// preparing.
export const LIFE_STAGES = ['single', 'dating', 'engaged', 'married'];

// Media types a resource can be. Books are NOT the only useful form — a locale
// with no translated book may have an excellent sermon or article, which is
// exactly how multilingual coverage gets better.
export const RESOURCE_TYPES = ['book', 'article', 'podcast', 'teaching', 'video', 'study', 'prayerGuide'];

// The review states an entry moves through. ONLY `approved` is ever shown to a
// user; everything else is invisible in the app (see src/lib/resources.js).
export const RESOURCE_STATUSES = ['draft', 'needs_review', 'approved', 'retired'];

// Sensitive resources need two explicit human sign-offs in addition to the
// normal publication status. The resolver treats an omitted level as
// `standard` for backwards compatibility, but a sensitive topic always wins.
export const RESOURCE_REVIEW_LEVELS = ['standard', 'sensitive'];
