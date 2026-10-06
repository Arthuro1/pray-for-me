// "Work, Calling & Faithfulness" — a 21-day guided prayer journey that brings
// work under Christ: paid and unpaid work, study, running a household, caring
// for others, leading, looking for work, retirement and ministry.
//
// It runs on the SAME engine as every other guided plan (see
// src/content/prayerPlans.js); only the day content is plan-specific. The days
// live in ./workAndCallingDays.js; the reviewer's research note is
// docs/plans/work21.md.
//
// THEOLOGICAL GUARDRAILS (the reason the prose reads the way it does):
//   • No prosperity promise. Diligence, generosity and faithfulness never
//     guarantee wealth, promotion, a job or success; Proverbs is read as
//     wisdom about how life usually goes, not as a contract.
//   • Calling is first a calling to Christ (1 Corinthians 7:17-24). The plan
//     never teaches that God has hidden one secret career the reader might
//     miss forever, and never ranks church ministry above other work.
//   • Unemployment, poverty, illness, disability and age are never framed as
//     God's disfavour or as a reason for shame; rest is never framed as
//     laziness, and "hustle" is never praised.
//   • Texts historically used to justify exploitation (Colossians 3:22,
//     Ephesians 6:5) are read in their setting — words to enslaved people in
//     Roman households — paired with the commands to masters (Colossians 4:1,
//     Ephesians 6:9, James 5:4), and say plainly that they endorse neither
//     slavery nor enduring abuse.
//   • Submission to authority never requires sin or enduring abuse. The
//     workplace-authority day and the Colossians day carry safety notes that
//     point to real help (HR, union, labour inspectorate, police, anti-
//     trafficking lines); the unemployment and rest days point to a pastor,
//     debt advice, a doctor or a crisis line.
//   • Every day must work for EVERY reader, so the prose says "your work —
//     paid or unpaid" and never assumes a salary, a boss or a career.
//
// LOCALIZATION: day titles are authored in all 16 languages; the prose is
// authored in English + French only (`proseTranslations: []`), so the other
// languages fall back to English through pick(). No Bible text is stored.
//
// REVIEW: drafted with AI assistance on 2026-09-23; approved by Paul on
// 2026-09-30 (src/content/reviews/paulNewPlans20260930.js).
import { DAYS } from './workAndCallingDays';
import { NEW_PLAN_APPROVALS } from '../reviews/paulNewPlans20260930';

export const MOVEMENTS = [
  { id: 'stewardship', from: 1, to: 5, titleKey: 'planWorkMovementStewardship' },
  { id: 'character', from: 6, to: 10, titleKey: 'planWorkMovementCharacter' },
  { id: 'calling', from: 11, to: 15, titleKey: 'planWorkMovementCalling' },
  { id: 'rest', from: 16, to: 21, titleKey: 'planWorkMovementRest' },
];

export const WORK_AND_CALLING = {
  id: 'work21',
  version: 1,
  count: 21,
  emoji: '🛠️',
  category: 'formation',
  resourceDomains: ['christian-living'],
  titleKey: 'planWorkTitle',
  subKey: 'planWorkSub',
  proseTranslations: [],
  review: NEW_PLAN_APPROVALS.work21,
  movements: MOVEMENTS,
  intro: {
    en: "A 21-day journey that brings your work under Christ — paid or unpaid: a job, your studies, caring for a household or for someone in need, running a business, serving in ministry, looking for work or living in retirement. Each day offers a passage to read, a short reflection, a few prayers and one small practice; allow ten to fifteen minutes. The days move from work as God's good gift, through character and calling, to limits, generosity, witness and rest. This plan does not promise success, wealth or a new job, and it will not uncover one hidden career you must find; it invites you to follow Jesus faithfully where you are.",
    fr: "Un parcours de 21 jours pour placer ton travail sous l'autorité de Christ — rémunéré ou non : un emploi, tes études, le soin d'un foyer ou d'un proche, une entreprise, un ministère, la recherche d'un emploi ou la retraite. Chaque jour propose un passage à lire, une courte réflexion, quelques sujets de prière et un petit geste concret ; compte dix à quinze minutes. Les jours vont du travail comme don de Dieu au caractère et à l'appel, puis aux limites, à la générosité, au témoignage et au repos. Ce plan ne te promet ni réussite, ni richesse, ni nouvel emploi, et il ne te dévoilera pas un unique métier caché qu'il te faudrait trouver ; il t'invite à suivre Jésus fidèlement là où tu es.",
  },
  biblical: {
    ref: 'Genesis 2:15',
    text: {
      en: "Scripture opens with God at work, and with the first humans placed in the garden to work it and keep it (Genesis 2:15; see also Genesis 1:26-28). The Fall turned work into toil but did not take away its dignity (Genesis 3:17-19), and Jesus Himself worked for years as a craftsman (Mark 6:3). Paul places everything believers say and do under the name of the Lord Jesus, with thanksgiving (Colossians 3:17), whether they are traders, teachers, students or at home. The same Scriptures set limits on work through the Sabbath (Deuteronomy 5:12-15), and they assure believers that work done in the Lord is never wasted (1 Corinthians 15:58).",
      fr: "L'Écriture s'ouvre sur un Dieu qui travaille, et sur les premiers humains placés dans le jardin pour le cultiver et le garder (Genèse 2:15 ; voir aussi Genèse 1:26-28). La chute a fait du travail un labeur, sans lui retirer sa dignité (Genèse 3:17-19), et Jésus lui-même a travaillé des années comme artisan (Marc 6:3). Paul place tout ce que disent et font les croyants sous le nom du Seigneur Jésus, avec reconnaissance (Colossiens 3:17), qu'ils soient commerçants, enseignants, étudiants ou au foyer. Les mêmes Écritures posent des limites au travail par le sabbat (Deutéronome 5:12-15), et elles assurent aux croyants que le travail accompli dans le Seigneur n'est jamais perdu (1 Corinthiens 15:58).",
    },
  },
  completion: {
    en: "Across these twenty-one days you have brought your work before God: its dignity and its thorns, your character and ambitions, your decisions, your limits, your generosity, your witness and your rest. Nothing here guarantees a promotion, a job or an easier season, and your calling does not depend on any of them. What remains is the first calling — to belong to Jesus and to follow Him wherever you work. To keep going, choose one prayer from this plan and pray it at the start of each working week, or meet a friend now and then to pray about your work together.",
    fr: "Au fil de ces vingt et un jours, tu as présenté ton travail à Dieu : sa dignité et ses épines, ton caractère et tes ambitions, tes décisions, tes limites, ta générosité, ton témoignage et ton repos. Rien ici ne garantit une promotion, un emploi ou une saison plus facile, et ton appel ne dépend d'aucune de ces choses. Ce qui demeure, c'est le premier appel : appartenir à Jésus et Le suivre, où que tu travailles. Pour continuer, choisis une prière de ce plan et reprends-la au début de chaque semaine de travail, ou retrouve de temps en temps un ami pour prier ensemble au sujet du travail de chacun.",
  },
  days: DAYS,
};

export default WORK_AND_CALLING;
