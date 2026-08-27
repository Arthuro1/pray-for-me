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
    en: "Twenty-one days to seek God in the season you are actually living. This is not a method for finding a spouse, and it promises nothing about whether you will marry. It is a Scripture-shaped journey: five days rooting your life in God, five days asking Him to form your own character, seven days praying for a person you may one day marry, and four days entrusting the whole future back to Him. If you never marry, every day of it still belongs to you.",
    fr: "Vingt et un jours pour chercher Dieu dans la saison que tu vis vraiment. Ce n'est pas une méthode pour trouver un conjoint, et cela ne promet rien quant à un futur mariage. C'est un parcours façonné par l'Écriture : cinq jours pour enraciner ta vie en Dieu, cinq jours pour Lui demander de former ton propre caractère, sept jours pour prier pour une personne que tu épouseras peut-être un jour, et quatre jours pour Lui remettre tout l'avenir. Si tu ne te maries jamais, chacun de ces jours t'appartient quand même.",
  },
  biblical: {
    ref: 'Matthew 6:31-34',
    text: {
      en: "To a crowd worried about what they lacked, Jesus said: seek first the kingdom of God and his righteousness, and all these things will be added to you (Matthew 6:33). Scripture never makes marriage the goal of a life. Paul calls both marriage and singleness gifts, and tells each believer to walk in the life the Lord has assigned (1 Corinthians 7:7, 17). Psalm 37 invites us to delight in the LORD and commit our way to Him rather than to seize what we want. So this journey prays honestly about marriage — and still puts the kingdom first.",
      fr: "À une foule inquiète de ce qui lui manquait, Jésus a dit : cherchez premièrement le royaume de Dieu et sa justice, et toutes ces choses vous seront données par-dessus (Matthieu 6:33). L'Écriture ne fait jamais du mariage le but d'une vie. Paul appelle le mariage et le célibat des dons, et invite chacun à marcher dans la vie que le Seigneur lui a assignée (1 Corinthiens 7:7, 17). Le Psaume 37 nous invite à faire nos délices de l'Éternel et à Lui remettre notre voie plutôt qu'à saisir ce que nous voulons. Ce parcours prie donc honnêtement au sujet du mariage — en gardant le royaume à la première place.",
    },
  },
  completion: {
    en: "Twenty-one days of seeking God, letting Him work on your own heart, and praying about a marriage that may or may not come. Nothing here obliges God, and nothing here was wasted. You have practised praying Scripture, naming your desires without clutching them, and keeping Christ at the centre. Whatever He writes next, those habits are yours to keep.",
    fr: "Vingt et un jours à chercher Dieu, à Le laisser travailler ton propre cœur, et à prier au sujet d'un mariage qui viendra peut-être — ou non. Rien ici n'oblige Dieu, et rien ici n'a été perdu. Tu t'es exercé à prier l'Écriture, à nommer tes désirs sans les serrer, à garder Christ au centre. Quoi qu'Il écrive ensuite, ces habitudes te restent.",
  },
  days: DAYS,
};

export default PREPARING_IN_PRAYER;
