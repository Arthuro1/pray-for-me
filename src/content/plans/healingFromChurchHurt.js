// "Healing from Church Hurt" — a 21-day guided prayer journey for readers
// carrying wounds connected to a church, a ministry environment or a Christian
// leader. It serves the whole range, from disappointment and conflict to
// spiritual, emotional, sexual or financial abuse, without minimising the
// severe end or dramatising the mild end. It is the most safeguarding-critical
// of the plans drafted on 2026-09-23.
//
// It runs on the same engine as every other guided plan (see
// src/content/prayerPlans.js); only the content lives here and in
// ./healingFromChurchHurtDays.js. Four movements: name the wound and lament
// (1–5), look again at Jesus the Good Shepherd (6–10), forgiveness, justice
// and boundaries (11–15), discernment, community and hope (16–21).
//
// GUARDRAILS (the reason this file reads the way it does — each one is also
// pinned by ./healingFromChurchHurt.test.js):
//   • Forgiveness is not denial, does not automatically restore trust, and does
//     not require continued access. Reconciliation may not be appropriate or
//     possible.
//   • Reporting abuse is not unforgiveness. Criminal conduct must not be
//     concealed under church discipline; Matthew 18:15-17 is never a script
//     for making a victim confront an abuser.
//   • Spiritual authority never excuses abuse or coercion, and leaving abuse is
//     never framed as rebellion against God. Hebrews 13:17 appears only with
//     that limit stated.
//   • No reader is ever told to return to an unsafe church. Hebrews 10:24-25
//     appears only as an invitation, with explicit permission to take time and
//     choose a safe community.
//   • Safety notes name real help (emergency services, police, independent
//     safeguarding bodies, victim support, counsellors, doctors, lawyers) on the
//     opening day, the forgiveness, justice and repentance days, the
//     return-to-community day and the closing day. Abuse of a child or a
//     vulnerable adult must be reported.
//   • One day (15) gently names the reader who has also hurt others, without
//     moving the focus off the wounded.
//   • It never promises healing, restored relationships or any outcome, and
//     never speaks for God.
//
// RESOURCES: `resourceDomains` is ['care'], NOT 'freedom' — deliverance titles
// must never reach this plan's shelf.
//
// LOCALIZATION: `theme` is authored in all 16 languages; the prose is authored
// in en + fr and falls back through pick() elsewhere (`proseTranslations: []`
// until overlays exist). Scripture is stored as references only.
//
// REVIEW: drafted with AI assistance on 2026-09-23 and gated by `review` until
// a human theology reviewer and a safety reviewer sign it off — see
// docs/plans/churchHurt21.md.
import { DAYS } from './healingFromChurchHurtDays';
import { pendingPlanReview } from '../reviews/pendingPlans20260923';

export const MOVEMENTS = [
  { id: 'lament', from: 1, to: 5, titleKey: 'planChurchHurtMovementLament' },
  { id: 'shepherd', from: 6, to: 10, titleKey: 'planChurchHurtMovementShepherd' },
  { id: 'boundaries', from: 11, to: 15, titleKey: 'planChurchHurtMovementBoundaries' },
  { id: 'hope', from: 16, to: 21, titleKey: 'planChurchHurtMovementHope' },
];

