// "The Fruit of the Spirit" — a 10-day guided prayer plan in Galatians 5.
//
// Day 1 reads Galatians 5:13-26 in context (freedom for love, flesh against
// Spirit); days 2-10 take the nine qualities Paul names, one a day, each from a
// passage read in its own setting, and day 10 closes on keeping in step with
// the Spirit (Galatians 5:24-25). Every day runs the same rhythm: receive
// (reflection), examine (selfPrompt), pray (prompts), practise (practice).
//
// It runs on the SAME engine as every other guided plan (see
// src/content/prayerPlans.js); only the content lives here and in
// ./fruitOfTheSpiritDays.js.
//
// THEOLOGICAL GUARDRAILS (the reason this file reads the way it does):
//   • Not moralism. The Spirit produces the fruit; we walk by the Spirit, sow
//     to the Spirit, abide in Christ. Effort is real (Galatians 5:16,
//     1 Corinthians 9:24-27) but it is a response to grace, never
//     self-salvation, and the plan never scores the reader.
//   • One fruit, one Spirit, the portrait of Christ — not nine personality
//     traits. The three movements (a traditional teaching aid, not Paul's own
//     structure) group the nine without separating them.
//   • No perfectionism, no shame: the daily self-examination is honest and
//     gracious. Joy is not forced happiness; peace is not denial of conflict or
//     grief; patience is not tolerating abuse; kindness and gentleness are not
//     passivity toward harm (gentleness can confront, Galatians 6:1);
//     self-control is not suppressing emotion.
//   • Days 5 and 9 carry a safety note: these virtues never require anyone to
//     stay in danger or keep silent about harm.
//   • Promises nothing — not a changed feeling, not visible growth in ten days —
//     and Praystead never speaks for God.
//
// LOCALIZATION: `theme` is authored in all 16 languages; prose is authored in
// en + fr and falls back through pick() for the other languages
// (`proseTranslations: []` until reviewed overlays exist). Scripture is stored
// as references only and resolves through the localized verse pipeline.
//
// VERSIONING: bump `version` whenever a day's meaning changes (see
// docs/PRAYER_PLANS.md). Research note: docs/plans/fruit10.md.
import { DAYS } from './fruitOfTheSpiritDays';
import { NEW_PLAN_APPROVALS } from '../reviews/paulNewPlans20260930';

export const MOVEMENTS = [
  { id: 'spirit', from: 1, to: 4, titleKey: 'planFruitMovementSpirit' },
  { id: 'others', from: 5, to: 7, titleKey: 'planFruitMovementOthers' },
  { id: 'steadfast', from: 8, to: 10, titleKey: 'planFruitMovementSteadfast' },
];

export const FRUIT_OF_THE_SPIRIT = {
  id: 'fruit10',
  version: 1,
  count: 10,
  emoji: '🍇',
  category: 'formation',
  resourceDomains: ['christian-living'],
  titleKey: 'planFruitTitle',
  subKey: 'planFruitSub',
  proseTranslations: [],
  review: NEW_PLAN_APPROVALS.fruit10,
  movements: MOVEMENTS,
  intro: {
    en: "Ten days in Galatians 5 and the passages around it: one day on life in the Spirit, then one for each part of the fruit Paul names. It is for any believer who wants to grow in Christlike character — not by working harder through a checklist, but by walking with the Spirit who produces it. Each day takes about ten to fifteen minutes: a short reflection, a moment of honest self-examination, prayer, and one small practice. It makes no promise about how you will feel after ten days; fruit grows slowly, and it is the Spirit's work, not a score to keep.",
    fr: "Dix jours dans Galates 5 et les passages qui l'entourent : un jour sur la vie selon l'Esprit, puis un jour pour chaque aspect du fruit que Paul nomme. Ce parcours s'adresse à tout croyant qui désire grandir dans un caractère semblable à celui de Christ — non en s'acharnant sur une liste à cocher, mais en marchant avec l'Esprit qui produit ce fruit. Chaque jour prend environ dix à quinze minutes : une courte réflexion, un moment d'examen honnête, la prière et une petite action concrète. Il ne te promet pas de te sentir différent au bout de dix jours : le fruit pousse lentement, et c'est l'œuvre de l'Esprit, pas un score à tenir.",
  },
  biblical: {
    ref: 'Galatians 5:22-23',
    text: {
      en: "Paul sets the fruit of the Spirit against the works of the flesh in a letter about freedom: believers set free by Christ are not to return to the law as a ladder to God, nor to use their freedom as cover for selfishness (Galatians 5:1, 5:13). The nine qualities he names are one fruit of one Spirit, a portrait of Christ being formed in His people (Galatians 4:19). Jesus described the same reality as branches bearing fruit by remaining in the vine (John 15:1-8), and Paul says that God's love has been poured into our hearts through the Holy Spirit (Romans 5:5). Our part is real — to walk by the Spirit, to sow to the Spirit and to keep in step with Him (Galatians 5:16, 5:25, 6:8) — but the growth is His.",
      fr: "Paul oppose le fruit de l'Esprit aux œuvres de la chair dans une lettre consacrée à la liberté : les croyants affranchis par Christ ne doivent ni revenir à la loi comme à une échelle pour atteindre Dieu, ni faire de leur liberté un prétexte à l'égoïsme (Galates 5.1, 13). Les neuf qualités qu'il nomme forment un seul fruit d'un seul Esprit, le portrait de Christ formé en Son peuple (Galates 4.19). Jésus décrivait la même réalité avec les sarments qui portent du fruit en demeurant attachés au cep (Jean 15.1-8), et Paul affirme que l'amour de Dieu a été répandu dans nos cœurs par le Saint-Esprit (Romains 5.5). Notre part est réelle — marcher selon l'Esprit, semer pour l'Esprit et marcher à Son pas (Galates 5.16, 25 ; 6.8) —, mais la croissance vient de Lui.",
    },
  },
  completion: {
    en: 'You have spent ten days with the fruit of the Spirit: love, joy, peace, patience, kindness, goodness, faithfulness, gentleness and self-control. You have brought honest questions about your own heart to God, prayed for others and taken small, concrete steps. Fruit grows over seasons, not days, so there is no score to check. One way to continue: each evening this week, ask the Spirit to show you where one part of the fruit grew that day, or where you need to come back to Christ for grace.',
    fr: "Tu as passé dix jours avec le fruit de l'Esprit : l'amour, la joie, la paix, la patience, la bonté, la bienveillance, la fidélité, la douceur et la maîtrise de soi. Tu as apporté à Dieu des questions honnêtes sur ton propre cœur, tu as prié pour d'autres et tu as fait de petits pas concrets. Le fruit grandit au fil des saisons, et non des jours : il n'y a pas de score à vérifier. Pour continuer : chaque soir de cette semaine, demande à l'Esprit de te montrer où l'un des aspects du fruit a grandi dans ta journée, ou bien où tu as besoin de revenir à Christ pour recevoir Sa grâce.",
  },
  days: DAYS,
};

export default FRUIT_OF_THE_SPIRIT;
