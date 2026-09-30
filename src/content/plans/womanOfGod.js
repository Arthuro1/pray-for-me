// "Woman of God" — a 21-day guided journey on biblical identity and character
// for women (see docs/plans/womanOfGod21.md for the research note).
//
// PURPOSE: womanhood as a life submitted to God and increasingly conformed to
// Christ. It is NOT a wife-and-mother plan. Every day has to be worth praying
// for a single woman, a married woman, a widow, a mother, a woman without
// children, a young adult, an older woman, a woman working in the home and a
// woman working outside it. It is built on the women of Scripture, one woman
// or passage per day, read in context — narrative describes, it does not turn
// every detail into a rule — so that it stands as its own curriculum beside
// the Man of God plan rather than a copy with pronouns swapped.
//
// GUARDRAILS (tested in ./womanOfGod.test.js):
//   • Womanhood is never defined by appearance, marriage, motherhood,
//     passivity or male approval. Identity rests on the image of God, grace,
//     union with Christ and the Spirit (days 1–5, 8, 12); motherhood appears as
//     spiritual motherhood open to women "with or without children" (day 18);
//     singleness is never a waiting room (day 20); Eve is never made the source
//     of the world's sin and women are never cast as temptresses (day 3).
//   • Proverbs 31 is read as an acrostic poem praising wisdom embodied — the
//     "woman of valour", a phrase Boaz uses of Ruth — never as a domestic
//     checklist or a standard to compare yourself with (day 6).
//   • Shared ground only on disputed gender roles. Day 12 (1 Peter 3:1-6) says
//     plainly that Christians read the call to submit differently, does not
//     decide between the readings, and keeps to what both share; days 2, 14,
//     15 and 18 name the disagreement about roles and church office in one
//     sentence each without adjudicating. Day 12 is the ONLY day tagged
//     `marriage-roles`, and is flagged for theology review.
//   • Submission never means enduring abuse: day 12 carries a safety note
//     that says so and names real help. Other safety notes, calm and pointing
//     to real help: mistreatment (4), body image and eating (8), sexual
//     coercion (10) and grief (11).
//   • No promised outcomes and no speaking for God. References only — no
//     Bible text is authored, translated or generated here.
//
// LOCALIZATION: `theme` is authored in all 16 languages; the prose is authored
// in English + French (French in the "tu" register, feminine agreement) and
// falls back through pick() for the other languages (`proseTranslations: []`
// until reviewed overlays exist).
//
// REVIEW: gated by pendingPlanReview — readable in preview only until a named
// theology and safety reviewer sign it off.
import { DAYS } from './womanOfGodDays';
import { pendingPlanReview } from '../reviews/pendingPlans20260923';

export const MOVEMENTS = [
  { id: 'before', from: 1, to: 5, titleKey: 'planWomanOfGodMovementBefore' },
  { id: 'character', from: 6, to: 10, titleKey: 'planWomanOfGodMovementCharacter' },
  { id: 'gifts', from: 11, to: 15, titleKey: 'planWomanOfGodMovementGifts' },
  { id: 'legacy', from: 16, to: 21, titleKey: 'planWomanOfGodMovementLegacy' },
];

