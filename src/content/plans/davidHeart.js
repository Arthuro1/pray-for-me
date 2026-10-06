import { DAYS } from './davidHeartDays';
import { PLAN_APPROVALS } from '../reviews/paul20260903';

// Study-first curriculum on the shared daily-plan engine, approved by Paul.
export const DAVID_HEART = {
  id: 'david12',
  version: 1,
  count: 12,
  emoji: '📖',
  category: 'bible-study',
  mode: 'study',
  resourceDomains: ['bible-study'],
  titleKey: 'planDavidTitle',
  subKey: 'planDavidSub',
  proseTranslations: [],
  review: PLAN_APPROVALS.david12,
  movements: [
    { id: 'rooted', from: 1, to: 3, titleKey: 'planDavidRooted' },
    { id: 'teachable', from: 4, to: 6, titleKey: 'planDavidTeachable' },
    { id: 'return', from: 7, to: 9, titleKey: 'planDavidReturn' },
    { id: 'surrender', from: 10, to: 12, titleKey: 'planDavidSurrender' },
  ],
  intro: {
    en: 'Twelve daily studies of David’s character: trust, dependence, patience, humility, loyalty, conscience, repentance, worship, gratitude, justice and surrender. Allow about 25–40 minutes for reading and observation; historical resources are optional. Follow the passages in their wider narrative, not just a list of virtues. Each study includes questions, a counterpoint, context and a written synthesis. Prayer stays short and optional. The daily schedule, progress and notes work like the other journeys.',
    fr: 'Douze études quotidiennes du caractère de David : confiance, dépendance, patience, humilité, fidélité, conscience, repentance, adoration, reconnaissance, justice et abandon à Dieu. Prévois environ 25 à 40 minutes de lecture et d’observation ; les ressources historiques sont facultatives. Replace les passages dans leur récit, au-delà d’une liste de vertus. Chaque étude propose des questions, un contrepoint, du contexte et une synthèse à noter. La prière reste courte et facultative. Le calendrier, la progression et les notes fonctionnent comme pour les autres parcours.',
  },
  biblical: {
    ref: 'Acts 13:22-23',
    text: {
      en: 'Read 1 Samuel 13:13–14 alongside Acts 13:22–23. God’s choice of David and his readiness to do God’s will do not mean approval of all his actions. Samuel also exposes his abuse of power and its victims. The course asks what the narrator actually shows, what we infer, and where David contradicts his own faith. Archaeology can illuminate his world, not certify his inner motives or prove a theological claim. In Acts, David’s story points beyond him to Jesus.',
      fr: 'Lis 1 Samuel 13:13–14 avec Actes 13:22–23. Le choix de David et sa disposition à accomplir la volonté de Dieu ne signifient pas que Dieu approuve tous ses actes. Samuel expose aussi ses abus de pouvoir et leurs victimes. Le parcours distingue ce que le narrateur montre, ce que nous en déduisons et les moments où David contredit sa foi. L’archéologie éclaire son monde ; elle ne certifie ni ses motivations intérieures ni une affirmation théologique. Dans les Actes, son histoire conduit au-delà de lui, vers Jésus.',
    },
  },
  completion: {
    en: 'You have studied twelve windows into David’s heart, not earned a certificate of character. Revisit your notes: which conclusions rest on explicit words or actions, which are interpretations, and which questions remain open? Write a balanced portrait with five character traits, a supporting passage and a counterexample for each. Keep the victims and consequences in view. Then reread Acts 13:22–23: David is part of God’s story, not its final fulfilment.',
    fr: 'Tu as étudié douze fenêtres sur le cœur de David, sans obtenir un certificat de caractère. Reprends tes notes : quelles conclusions reposent sur des paroles ou des actes explicites, lesquelles sont des interprétations, et quelles questions restent ouvertes ? Rédige un portrait nuancé avec cinq traits de caractère, un passage à l’appui et un contre-exemple pour chacun. N’oublie ni les victimes ni les conséquences. Relis enfin Actes 13:22–23 : David appartient à l’histoire de Dieu, sans en être l’accomplissement ultime.',
  },
  days: DAYS,
};

export default DAVID_HEART;
