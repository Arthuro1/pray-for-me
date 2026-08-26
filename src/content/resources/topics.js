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
