// Scripture for the guided / ACTS movements of a prayer session. We deliberately
// point the user to a passage to READ rather than embedding our own verse text —
// keeping them in God's Word, not our paraphrase. Every passage is a Psalm, so the
// reference renders in the user's language by reusing the localized "Psalm" book
// name (the same forms used by the home-screen verse bank).

const PSALM = {
  fr: 'Psaume', en: 'Psalm', de: 'Psalm', pt: 'Salmos', es: 'Salmos',
  zh: '诗篇', hi: 'भजन संहिता', ja: '詩篇', sw: 'Zaburi', am: 'መዝሙር',
  id: 'Mazmur', tl: 'Awit', ko: '시편', ru: 'Псалтирь', ar: 'مزمور', fa: 'مزامیر',
};

// chapter:verse ranges (Western numerals, matching the existing verse bank).
const MOVEMENTS = {
  adoration: ['103:1-2', '95:1-3', '145:1-3'],
  confession: ['51:1-4', '32:5', '139:23-24'],
  thanksgiving: ['107:1', '100:4-5', '136:1-3'],
};

// Psalms of God's faithfulness — for the Answered-prayers remembrance banner.
// Whole-chapter friendly, all Psalms so the reference localizes for free.
const FAITHFULNESS = ['103:1-5', '107:1', '116:1-2', '136:1-3', '145:1-7', '77:11-12', '30:4-5', '40:1-3'];

// Pick a passage for a movement, rotating by day so it stays fresh but is stable
// within a day. Returns a localized reference, e.g. "Psaume 103:1-2", or null.
export function movementPassage(movement, lang = 'fr', date = new Date()) {
  const options = MOVEMENTS[movement];
  if (!options) return null;
  return localizedPsalm(options, lang, date);
}

// A faithfulness Psalm for the Answered-prayers banner, rotating by day.
// Returns a localized reference, e.g. "Psaume 103:1-5".
export function faithfulnessPassage(lang = 'fr', date = new Date()) {
  return localizedPsalm(FAITHFULNESS, lang, date);
}

function localizedPsalm(options, lang, date) {
  const book = PSALM[lang] || PSALM.en;
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  return `${book} ${options[dayOfYear % options.length]}`;
}