export const HEALING_FROM_CHURCH_HURT = {
  id: 'churchHurt21',
  version: 1,
  count: 21,
  emoji: '🩹',
  category: 'freedom',
  resourceDomains: ['care'],
  titleKey: 'planChurchHurtTitle',
  subKey: 'planChurchHurtSub',
  proseTranslations: [],
  review: pendingPlanReview('churchHurt21'),
  movements: MOVEMENTS,
  intro: {
    en: 'A 21-day prayer journey for anyone carrying a wound connected to a church, a ministry or a Christian leader, whether it came from disappointment and conflict or from spiritual, emotional, sexual or financial abuse. You will lament honestly, look again at Jesus the Good Shepherd, think through forgiveness, justice and boundaries, and consider, without pressure, what safe community could look like. Each day takes about ten minutes: a short reflection on a passage, a few prayer prompts and one small, optional practice. You may pause or stop at any time, and you never have to share your story. This plan does not promise a particular outcome, it will never ask you to go back to an unsafe place, and it does not replace pastoral care, counselling, medical help, legal advice or safeguarding services.',
    fr: 'Un parcours de prière de 21 jours pour toute personne qui porte une blessure liée à une Église, à un ministère ou à un responsable chrétien, qu’elle vienne d’une déception, d’un conflit, ou de violences spirituelles, psychologiques, sexuelles ou financières. Tu pourras te lamenter en vérité, regarder de nouveau à Jésus, le bon Berger, réfléchir au pardon, à la justice et aux limites, puis envisager sans pression ce que pourrait être une communauté sûre. Chaque jour demande une dizaine de minutes : une courte méditation sur un passage, quelques pistes de prière et une petite pratique facultative. Tu peux faire une pause ou t’arrêter à tout moment, et tu n’as jamais à raconter ton histoire. Ce parcours ne promet aucun résultat particulier, ne te demandera jamais de retourner dans un lieu où tu n’es pas en sécurité, et ne remplace ni l’accompagnement pastoral, ni un suivi psychologique ou médical, ni un conseil juridique, ni les services de protection des personnes.',
  },
  biblical: {
    ref: 'Ezekiel 34:11-16',
    text: {
      en: 'In Ezekiel 34 God confronts shepherds who fed themselves and ruled the flock harshly, then declares that He Himself will search for His scattered sheep, bind up the injured and shepherd with justice (Ezekiel 34:11-16). Jesus takes up that promise when He calls Himself the Good Shepherd who lays down His life, in contrast to the thief and the hired hand (John 10:11-15). Scripture gives words for betrayal and lament (Psalm 55, Psalm 13), forbids leaders to lord it over the flock (Mark 10:42-45, 1 Peter 5:1-4), and entrusts vengeance to God, who also works through governing authorities that act against wrongdoing (Romans 12:17-21, Romans 13:3-4). None of these passages asks a wounded person to return to harm or to keep silent about it.',
      fr: 'En Ézéchiel 34, Dieu s’en prend aux bergers qui se nourrissaient eux-mêmes et gouvernaient le troupeau avec dureté, puis déclare qu’Il cherchera Lui-même Ses brebis dispersées, pansera celles qui sont blessées et fera paître Son troupeau avec justice (Ézéchiel 34.11-16). Jésus reprend cette promesse lorsqu’Il se présente comme le bon Berger qui donne Sa vie, à l’opposé du voleur et du mercenaire (Jean 10.11-15). L’Écriture donne des mots à la trahison et à la lamentation (Psaume 55, Psaume 13), interdit aux responsables de dominer sur le troupeau (Marc 10.42-45, 1 Pierre 5.1-4) et remet la vengeance à Dieu, qui agit aussi par les autorités chargées de sanctionner le mal (Romains 12.17-21, Romains 13.3-4). Aucun de ces passages ne demande à une personne blessée de retourner là où on lui a fait du mal, ni de garder le silence.',
    },
  },
  completion: {
    en: 'For twenty-one days you have brought a wound before God: naming it, lamenting, looking again at the Good Shepherd, thinking through forgiveness, justice and boundaries, and considering what safe community could be. Some of what you carry may feel lighter and some may not; neither is a verdict on your faith. This plan does not promise that the pain is over or that any relationship will be restored. If it helps, keep praying a psalm of lament or Psalm 23 once a week, and keep walking with the people and professionals who are helping you.',
    fr: 'Pendant vingt et un jours, tu as porté une blessure devant Dieu : tu l’as nommée, tu t’es lamenté, tu as regardé de nouveau au bon Berger, tu as réfléchi au pardon, à la justice et aux limites, et tu as envisagé ce que pourrait être une communauté sûre. Une part de ce que tu portes te semble peut-être plus légère, une autre non ; ni l’une ni l’autre n’est un verdict sur ta foi. Ce parcours ne promet pas que la douleur soit terminée ni qu’une relation sera restaurée. Si cela t’aide, continue à prier un psaume de lamentation ou le Psaume 23 une fois par semaine, et continue à avancer avec les personnes et les professionnels qui t’accompagnent.',
  },
  days: DAYS,
};

export default HEALING_FROM_CHURCH_HURT;
