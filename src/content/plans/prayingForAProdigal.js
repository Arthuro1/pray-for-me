// "Praying for a Prodigal" — a 30-day guided intercession journey for someone
// who once identified with Christian faith or community and has wandered away
// (a child, spouse, brother or sister, parent, friend). Praying for someone who
// has never believed is a different plan (unbelievers30).
//
// It runs on the same engine as every other guided plan (see
// src/content/prayerPlans.js); only the content lives here and in
// ./prayingForAProdigalDays.js. Luke 15 is the spine: the Father's heart
// (1–7), persistent intercession (8–14), the intercessor's own heart — the
// elder brother, forgiveness, family pain, speech and silence (15–21) — and
// hope held with wisdom, boundaries and surrender (22–30).
//
// GUARDRAILS (the reason this file reads the way it does):
//   • It never promises a return — not during the plan, not after it, not "in
//     God's timing". Faithful prayer is trust, not leverage.
//   • It never claims to know why a particular person left. Several possible
//     reasons are named (doubt, hurt, sin, grief, trauma, mental illness, a
//     church that failed them, unanswered questions) and none is assigned;
//     leaving is never reduced to rebellion.
//   • It never coaches manipulation: no guilt-trips, pressure, ultimatums,
//     "tough love" used as leverage, covert tactics or deceiving the person.
//   • Love can say no. The boundaries day carries a safety note (violence,
//     exploitation, addiction → pastor, counsellor, addiction/family support,
//     police or emergency services); the letting-go day and the church-hurt
//     day carry their own.
//   • Grief and lament are honoured, not hurried.
//   • Every day turns the intercession back on the one praying (`selfPrompt`).
//
// LOCALIZATION: `theme` is authored in all 16 languages; the prose is authored
// in en + fr and falls back through pick() elsewhere (`proseTranslations: []`
// until overlays exist). Scripture is stored as references only.
//
// REVIEW: drafted with AI assistance on 2026-09-23; approved by Paul on
// 2026-09-30 (src/content/reviews/paulNewPlans20260930.js). Reviewer notes:
// docs/plans/prodigal30.md.
import { DAYS } from './prayingForAProdigalDays';
import { NEW_PLAN_APPROVALS } from '../reviews/paulNewPlans20260930';

export const MOVEMENTS = [
  { id: 'father', from: 1, to: 7, titleKey: 'planProdigalMovementFather' },
  { id: 'persist', from: 8, to: 14, titleKey: 'planProdigalMovementPersist' },
  { id: 'heart', from: 15, to: 21, titleKey: 'planProdigalMovementHeart' },
  { id: 'hope', from: 22, to: 30, titleKey: 'planProdigalMovementHope' },
];

export const PRAYING_FOR_A_PRODIGAL = {
  id: 'prodigal30',
  version: 1,
  count: 30,
  emoji: '🏡',
  category: 'others',
  resourceDomains: ['intercession'],
  titleKey: 'planProdigalTitle',
  subKey: 'planProdigalSub',
  proseTranslations: [],
  review: NEW_PLAN_APPROVALS.prodigal30,
  movements: MOVEMENTS,
  intro: {
    en: "These thirty days are for anyone carrying someone who once walked with Christ or His people and has since drifted or walked away: a son or daughter, a spouse, a brother or sister, a parent, a friend. You will pray through Luke 15 and the Scriptures around it — the Father's heart, persistent intercession, your own heart, and hope held with wisdom and surrender. Each day takes ten to fifteen minutes and turns every prayer for them back on you as well. The plan does not assume you know why they left, and it will never ask you to pressure them. Nor does it promise that they will return during these thirty days or at any set time; it is a way to keep loving, keep praying and entrust them to God.",
    fr: "Ces trente jours s'adressent à toute personne qui porte quelqu'un ayant un jour marché avec Christ ou avec Son peuple, et qui s'en est depuis éloigné : un fils ou une fille, un conjoint, un frère ou une sœur, un père ou une mère, un ami ou une amie. Tu prieras à partir de Luc 15 et des Écritures qui l'entourent — le cœur du Père, l'intercession persévérante, ton propre cœur, puis l'espérance vécue avec sagesse et abandon. Chaque jour prend dix à quinze minutes et retourne aussi vers toi chaque prière faite pour l'autre. Ce parcours ne suppose pas que tu saches pourquoi cette personne est partie, et il ne te demandera jamais de faire pression sur elle. Il ne promet pas non plus qu'elle reviendra pendant ces trente jours ni à une date donnée : c'est une manière de continuer à aimer, à prier, et de la confier à Dieu.",
  },
  biblical: {
    ref: 'Luke 15',
    text: {
      en: "Luke 15 is the backbone of this plan. Jesus tells three stories of the lost — a sheep, a coin and two sons — to people who grumbled that He welcomed sinners (Luke 15:1-2). The father lets his son go, watches the road, runs to meet him, and then goes out to plead with the elder brother as well: both sons need his grace. Around that chapter the plan reads the prophets' calls to return (Hosea 11 and 14, Jeremiah 3), Jesus' prayer for Peter and his restoration (Luke 22:31-32, John 21), Paul's counsel to gentleness, since repentance is God's gift (2 Timothy 2:24-26), and the patience of God (2 Peter 3:9). None of these passages promises the return of a particular person; together they show the heart of the God to whom you entrust them.",
      fr: "Luc 15 est la colonne vertébrale de ce parcours. Jésus y raconte trois histoires de perte — une brebis, une pièce et deux fils — à des gens qui murmuraient parce qu'Il accueillait les pécheurs (Luc 15:1-2). Le père laisse partir son fils, guette la route, court à sa rencontre, puis sort aussi supplier le fils aîné : les deux fils ont besoin de sa grâce. Autour de ce chapitre, le parcours lit les appels des prophètes au retour (Osée 11 et 14, Jérémie 3), la prière de Jésus pour Pierre et sa restauration (Luc 22:31-32, Jean 21), le conseil de Paul à la douceur, puisque la repentance est un don de Dieu (2 Timothée 2:24-26), et la patience de Dieu (2 Pierre 3:9). Aucun de ces passages ne promet le retour d'une personne en particulier ; ensemble, ils montrent le cœur du Dieu à qui tu la confies.",
    },
  },
  completion: {
    en: "You have spent thirty days carrying someone you love to the Father, and letting Him search your own heart along the way. Nothing in their story has to have changed for that to matter: you have prayed, grieved, forgiven and placed them again in His hands. This plan cannot tell you how or when their story will unfold, and it does not promise that it will end the way you hope. If you want to keep going, keep a regular prayer for them in your Journal — once a week is enough — and ask one trusted believer to keep praying with you.",
    fr: "Pendant trente jours, tu as porté devant le Père quelqu'un que tu aimes, et tu L'as laissé sonder ton propre cœur en chemin. Il n'est pas nécessaire que son histoire ait changé pour que cela compte : tu as prié, pleuré, pardonné, et tu as remis cette personne entre Ses mains. Ce parcours ne peut pas te dire comment ni quand son histoire se poursuivra, et il ne promet pas qu'elle finira comme tu l'espères. Si tu veux continuer, garde une prière régulière pour cette personne dans ton journal — une fois par semaine suffit — et demande à un croyant de confiance de continuer à prier avec toi.",
  },
  days: DAYS,
};

export default PRAYING_FOR_A_PRODIGAL;
