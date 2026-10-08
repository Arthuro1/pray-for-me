// "At the Altar: Learning to Carry Prayer" — ten days with Zechariah at the altar
// of incense (Luke 1:5-25, 57-80), the primary story behind Qetoret's name and
// identity (docs/QETORET_IDENTITY.md §2).
//
// PURPOSE: to help believers live inside the shape of that story — called before
// God, praying faithfully alongside others, carrying a prayer for years, waiting
// when nothing changes, and seeing a personal answer serve God's larger purpose.
//
// THEOLOGICAL GUARDRAILS (why the prose reads the way it does):
//   • Access to God is through Christ, the Great High Priest — never through the
//     incense, the plan or the app (days 1 and 2 say so).
//   • Persistence is faithfulness, not leverage: no day suggests that waiting,
//     repetition or righteousness earns an answer (days 4, 5 and 7).
//   • Luke does not specify which prayer was "heard"; day 4 says so instead of
//     overstating the text.
//   • God's timing is trusted, not explained: day 7 refuses the formula that
//     every delay hides a plan we will understand.
//   • A personal answer can serve a Kingdom purpose (day 8) without making
//     personal prayer small; testimony is remembrance, not boasting (day 9).
//   • Nothing promises an outcome, and Qetoret never speaks for God. No Bible
//     text is stored here — references only, resolved by the verse pipeline.
//
// REVIEW: the user's explicit approval under Paul's name on 2026-10-08 covers
// this v1 presentation, theology, safety and all sixteen language presentations.
// Provenance is recorded in reviews/paulPlanReviews20261008.js.
//
// LOCALIZATION: day titles in all 16 languages; prose in en + fr, falling back
// through pick() elsewhere (`proseTranslations: []`).
import { DAYS } from './atTheAltarDays';
import { AT_THE_ALTAR_APPROVAL } from '../reviews/paulPlanReviews20261008';

export const MOVEMENTS = [
  { id: 'altar', from: 1, to: 3, titleKey: 'planZechariahMovementAltar' },
  { id: 'waiting', from: 4, to: 7, titleKey: 'planZechariahMovementWaiting' },
  { id: 'purpose', from: 8, to: 10, titleKey: 'planZechariahMovementPurpose' },
];

export const AT_THE_ALTAR_REVIEW = AT_THE_ALTAR_APPROVAL;

export const AT_THE_ALTAR = {
  id: 'zechariah10',
  version: 1,
  count: 10,
  emoji: '🕯️',
  category: 'formation',
  primaryCircle: 'self',
  circles: ['self', 'people', 'household', 'kingdom'],
  resourceDomains: ['christian-living'],
  titleKey: 'planZechariahTitle',
  subKey: 'planZechariahSub',
  proseTranslations: [],
  review: AT_THE_ALTAR_REVIEW,
  movements: MOVEMENTS,
  intro: {
    en: 'Ten days with Zechariah at the altar of incense. His story holds much of what a life of prayer is: coming before God because you are called, offering prayer faithfully, praying alongside others, carrying a prayer for years, waiting when nothing changes, and seeing a personal answer serve a purpose larger than yourself. Each day offers a short reflection, prayers for others, one question for your own heart and a small practice. Allow about fifteen minutes. The plan does not promise that your prayers will be answered as you hope; it invites you to keep coming before God and to trust Him with the rest.',
    fr: 'Dix jours avec Zacharie à l’autel des parfums. Son histoire contient une grande part de ce qu’est une vie de prière : venir devant Dieu parce que l’on est appelé, offrir la prière avec fidélité, prier aux côtés des autres, porter une prière pendant des années, attendre quand rien ne change, et voir une réponse personnelle servir un dessein plus grand que soi. Chaque jour propose une courte méditation, des sujets de prière pour les autres, une question pour ton propre cœur et une petite pratique. Compte environ quinze minutes. Ce parcours ne promet pas que tes prières seront exaucées comme tu l’espères ; il t’invite à continuer de venir devant Dieu et à Lui confier le reste.',
  },
  biblical: {
    ref: 'Luke 1:5-25',
    text: {
      en: 'Luke opens his Gospel in the Temple, at the hour of incense. Zechariah, an elderly priest, is chosen by lot to burn incense in the sanctuary while the people pray outside (Luke 1:8-10). There Gabriel tells him that his prayer has been heard and that Elizabeth will bear a son, John, who will prepare the way for the Lord (Luke 1:13-17). The scene gathers images found across Scripture: the regular incense of Exodus 30, prayer set before God like incense in Psalm 141:2, and the prayers of God’s people rising before Him in Revelation 5:8 and 8:3-4.',
      fr: 'Luc ouvre son Évangile dans le Temple, à l’heure du parfum. Zacharie, un prêtre âgé, est désigné par le sort pour offrir le parfum dans le sanctuaire pendant que le peuple prie au-dehors (Luc 1:8-10). Là, Gabriel lui annonce que sa prière a été entendue et qu’Élisabeth lui donnera un fils, Jean, qui préparera le chemin du Seigneur (Luc 1:13-17). La scène rassemble des images présentes dans toute l’Écriture : le parfum régulier d’Exode 30, la prière placée devant Dieu comme l’encens au Psaume 141:2, et les prières du peuple de Dieu qui montent devant Lui en Apocalypse 5:8 et 8:3-4.',
    },
  },
  completion: {
    en: 'You have walked with Zechariah from the altar to the birth of John: called before God, praying with others, carrying a prayer a long time, waiting, and seeing an answer become part of God’s larger work. Nothing in these days was a technique to make God act; it was practice in returning to Him. Keep carrying the prayers on your heart, record what you see God do, and ask regularly whether there is a faithful next step.',
    fr: 'Tu as marché avec Zacharie de l’autel jusqu’à la naissance de Jean : appelé devant Dieu, priant avec d’autres, portant une prière longtemps, attendant, et voyant une réponse s’inscrire dans l’œuvre plus vaste de Dieu. Rien dans ces jours n’était une technique pour faire agir Dieu ; c’était un apprentissage du retour vers Lui. Continue de porter les prières que tu as sur le cœur, note ce que tu vois Dieu faire, et demande-toi régulièrement s’il y a un pas fidèle à faire.',
  },
  days: DAYS,
};

export default AT_THE_ALTAR;
