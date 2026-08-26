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
  'discernment',
  'healing',
  'purity',
  'character',
  'future-spouse',
  'marriage',
  'covenant',
  'communication',
  'conflict',
  'forgiveness',
  'sexuality',
  'finances',
  'community',
  'family',
  'parenting',
  'family-discipleship',
  'spiritual-formation',
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
