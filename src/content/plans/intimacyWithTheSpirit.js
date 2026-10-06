// "Intimacy with the Holy Spirit — Walking in His Presence" — a 21-day guided
// prayer journey into fellowship with the Holy Spirit (see
// docs/plans/holySpirit21.md for the research note and reviewer checklist).
//
// PURPOSE: move from doctrine to dependence. The reader meets the Spirit as God
// and as a Person (never a force, energy, feeling or technique), learns to walk,
// listen and pray with Him, asks for His fruit and gifts, and lives by His
// power in the church and the world. It runs on the same engine as every other
// guided plan (src/content/prayerPlans.js); only the content is specific.
//
// GUARDRAILS (the reason this file and its days read the way they do):
//   • Qetoret never speaks for God. Impressions, dreams, feelings and inner
//     voices are TESTED — by Scripture, the character of Jesus, fruit, mature
//     counsel and humility — never assumed to be the Spirit. No personal
//     prophecy, and no predictions about marriage, pregnancy, illness, death,
//     money or politics.
//   • "God told me" is never leverage over another person; day 9's safety note
//     names "God told me you must marry me" as inconsistent with the Spirit of
//     Jesus. The Spirit's name never justifies coercion, secrecy, abandoning
//     medical or mental-health care, or silencing questions (days 8, 9, 16, 20).
//   • Spirit baptism and tongues: the Pentecostal understanding (an empowering
//     experience that can follow conversion, often with tongues) is presented
//     as such, and other Christians' reading (Spirit baptism at conversion,
//     repeated fillings) is named fairly (day 18). Tongues are never presented
//     as the initial evidence as Qetoret's position, never taught by
//     imitation, and never made a measure of whether the Spirit lives in a
//     believer (Romans 8:9; 1 Corinthians 12:13, 12:30 — days 5 and 12).
//   • Experience is welcomed but emotional intensity is never the standard:
//     God's presence is not measured by how strongly we sense it (days 13, 21).
//   • No promised outcome — no guaranteed filling, gift, healing or feeling.
//
// LOCALIZATION: `theme` is authored in all 16 languages; all other prose is
// authored in en + fr and falls back through pick(). `proseTranslations` stays
// empty until a native reviewer signs off. No Bible text is stored here —
// references only, resolved by the localized verse pipeline.
//
// VERSIONING: bump `version` when a day's meaning changes (docs/PRAYER_PLANS.md).
import { DAYS } from './intimacyWithTheSpiritDays';
import { NEW_PLAN_APPROVALS } from '../reviews/paulNewPlans20260930';

export const MOVEMENTS = [
  { id: 'know', from: 1, to: 5, titleKey: 'planHolySpiritMovementKnow' },
  { id: 'walk', from: 6, to: 10, titleKey: 'planHolySpiritMovementWalk' },
  { id: 'presence', from: 11, to: 14, titleKey: 'planHolySpiritMovementPresence' },
  { id: 'fruitGifts', from: 15, to: 17, titleKey: 'planHolySpiritMovementFruitGifts' },
  { id: 'power', from: 18, to: 21, titleKey: 'planHolySpiritMovementPower' },
];

