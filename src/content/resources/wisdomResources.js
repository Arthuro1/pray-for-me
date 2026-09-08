// Official pages checked on 2026-09-08. Link checks are not human editorial approval.
import { WISDOM_RESOURCE_SIGNOFF } from '../reviews/paulWisdom20260908.js';
const L = (en, fr) => ({ en, fr });
const edition = (title, author, publisher, url) => ({
  title, author, publisher, url, available: true, lastVerifiedAt: '2026-09-08',
});

export const WISDOM_RESOURCES = [
  {
    id: 'bibleproject-wisdom-videos', type: 'video', originalLanguage: 'en',
    status: 'approved', reviewLevel: 'standard',
    contentReview: { ...WISDOM_RESOURCE_SIGNOFF },
    safetyReview: { ...WISDOM_RESOURCE_SIGNOFF },
    topics: ['wisdom-literature'], lifeStages: [],
    description: L(
      'Three short Christian introductions to Proverbs, Ecclesiastes and Job. Watch the relevant book introduction after the first reading. The French link opens the official library: find “Sagesse - La série”. Free access.',
      'Trois courtes introductions chrétiennes aux Proverbes, à l’Ecclésiaste et à Job. Regarde celle du livre après sa première lecture. Le lien français ouvre la bibliothèque officielle : cherche « Sagesse - La série ». Accès gratuit.',
    ),
    editions: {
      en: edition('Wisdom', 'BibleProject', 'BibleProject', 'https://bibleproject.com/videos/collections/wisdom/'),
      fr: edition('Sagesse - La série', 'BibleProject', 'BibleProject', 'https://bibleproject.com/francais/'),
    },
  },
  {
    id: 'bibleproject-wisdom-podcast', type: 'podcast', originalLanguage: 'en',
    status: 'approved', reviewLevel: 'standard',
    contentReview: { ...WISDOM_RESOURCE_SIGNOFF },
    safetyReview: { ...WISDOM_RESOURCE_SIGNOFF },
    topics: ['wisdom-literature'], lifeStages: [],
    description: L(
      'Longer conversations on Proverbs, Ecclesiastes and Job. Optional English listening for a weekly review; select an episode about the book you have just read. Free access.',
      'Conversations approfondies sur les Proverbes, l’Ecclésiaste et Job. Écoute facultative en anglais lors d’un bilan hebdomadaire ; choisis un épisode consacré au livre que tu viens de lire. Accès gratuit.',
    ),
    editions: { en: edition('Wisdom', 'Tim Mackie and Jon Collins', 'BibleProject', 'https://bibleproject.com/podcasts/series/wisdom-series/') },
  },
  {
    id: 'ligonier-introduction-wisdom', type: 'teaching', originalLanguage: 'en',
    status: 'approved', reviewLevel: 'standard', perspective: 'reformed',
    contentReview: { ...WISDOM_RESOURCE_SIGNOFF },
    safetyReview: { ...WISDOM_RESOURCE_SIGNOFF },
    topics: ['wisdom-literature'], lifeStages: [],
    description: L(
      'R.C. Sproul introduces the pursuit of wisdom from a Reformed Christian perspective. This first message is offered for free; later messages in the series require purchase or membership. English.',
      'R.C. Sproul introduit la recherche de la sagesse dans une perspective chrétienne réformée. Ce premier enseignement est proposé gratuitement ; les suivants nécessitent un achat ou une adhésion. En anglais.',
    ),
    editions: { en: edition('Introduction to Wisdom', 'R.C. Sproul', 'Ligonier Ministries', 'https://learn.ligonier.org/series/wisdom/introduction-to-wisdom') },
  },
  {
    id: 'evangile21-james-resources', type: 'study', originalLanguage: 'fr',
    status: 'approved', reviewLevel: 'standard', perspective: 'reformed',
    contentReview: { ...WISDOM_RESOURCE_SIGNOFF },
    safetyReview: { ...WISDOM_RESOURCE_SIGNOFF },
    topics: ['wisdom-james'], lifeStages: [],
    description: L(
      'French resource index for James, introducing Dan Doriani’s commentary on faith expressed in obedience. Use alongside the days reading James. The index was verified; the linked full commentary could not be retrieved during verification.',
      'Page de ressources en français sur Jacques, présentant le commentaire de Dan Doriani sur la foi vécue dans l’obéissance. À consulter les jours où Jacques est lu. La page a été vérifiée ; le commentaire intégral lié n’a pas pu être consulté lors de la vérification.',
    ),
    editions: { fr: edition('Jacques', 'Évangile 21', 'The Gospel Coalition — Évangile 21', 'https://evangile21.thegospelcoalition.org/bible/jacques/') },
  },
];

// Suggested optional sessions in the manuscript; the app uses matching topics.
export const WISDOM_RESOURCE_DAYS = {
  1: ['bibleproject-wisdom-videos'],
  7: ['ligonier-introduction-wisdom'],
  8: ['evangile21-james-resources'],
  16: ['bibleproject-wisdom-videos'],
  19: ['evangile21-james-resources'],
  21: ['bibleproject-wisdom-podcast'],
  22: ['bibleproject-wisdom-videos'],
  28: ['bibleproject-wisdom-podcast'],
  35: ['bibleproject-wisdom-podcast'],
  42: ['evangile21-james-resources'],
};
