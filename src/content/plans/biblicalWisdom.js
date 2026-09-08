import { DAYS } from './biblicalWisdomDays';
import { WISDOM_PLAN_APPROVAL } from '../reviews/paulWisdom20260908';

// A new curriculum has its own review record; earlier approvals do not cover it.
export const BIBLICAL_WISDOM = {
  id: 'wisdom42',
  version: 1,
  count: 42,
  emoji: '📖',
  category: 'bible-study',
  mode: 'study',
  resourceDomains: ['bible-study'],
  titleKey: 'planWisdomTitle',
  subKey: 'planWisdomSub',
  proseTranslations: [],
  review: WISDOM_PLAN_APPROVAL,
  movements: Array.from({ length: 6 }, (_, i) => ({
    id: `week${i + 1}`, from: i * 7 + 1, to: (i + 1) * 7, titleKey: `planWisdomWeek${i + 1}`,
  })),
  intro: {
    en: 'Grow in biblical wisdom through all of Proverbs, Ecclesiastes and Job, read alongside the Psalms, the teaching of Jesus and the apostles. Allow about 20–30 minutes a day, with extra time for longer readings. Read every passage listed for the day, including those under related Scripture: the following chapter belongs to the main reading too. Then observe the text, reflect on your life, take one practical step and pray. Every seventh day includes a review. External Christian resources are optional; use them after Scripture and compare their interpretations with the passages. French and English content is available; other languages currently use English fallback.',
    fr: 'Grandis dans la sagesse biblique en lisant intégralement les Proverbes, l’Ecclésiaste et Job, avec les Psaumes, l’enseignement de Jésus et celui des apôtres. Prévois environ 20 à 30 minutes par jour, davantage pour les lectures longues. Lis tous les passages indiqués pour la journée, y compris les passages associés : le chapitre suivant appartient lui aussi à la lecture principale. Observe ensuite le texte, examine ta vie, pose un acte concret et prie. Chaque septième jour comprend un bilan. Les ressources chrétiennes externes sont facultatives ; consulte-les après l’Écriture et confronte leurs interprétations aux passages. Le contenu est disponible en français et en anglais ; les autres langues utilisent actuellement le contenu anglais.',
  },
  biblical: {
    ref: 'James 3:13-18',
    text: {
      en: 'The goal is wisdom expressed through humility, mercy, integrity and peace, rooted in knowing God and following Christ. Proverbs describes wise conduct and its usual fruits, not unconditional guarantees of prosperity. Ecclesiastes examines life’s gifts and limits. Read the speeches in Job as a dialogue: God corrects the friends in Job 42:7, and the book never gives readers a formula for diagnosing another person’s suffering. Its ending does not guarantee material compensation for every loss. Job 28, 1 Corinthians 1:18–31 and Colossians 2:1–3 bring the search for wisdom into focus. The reflections and prayers in this plan are commentary, not quotations from Scripture.',
      fr: 'L’objectif est une sagesse exprimée par l’humilité, la miséricorde, l’intégrité et la paix, enracinée dans la connaissance de Dieu et la marche à la suite du Christ. Les Proverbes décrivent la conduite sage et ses fruits habituels, sans garantir inconditionnellement la prospérité. L’Ecclésiaste examine les dons et les limites de la vie. Lis les discours de Job comme un dialogue : Dieu reprend les amis en Job 42.7, et le livre ne donne aucune formule pour diagnostiquer la souffrance d’autrui. Sa fin ne garantit pas une compensation matérielle pour chaque perte. Job 28, 1 Corinthiens 1.18–31 et Colossiens 2.1–3 éclairent la recherche de la sagesse. Les méditations et les prières de ce plan sont des commentaires, non des citations de l’Écriture.',
    },
  },
  completion: {
    en: 'Revisit your notes and the decision you brought to God on day one. Name one change in your speech, one in your relationships and one in your response to uncertainty. Support each with a passage you studied. Choose three practices for the next month and one trusted person with whom you can review your progress. Keep asking for wisdom and putting the words of Jesus into practice; finishing a plan is a beginning, not mastery.',
    fr: 'Reprends tes notes et la décision présentée à Dieu au premier jour. Nomme un changement dans tes paroles, un dans tes relations et un dans ta réponse à l’incertitude. Appuie chacun sur un passage étudié. Choisis trois pratiques pour le mois à venir et une personne de confiance avec qui faire le point. Continue de demander la sagesse et de mettre les paroles de Jésus en pratique ; terminer un plan est un commencement, non une maîtrise acquise.',
  },
  days: DAYS,
};