export const INTIMACY_WITH_THE_SPIRIT = {
  id: 'holySpirit21',
  version: 1,
  count: 21,
  emoji: '🌬️',
  category: 'formation',
  resourceDomains: ['christian-living'],
  titleKey: 'planHolySpiritTitle',
  subKey: 'planHolySpiritSub',
  proseTranslations: [],
  review: NEW_PLAN_APPROVALS.holySpirit21,
  movements: MOVEMENTS,
  intro: {
    en: 'A 21-day journey into fellowship with the Holy Spirit — not a technique for experiences, but getting to know a Person: God Himself, living in everyone who belongs to Christ. You will move from who the Spirit is to walking with Him, praying with His help, growing in His fruit and gifts, and living by His power in the church and in the world. Each day takes about 10 to 15 minutes: a passage to read, a short reflection, prayer prompts and one small practice. Written from a Pentecostal and charismatic heart, it names fairly where Christians read Scripture differently. It promises no particular experience, gift or feeling; it invites you to seek God and to trust Him with the answer.',
    fr: "Un parcours de 21 jours dans la communion avec le Saint-Esprit — non une technique pour vivre des expériences, mais la rencontre d'une Personne : Dieu lui-même, qui habite en chacun de ceux qui appartiennent à Christ. Tu passeras de qui est l'Esprit à la marche avec Lui, à la prière soutenue par Lui, à la croissance dans son fruit et ses dons, puis à une vie portée par sa puissance dans l'Église et dans le monde. Chaque jour prend environ 10 à 15 minutes : un passage à lire, une courte réflexion, des pistes de prière et un petit exercice. Écrit avec un cœur pentecôtiste et charismatique, il nomme honnêtement les points où les chrétiens lisent l'Écriture différemment. Il ne promet aucune expérience, aucun don, aucun ressenti particulier ; il t'invite à chercher Dieu et à Lui confier la réponse.",
  },
  biblical: {
    ref: 'John 14:15-27',
    text: {
      en: 'On the night before the cross, Jesus promised His friends that the Spirit of truth would be with them and in them for ever, teaching them and reminding them of all He had said (John 14:15-27). The Spirit who hovered over creation (Genesis 1:2) and was promised through the prophets (Ezekiel 36:26-27; Joel 2:28) was poured out at Pentecost (Acts 2) and now lives in every believer (Romans 8:9). Paul calls believers to walk by the Spirit, to keep in step with Him and to go on being filled with Him (Galatians 5:16-25; Ephesians 5:18), and he blesses a church with the fellowship of the Holy Spirit (2 Corinthians 13:14). Intimacy with the Spirit is therefore not an extra for a few, but the ordinary Christian life lived in dependence on God.',
      fr: "La veille de la croix, Jésus promet à ses amis que l'Esprit de vérité sera avec eux et en eux pour toujours, pour les enseigner et leur rappeler tout ce qu'Il leur a dit (Jean 14:15-27). L'Esprit qui planait sur la création (Genèse 1:2), promis par les prophètes (Ézéchiel 36:26-27 ; Joël 2:28), a été répandu à la Pentecôte (Actes 2) et habite désormais en chaque croyant (Romains 8:9). Paul appelle les croyants à marcher par l'Esprit, à marcher à son pas et à se laisser sans cesse remplir de Lui (Galates 5:16-25 ; Éphésiens 5:18), et il bénit une Église par la communion du Saint-Esprit (2 Corinthiens 13:14). L'intimité avec l'Esprit n'est donc pas un supplément réservé à quelques-uns : c'est la vie chrétienne ordinaire, vécue dans la dépendance de Dieu.",
    },
  },
  completion: {
    en: 'For three weeks you have come to know the Holy Spirit as God and as a Person, practised listening and testing, prayed with His help, and asked Him for fruit, gifts and courage to witness. Whatever you felt or did not feel along the way, His presence was never measured by your sensations. Keep walking with Him in ordinary places: Scripture open, prayer honest, a church family close by. One way to continue is to welcome Him each morning and ask for grace for the next step.',
    fr: "Pendant trois semaines, tu as appris à connaître le Saint-Esprit comme Dieu et comme une Personne, tu t'es exercé à écouter et à éprouver, tu as prié avec son aide et tu Lui as demandé du fruit, des dons et le courage de témoigner. Quoi que tu aies ressenti ou non en chemin, sa présence ne s'est jamais mesurée à tes impressions. Continue de marcher avec Lui dans les lieux ordinaires : l'Écriture ouverte, une prière sincère, une famille d'Église proche. Pour poursuivre, tu peux L'accueillir chaque matin et Lui demander la grâce du pas suivant.",
  },
  days: DAYS,
};

export default INTIMACY_WITH_THE_SPIRIT;
