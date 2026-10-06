// "Preparing in Prayer" — a 21-day guided journey for single believers.
//
// The plan runs on the SAME engine as every other guided plan (see
// src/content/prayerPlans.js): starting it creates ONE recurring daily prayer
// capped after 21 occurrences, `schedule.plan = { id, startDate }` numbers the
// days, and `planDayContent()` supplies the day. Only the CONTENT is richer —
// a day here may carry a reflection, prayer prompts, a self-prompt, a small
// practice, related passages and resource topics. Every one of those fields is
// optional, so the older plans keep rendering exactly as before.
//
// THEOLOGICAL GUARDRAIL (the reason this file reads the way it does): the plan
// must never promise marriage, and must stay worth praying if the reader never
// marries. So it speaks of "a possible future marriage" and "the person you may
// one day marry", it mirrors every intercession back onto the reader, and it
// begins and ends with God rather than with a spouse. Wording that would imply
// a spouse exists, is "out there", or is on the way does not belong here.
//
// LOCALIZATION follows the conventions already used by this repo:
//   • `theme` (the day's short title) is AUTHORED in all 16 languages inline,
//     exactly like the other plans' day themes.
//   • The longer prose (intro, biblical, reflections, prompts, practices, role
//     reflections, completion) is authored in English + French here and folded
//     in for the other languages from lazy JSON overlays — see
//     src/content/plans/translations.js. Anything without an overlay falls back
//     through pick() to en/fr, so the plan is never blank or half-translated.
//   • Scripture references stay language-neutral and resolve through the
//     existing localized verse pipeline (localizeRef + VerseAccordion). No
//     Bible text is ever authored, translated or generated here.
//
// VERSIONING: `version` is bumped whenever a day's meaning changes (see
// docs/PRAYER_PLANS.md). Day numbering, ids and Scripture references are the
// stable part — a running plan keeps working across a content revision.

import { DAYS } from './preparingInPrayerDays';

// The four movements. Kept in the content model (each day names its movement)
export const MOVEMENTS = [
  { id: 'rooted', from: 1, to: 5, titleKey: 'planPreparingMovementRooted' },
  { id: 'becoming', from: 6, to: 10, titleKey: 'planPreparingMovementBecoming' },
  { id: 'intercede', from: 11, to: 17, titleKey: 'planPreparingMovementIntercede' },
  { id: 'surrender', from: 18, to: 21, titleKey: 'planPreparingMovementSurrender' },
];

// What a user can carry on as ordinary recurring prayers after day 21 (§ the
// completion step). These are plain prayer requests built from i18n keys, so
// they arrive in the reader's own language and then behave like anything else
// in the Journal.
export const CONTINUE_THEMES = [
  { id: 'walk', titleKey: 'planPreparingContinueWalk', descKey: 'planPreparingContinueWalkDesc' },
  { id: 'character', titleKey: 'planPreparingContinueCharacter', descKey: 'planPreparingContinueCharacterDesc' },
  { id: 'spouse', titleKey: 'planPreparingContinueSpouse', descKey: 'planPreparingContinueSpouseDesc' },
  { id: 'community', titleKey: 'planPreparingContinueCommunity', descKey: 'planPreparingContinueCommunityDesc' },
];

export const PREPARING_IN_PRAYER = {
  id: 'preparing21',
  emoji: '🌱',
  count: 21,
  version: 1,
  category: 'relationships',
  // Relationship material only: deliverance and freedom titles share topics like
  // 'healing', 'forgiveness' and 'family-line' with these days, and belong on
  // their own plan's shelf rather than this one.
  resourceDomains: ['relationships'],
  lifeStage: 'single',
  titleKey: 'planPreparingTitle',
  subKey: 'planPreparingSub',
  // This plan's prose is translated into the other 14 languages as overlays
  // (src/content/plans/translations/<lang>.json). The flag is what tells the
  // loader an overlay is worth fetching for this plan at all.
  proseTranslations: true,
  // Asks only the two choices that affect day one: optional role wording and
  // resource-ranking growth areas. Everything is optional and prefilled.
  onboarding: 'preparing',
  // Content-free product events, opt-in per plan. The names must exist on the
  // EVENTS allowlist in src/lib/analytics.js — they are plain strings here so
  // this content module stays free of app imports. Nothing a person writes,
  // records, prays or answers is ever attached to them.
  analyticsEvents: {
    started: 'singles_plan_started',
    dayCompleted: 'singles_plan_day_completed',
    completed: 'singles_plan_completed',
  },
  movements: MOVEMENTS,
  continueThemes: CONTINUE_THEMES,
  intro: {
    en: "Seek God over twenty-one days, whether or not you ever marry. This Scripture-based journey does not promise a spouse. Spend five days rooting your life in God, five asking Him to shape your character, seven praying for someone you may one day marry, and four entrusting your future to Him.",
    fr: "Cherche Dieu pendant vingt et un jours, que tu te maries un jour ou non. Ce parcours biblique ne promet pas de conjoint. Consacre cinq jours à enraciner ta vie en Dieu, cinq à Lui demander de former ton caractère, sept à prier pour une personne que tu épouseras peut-être, et quatre à Lui confier ton avenir.",
  },
  biblical: {
    ref: 'Matthew 6:31-34',
    text: {
      en: "To a crowd worried about what they lacked, Jesus said: seek first the kingdom of God and his righteousness, and all these things will be added to you (Matthew 6:33). Scripture never makes marriage the goal of a life. Paul calls both marriage and singleness gifts, and tells each believer to walk in the life the Lord has assigned (1 Corinthians 7:7, 17). Psalm 37 invites us to delight in the LORD and commit our way to Him rather than to seize what we want. So in this plan we pray honestly about marriage — and still put the kingdom first.",
      fr: "À une foule inquiète de ce qui lui manquait, Jésus a dit : cherchez premièrement le royaume de Dieu et sa justice, et toutes ces choses vous seront données par-dessus (Matthieu 6:33). L'Écriture ne fait jamais du mariage le but d'une vie. Paul appelle le mariage et le célibat des dons, et invite chacun à marcher dans la vie que le Seigneur lui a assignée (1 Corinthiens 7:7, 17). Le Psaume 37 nous invite à faire nos délices de l'Éternel et à Lui remettre notre voie plutôt qu'à saisir ce que nous voulons. Dans ce parcours, nous prions donc honnêtement au sujet du mariage — en gardant le royaume à la première place.",
    },
  },
  completion: {
    en: "You have spent twenty-one days seeking God and praying about a marriage that may or may not come. These prayers do not oblige God to give you a spouse. Keep praying with Scripture, bringing Him your desires and keeping Christ at the centre of your life.",
    fr: "Tu as passé vingt et un jours à chercher Dieu et à prier au sujet d'un mariage qui viendra peut-être — ou non. Ces prières n'obligent pas Dieu à te donner un conjoint. Continue à prier avec les Écritures, à Lui confier tes désirs et à garder Christ au centre de ta vie.",
  },
  days: DAYS,
};

export default PREPARING_IN_PRAYER;