export const WOMAN_OF_GOD = {
  id: 'womanOfGod21',
  version: 1,
  count: 21,
  emoji: '🌾',
  category: 'formation',
  resourceDomains: ['christian-living'],
  titleKey: 'planWomanOfGodTitle',
  subKey: 'planWomanOfGodSub',
  proseTranslations: [],
  review: pendingPlanReview('womanOfGod21'),
  movements: MOVEMENTS,
  intro: {
    en: "Woman of God is a 21-day journey through the lives of women in Scripture — Eve and Hagar, Ruth and Naomi, Abigail, Esther, Mary, Anna, Mary Magdalene and others — read in context, to see what it means to live as a woman before God. It is written for every woman: single, married or widowed, with or without children, young or older, working in the home or outside it. Each day takes about ten minutes: a passage, a short reflection, three prayer prompts and one small practice. It offers no single model of womanhood to copy and no checklist to meet, and it promises no particular outcome. Where Christians disagree about roles in marriage and in the church, it says so fairly and keeps to what they share.",
    fr: "« Femme de Dieu » est un parcours de 21 jours à travers la vie de femmes de l'Écriture — Ève et Agar, Ruth et Noémi, Abigaïl, Esther, Marie, Anne, Marie de Magdala et d'autres —, lues dans leur contexte, pour découvrir ce que signifie vivre en femme devant Dieu. Il s'adresse à toute femme : célibataire, mariée ou veuve, avec ou sans enfants, jeune ou plus âgée, travaillant au foyer ou à l'extérieur. Chaque jour prend une dizaine de minutes : un passage, une courte réflexion, trois pistes de prière et une petite mise en pratique. Il ne propose ni modèle unique de féminité à copier ni liste à cocher, et il ne promet aucun résultat particulier. Là où les chrétiens divergent sur les rôles dans le couple et dans l'Église, il le dit honnêtement et s'en tient à ce qu'ils ont en commun.",
  },
  biblical: {
    ref: 'Galatians 3:26-29',
    text: {
      en: "Scripture begins by saying that God created humanity male and female in His own image and blessed them together (Genesis 1:27-28). In Christ, every woman who believes is a child of God and an heir of His promise, clothed with Christ, with the same standing before God as any brother (Galatians 3:26-29). The Spirit poured out on sons and daughters at Pentecost gives gifts to each believer for the good of the church (Acts 2:17-18; 1 Corinthians 12:7). And God's purpose for every one of His children is the same: to be shaped into the likeness of His Son (Romans 8:29). That is why this plan measures womanhood by Christ — not by appearance, marriage, motherhood or anyone's approval.",
      fr: "L'Écriture s'ouvre en disant que Dieu a créé l'être humain homme et femme à Son image, et qu'Il les a bénis ensemble (Genèse 1.27-28). En Christ, toute femme qui croit est enfant de Dieu et héritière de la promesse, revêtue de Christ, avec la même position devant Dieu que n'importe lequel de ses frères (Galates 3.26-29). L'Esprit répandu à la Pentecôte sur les fils et les filles accorde des dons à chaque croyant pour le bien de l'Église (Actes 2.17-18 ; 1 Corinthiens 12.7). Et le dessein de Dieu pour chacun de Ses enfants est le même : être rendu conforme à l'image de Son Fils (Romains 8.29). C'est pourquoi ce parcours mesure la féminité au Christ — non à l'apparence, au mariage, à la maternité ou à l'approbation de qui que ce soit.",
    },
  },
  completion: {
    en: "You have spent twenty-one days with women of Scripture — seen by God in the desert, called Daughter, wise, courageous, gifted, faithful into old age, and sent with Easter news. None of them was perfect, and none was defined by her looks, her marriage or her children, but by the God she trusted. Finishing this plan does not make you more loved by God; in Christ you were already His daughter. To keep going, choose one of these women and read her whole story slowly this month, praying as you go — perhaps with a friend.",
    fr: "Tu as passé vingt et un jours avec des femmes de l'Écriture — vues par Dieu au désert, appelées « ma fille », sages, courageuses, riches de dons, fidèles jusque dans la vieillesse, envoyées avec la nouvelle de Pâques. Aucune n'était parfaite, et aucune n'était définie par son apparence, son mariage ou ses enfants, mais par le Dieu en qui elle se confiait. Terminer ce parcours ne te rend pas plus aimée de Dieu : en Christ, tu étais déjà Sa fille. Pour continuer, choisis l'une de ces femmes et lis lentement toute son histoire ce mois-ci, en priant au fil de ta lecture — peut-être avec une amie.",
  },
  days: DAYS,
};

export default WOMAN_OF_GOD;
