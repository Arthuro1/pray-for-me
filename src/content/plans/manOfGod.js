// "Man of God" — a 21-day guided journey on biblical identity and character
// for men (see docs/plans/manOfGod21.md for the research note).
//
// PURPOSE: manhood as a life submitted to God and increasingly conformed to
// Christ. It is NOT a marriage-role plan. Every day has to be worth praying for
// a single man, a married man, a father, a man without children, a young adult,
// an old man, a leader and a man with no title — so marriage appears on one day
// (13) and fatherhood as spiritual fatherhood (19), each with an explicit word
// to the men they do not describe. It is built on male biblical examples and
// on pressures men commonly name, so that it stands as its own curriculum
// beside the Woman of God plan rather than a copy with pronouns swapped.
//
// GUARDRAILS (tested in ./manOfGod.test.js):
//   • Shared ground only on disputed gender roles. Day 13 (Ephesians 5) says
//     plainly that Christians read "head" differently, does not decide
//     between the readings, and keeps to what both share: Christlike,
//     self-giving love, humility, service, never harshness or control. It is
//     the ONLY day tagged `marriage-roles`, and is flagged for theology review.
//   • No masculine stereotypes: tears and emotional honesty are modelled by
//     Jesus and David (day 4); strength is self-mastery and strength spent for
//     others, never violence or domination (days 1, 9, 14); wealth is never a
//     measure of a man (day 15); marriage and fatherhood are never required for
//     full manhood (days 13, 19); women are persons to honour, never objects or
//     "temptresses" (days 8, 10, 12).
//   • Safety notes, calm and pointing to real help, on the days that touch
//     despair (4), sexuality and pornography (8), anger (9), abuse of power
//     (10) and the misuse of Ephesians 5 (13).
//   • No promised outcomes and no speaking for God. References only — no
//     Bible text is authored, translated or generated here.
//
// LOCALIZATION: `theme` is authored in all 16 languages; the prose is authored
// in English + French and falls back through pick() for the other languages
// (`proseTranslations: []` until reviewed overlays exist).
//
// REVIEW: gated by pendingPlanReview — readable in preview only until a named
// theology and safety reviewer sign it off.
import { DAYS } from './manOfGodDays';
import { pendingPlanReview } from '../reviews/pendingPlans20260923';

export const MOVEMENTS = [
  { id: 'before', from: 1, to: 5, titleKey: 'planManOfGodMovementBefore' },
  { id: 'character', from: 6, to: 10, titleKey: 'planManOfGodMovementCharacter' },
  { id: 'relationships', from: 11, to: 15, titleKey: 'planManOfGodMovementRelationships' },
  { id: 'legacy', from: 16, to: 21, titleKey: 'planManOfGodMovementLegacy' },
];

export const MAN_OF_GOD = {
  id: 'manOfGod21',
  version: 1,
  count: 21,
  emoji: '🌳',
  category: 'formation',
  resourceDomains: ['christian-living'],
  titleKey: 'planManOfGodTitle',
  subKey: 'planManOfGodSub',
  proseTranslations: [],
  review: pendingPlanReview('manOfGod21'),
  movements: MOVEMENTS,
  intro: {
    en: "A 21-day journey for men who want to live before God and be shaped, slowly, into the likeness of Christ. It is for single and married men, fathers and men without children, young and old, men who lead and men who hold no title at all. Each day takes ten to fifteen minutes: a passage read in its context, a short reflection, three prayer prompts and one small practice. You will walk with Adam, Jesus, Peter, Joseph, David, Jonathan, Nehemiah, Daniel, Paul and Timothy. The plan offers no formula for success and no promise of quick change — only a place to pray honestly and keep walking.",
    fr: "Un parcours de 21 jours pour les hommes qui veulent vivre devant Dieu et être peu à peu transformés à l'image de Christ. Il s'adresse aux célibataires comme aux hommes mariés, aux pères comme aux hommes sans enfants, aux jeunes comme aux plus âgés, à ceux qui dirigent comme à ceux qui n'ont aucun titre. Chaque jour prend dix à quinze minutes : un passage lu dans son contexte, une courte méditation, trois pistes de prière et une petite action. Tu marcheras avec Adam, Jésus, Pierre, Joseph, David, Jonathan, Néhémie, Daniel, Paul et Timothée. Ce parcours n'offre ni recette de réussite ni promesse de changement rapide — seulement un lieu pour prier en vérité et continuer d'avancer.",
  },
  biblical: {
    ref: '1 Timothy 6:11-12',
    text: {
      en: "The title comes from 1 Timothy 6, where Paul calls Timothy a man of God and defines that by what he flees and what he pursues — not by rank, strength or wealth. Genesis 1–2 grounds every man's dignity in bearing God's image, and his calling in serving and guarding what God entrusts to him. Jesus is the measure of a man: the beloved Son who wept, served and gave Himself up (John 13; Ephesians 5:25). By the Spirit (2 Timothy 1:7), men are formed alongside brothers and sisters rather than alone, and called to finish faithfully (2 Timothy 4:7).",
      fr: "Le titre vient de 1 Timothée 6, où Paul appelle Timothée « homme de Dieu » et le définit par ce qu'il fuit et ce qu'il recherche — non par le rang, la force ou la richesse. Genèse 1–2 fonde la dignité de tout homme sur le fait de porter l'image de Dieu, et sa vocation sur le service et la garde de ce que Dieu lui confie. Jésus est la mesure d'un homme : le Fils bien-aimé qui a pleuré, servi et s'est livré (Jean 13 ; Éphésiens 5.25). Par l'Esprit (2 Timothée 1.7), les hommes sont formés avec leurs frères et sœurs plutôt que seuls, et appelés à finir fidèlement (2 Timothée 4.7).",
    },
  },
  completion: {
    en: "You have spent twenty-one days before God as a man: made in His image, called His son in Christ, faced with your sin and met by grace, and led into friendship, service and faithfulness. Nothing here means the struggles you named are over; growth in Christ is slow, and it happens in company. If one day stayed with you, return to its passage next week and pray it again. Consider asking another man to walk through this plan with you, and pray for each other as you go.",
    fr: "Tu as passé vingt et un jours devant Dieu en tant qu'homme : créé à Son image, appelé fils en Christ, confronté à ton péché et rejoint par la grâce, conduit vers l'amitié, le service et la fidélité. Rien de tout cela ne signifie que les combats que tu as nommés sont terminés ; la croissance en Christ est lente, et elle se vit à plusieurs. Si un jour t'a marqué, reviens à son passage la semaine prochaine et prie-le de nouveau. Tu pourrais proposer à un autre homme de refaire ce parcours avec toi, et prier l'un pour l'autre en chemin.",
  },
  days: DAYS,
};

export default MAN_OF_GOD;
