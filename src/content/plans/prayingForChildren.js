// "Praying for Children & the Next Generation" — a 21-day guided prayer plan for
// any adult who loves children: parents, grandparents, guardians, godparents,
// teachers, mentors, spiritual parents and every Christian who cares about the
// next generation. Research note for reviewers: docs/plans/children21.md.
//
// It runs on the same engine as every other guided plan (see
// src/content/prayerPlans.js): starting it creates one recurring daily prayer
// capped after 21 occurrences, and `planDayContent()` supplies the day. Four
// movements carry the reader from belonging to God, through character and
// relationships, to calling and surrender.
//
// THEOLOGICAL GUARDRAILS (the reason this file reads the way it does):
//   • Children belong to God; adults are stewards, not owners of their future.
//     Prayer is trust, not leverage: nothing here promises a child's
//     conversion, health, safety, success, marriage, vocation or prosperity,
//     and a child's choices are never presented as a verdict on the adults.
//   • Proverbs describes how wisdom usually works; it is never read as an
//     unconditional promise (day 7 says so explicitly about Proverbs 22:6).
//   • Prompts pray FOR children, never for control over them, and respect
//     each child's own personhood and eventual choices. Every day turns the
//     prayer back on the adult (`selfPrompt`).
//   • Protection and sexuality (days 13–14) carry safety notes: prayer goes
//     together with action — emergency services, police, child-protection
//     services, safeguarding procedures — and no child's details belong in
//     the app. Sexuality is handled without shame; the digital day aims for
//     wisdom, not fear; no stereotypes about boys or girls.
//   • The intro welcomes those without children of their own, those who long
//     for children or have lost a child, and those whose child is far away.
//   • Praystead never speaks for God. Hannah (day 21) is read as narrative:
//     her vow was hers, and the plan draws only its posture of surrender.
//
// LOCALIZATION: `theme` is authored in all 16 languages inline; prose is
// authored in en + fr (`proseTranslations: []`), other languages fall back to
// English through pick(). Scripture is stored as references only.
import { DAYS } from './prayingForChildrenDays';
import { NEW_PLAN_APPROVALS } from '../reviews/paulNewPlans20260930';

export const MOVEMENTS = [
  { id: 'belonging', from: 1, to: 5, titleKey: 'planChildrenMovementBelonging' },
  { id: 'character', from: 6, to: 10, titleKey: 'planChildrenMovementCharacter' },
  { id: 'relationships', from: 11, to: 15, titleKey: 'planChildrenMovementRelationships' },
  { id: 'calling', from: 16, to: 21, titleKey: 'planChildrenMovementCalling' },
];

export const PRAYING_FOR_CHILDREN = {
  id: 'children21',
  version: 1,
  count: 21,
  emoji: '🧒',
  category: 'relationships',
  resourceDomains: ['relationships'],
  titleKey: 'planChildrenTitle',
  subKey: 'planChildrenSub',
  proseTranslations: [],
  review: NEW_PLAN_APPROVALS.children21,
  movements: MOVEMENTS,
  intro: {
    en: "This plan is for anyone who loves children and wants to pray for them: parents, grandparents, guardians, godparents, teachers, mentors, spiritual parents and every Christian who cares about the next generation. Over 21 days, about ten minutes a day, you will read a passage in its context, pray for children's faith, character, relationships and calling, and then turn each day's prayer back on your own heart. The children you pray for belong to God; we are stewards, not owners of their future. Prayer is trust, not leverage: it does not guarantee a child's faith, safety, health or success, and a child's choices are not a verdict on you. If you long for children, have lost a child, or love one who is far from God or from you, you are welcome here as you are.",
    fr: "Ce parcours s'adresse à toute personne qui aime des enfants et veut prier pour eux : parents, grands-parents, tuteurs, parrains et marraines, enseignants, mentors, parents spirituels, et tout chrétien soucieux de la génération qui vient. Pendant 21 jours, environ dix minutes par jour, tu liras un passage dans son contexte, tu prieras pour la foi, le caractère, les relations et la vocation des enfants, puis tu tourneras chaque prière vers ton propre cœur. Les enfants pour qui tu pries appartiennent à Dieu ; nous veillons sur eux, mais leur avenir ne nous appartient pas. La prière est un acte de confiance, non un moyen de pression : elle ne garantit ni la foi d'un enfant, ni sa sécurité, ni sa santé, ni sa réussite, et les choix d'un enfant ne sont pas un verdict sur toi. Si tu désires des enfants, si tu as perdu un enfant, ou si tu en aimes un qui s'est éloigné de Dieu ou de toi, tu as ta place ici, tel que tu es.",
  },
  biblical: {
    ref: 'Psalm 127',
    text: {
      en: "Psalm 127 sets the foundation: building and guarding are futile without the LORD, and children are His heritage, a gift received rather than a result produced. Deuteronomy 6 and Psalm 78 place the passing on of faith in the ordinary life of one generation with the next, and 2 Timothy 1 shows that faith can be lived before a child but must become their own. In Mark 10 Jesus welcomes children, blesses them and rebukes those who keep them away, and in Matthew 18 He warns with great severity against anyone who harms them. Hannah's story in 1 Samuel 1 is unique, yet it shows the posture this plan invites: giving back to God the child He first gave.",
      fr: "Le Psaume 127 pose le fondement : bâtir et garder sont vains sans l'Éternel, et les enfants sont Son héritage, un don reçu plutôt qu'un résultat obtenu. Deutéronome 6 et le Psaume 78 situent la transmission de la foi dans la vie ordinaire, d'une génération à l'autre, et 2 Timothée 1 montre que la foi peut être vécue sous les yeux d'un enfant, mais qu'elle doit devenir la sienne. En Marc 10, Jésus accueille les enfants, les bénit et reprend ceux qui les tiennent à distance ; en Matthieu 18, Il met en garde avec une grande sévérité quiconque leur fait du mal. L'histoire d'Anne en 1 Samuel 1 est unique, mais elle montre l'attitude à laquelle ce parcours invite : rendre à Dieu l'enfant qu'Il a d'abord donné.",
    },
  },
  completion: {
    en: "You have spent 21 days bringing children to Jesus: their belonging to God, their character, their friendships and safety, their gifts and their future. Nothing in these days guarantees how their stories will unfold, but again and again you have placed them in the hands of the One who loved them first. Keep their names where you pray, and return to a movement of this plan whenever a child's season changes. You might also tell a child, in words they understand, that you pray for them and that they can ask you to pray about anything.",
    fr: "Pendant 21 jours, tu as amené des enfants à Jésus : leur appartenance à Dieu, leur caractère, leurs amitiés et leur sécurité, leurs dons et leur avenir. Rien dans ce parcours ne garantit la suite de leur histoire, mais, jour après jour, tu les as remis entre les mains de Celui qui les a aimés le premier. Garde leurs prénoms là où tu pries, et reviens à l'une des étapes de ce parcours quand la saison d'un enfant change. Tu peux aussi dire à un enfant, avec des mots à sa portée, que tu pries pour lui et qu'il peut te demander de prier pour n'importe quel sujet.",
  },
  days: DAYS,
};

export default PRAYING_FOR_CHILDREN;
