// The resource taxonomy — deliberately small and flat.
//
// A plan day names the topics it is about (`resourceTopics`), a catalogue entry
// names the topics it covers, and the resolver matches the two. That is the
// whole system: no hierarchy, no per-locale tag sets, nothing to maintain in 16
// languages. Keep it short — a tag nobody uses is worse than no tag.
export const RESOURCE_TOPICS = [
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
export const RESOURCE_DOMAINS = ['relationships', 'freedom'];

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
