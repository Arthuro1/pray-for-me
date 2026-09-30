// "Identity in Christ — Who You Are Because of Jesus" — a 21-day guided journey
// of foundational discipleship (reviewer note: docs/plans/identity21.md).
//
// It runs on the same engine as every other guided plan (see
// src/content/prayerPlans.js): one recurring daily prayer capped after 21
// occurrences, numbered by `schedule.plan`, with each day's content supplied by
// `planDayContent()`. The days live in ./identityInChristDays.js.
//
// THEOLOGICAL GUARDRAILS (why the prose reads the way it does):
//   • Identity is RECEIVED, not constructed. Every claim rests on union with
//     Christ, grace, justification, adoption, sanctification and membership in
//     God's people — never on self-esteem, affirmations or "believe in yourself".
//   • No claim of present sinless perfection. "New creation" (day 8) and "free
//     from slavery to sin" (day 16) sit beside ongoing struggle, confession and
//     repentance (Romans 7–8, 1 John 1:8-9); sanctification is a process
//     ("being conformed", day 19).
//   • False sources of identity are named, not shamed: achievement, career,
//     money, appearance, relationship status, failure, shame, approval and
//     ministry success.
//   • "Child of God" and adoption (days 9–10) are written for readers with
//     painful family histories: God is not a projection of an earthly parent.
//   • "Chosen" (day 11) stays with what Ephesians 1 says — in Christ, plural,
//     for holiness and praise — and does not take a side in debates on election.
//   • "Your past is not your master" (day 17) offers grace without minimising
//     harm: it points to confession, restitution and counsel, distinguishes harm
//     done BY the reader from harm done TO them, and carries a safety note.
//   • Praystead never speaks for God and promises no outcome or feeling.
//
// LOCALIZATION: day themes are authored in all 16 languages; the longer prose
// is authored in en + fr and falls back through pick() elsewhere
// (`proseTranslations: []`). Scripture is referenced, never quoted: references
// resolve through the localized verse pipeline.
//
// VERSIONING: bump `version` whenever a day's meaning changes (see
// docs/PRAYER_PLANS.md). Day numbers and references are the stable part.
import { DAYS } from './identityInChristDays';
import { NEW_PLAN_APPROVALS } from '../reviews/paulNewPlans20260930';

export const MOVEMENTS = [
  { id: 'rescued', from: 1, to: 5, titleKey: 'planIdentityMovementRescued' },
  { id: 'united', from: 6, to: 10, titleKey: 'planIdentityMovementUnited' },
  { id: 'belonging', from: 11, to: 15, titleKey: 'planIdentityMovementBelonging' },
  { id: 'living', from: 16, to: 21, titleKey: 'planIdentityMovementLiving' },
];

export const IDENTITY_IN_CHRIST = {
  id: 'identity21',
  version: 1,
  count: 21,
  emoji: '✝️',
  category: 'formation',
  resourceDomains: ['christian-living'],
  titleKey: 'planIdentityTitle',
  subKey: 'planIdentitySub',
  proseTranslations: [],
  review: NEW_PLAN_APPROVALS.identity21,
  movements: MOVEMENTS,
  intro: {
    en: "A 21-day journey through what Scripture says is true of you because you belong to Jesus Christ: created in God's image, rescued by grace, united with Christ, adopted, joined to His people and sent. It is for new believers, and for long-time Christians whose sense of worth has quietly drifted onto work, looks, relationships, approval or ministry results. Each day takes about ten to fifteen minutes: a passage, a short reflection, prayer and one small practice. This is not a self-esteem course, and it does not promise that you will feel different. It invites you to trust what God has done in Christ and to keep growing in it, alongside your church.",
    fr: "Un parcours de 21 jours à travers ce que l'Écriture dit de toi parce que tu appartiens à Jésus-Christ : créé à l'image de Dieu, sauvé par grâce, uni à Christ, adopté, membre de Son peuple et envoyé. Il s'adresse aux nouveaux croyants, et aux chrétiens de longue date dont le sentiment de valeur a glissé peu à peu vers le travail, l'apparence, les relations, l'approbation des autres ou les fruits du ministère. Chaque jour prend environ dix à quinze minutes : un passage, une courte réflexion, la prière et une petite mise en pratique. Ce n'est pas un cours d'estime de soi, et il ne te promet pas de te sentir différent. Il t'invite à te confier en ce que Dieu a fait en Christ et à y grandir, avec ton Église.",
  },
  biblical: {
    ref: 'Ephesians 1:3-14',
    text: {
      en: "Paul's favourite way of describing a Christian is simply “in Christ.” In Ephesians 1 every blessing — being chosen, adopted, redeemed, forgiven and sealed with the Holy Spirit — comes to us in Him, to the praise of God's grace. The rest of the New Testament fills out the picture: justified by faith (Romans 5), free from condemnation (Romans 8), a new creation (2 Corinthians 5), children who call God Abba (Galatians 4), members of one body (1 Corinthians 12), with a life hidden with Christ in God (Colossians 3). This identity is received, not constructed, and it is lived out slowly — with struggle and repentance — as the Spirit conforms us to the image of the Son (Romans 8:29).",
      fr: "La manière préférée de Paul de décrire un chrétien est simplement : « en Christ ». En Éphésiens 1, chaque bénédiction — être choisi, adopté, racheté, pardonné et scellé du Saint-Esprit — nous est donnée en Lui, à la louange de la grâce de Dieu. Le reste du Nouveau Testament complète le tableau : justifiés par la foi (Romains 5), libérés de la condamnation (Romains 8), nouvelle création (2 Corinthiens 5), enfants qui appellent Dieu Abba (Galates 4), membres d'un seul corps (1 Corinthiens 12), avec une vie cachée avec Christ en Dieu (Colossiens 3). Cette identité se reçoit, elle ne se construit pas, et elle se vit lentement — à travers les combats et la repentance — tandis que l'Esprit nous rend semblables à l'image du Fils (Romains 8).",
    },
  },
  completion: {
    en: "For twenty-one days you have read what God has done to make you His: created, forgiven, united with Christ, adopted, joined to His people and sent. None of it depended on how well you prayed these days, and it does not come and go with your feelings. What may have grown is your habit of returning to it. To keep going, choose one passage from this plan each week and pray it again, perhaps with a friend from your church.",
    fr: "Pendant vingt et un jours, tu as lu ce que Dieu a fait pour faire de toi Son enfant : créé, pardonné, uni à Christ, adopté, membre de Son peuple et envoyé. Rien de tout cela n'a dépendu de la qualité de tes prières ces jours-ci, et cela ne va ni ne vient au gré de tes émotions. Ce qui a peut-être grandi, c'est ton habitude d'y revenir. Pour continuer, choisis chaque semaine un passage de ce parcours et prie-le de nouveau, pourquoi pas avec un ami de ton Église.",
  },
  days: DAYS,
};

export default IDENTITY_IN_CHRIST;
