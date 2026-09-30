// "Psalms — Learning to Pray Everything" — a 42-day STUDY plan through the
// Psalter (see docs/plans/psalms42.md for the research note).
//
// A real Bible-study journey, not 42 separate devotionals: six weekly
// movements (praise, trust, lament, repentance and mercy, justice and the
// kingdom, thanksgiving and hope) teach the reader to put six questions to any
// psalm — what it reveals about God, what the psalmist is honestly living
// through, how the psalm moves, what must not be generalized into a universal
// promise, how it fits the wider biblical story, and how its words can
// faithfully become prayer. Day 1 teaches the questions; the last day of each
// week reviews them. mode 'study': each day renders through
// src/components/StudyDayGuide.jsx (context, tension, questions, synthesis,
// prayer) and has no prompts or practice.
//
// THEOLOGICAL GUARDRAILS (why the days read as they do):
//   • Imprecatory lines (Psalm 69, and Psalm 2's rod of iron, Psalm 118's
//     battle language) are honest anger and hope handed to God — never a
//     licence for curses, revenge or coercion. Justice belongs to God; Jesus'
//     teaching on enemies governs how Christians pray them.
//   • Lament is not rushed to a happy ending. Psalm 88 ends in darkness and the
//     study says so and lets it stand.
//   • Confident lines are not guarantees: Psalm 91 does not promise freedom
//     from all harm (the devil misuses it in Matthew 4:6); Psalms 1, 37 and 84
//     do not promise prosperity (Psalm 73 is the counterweight); Psalms 103,
//     107 and 116 do not promise that every illness ends in recovery.
//   • Not every psalm is presented as spoken by Christ; the genuine New
//     Testament uses (e.g. Psalms 2, 8, 16, 22, 69 and 118) are named.
//   • Superscriptions are ancient but their authorship and setting are debated;
//     the study cites them as titles, not settled history.
//   • Despair-heavy days carry a safety note pointing to urgent human help.
//
// LOCALIZATION: `theme` is authored in all 16 languages; every other piece of
// prose is authored in English and French and falls back through pick() for
// the other languages (proseTranslations stays empty until overlays are
// reviewed). Scripture is stored as references only — no Bible text is ever
// authored here.
import { DAYS } from './psalmsStudyDays';
import { NEW_PLAN_APPROVALS } from '../reviews/paulNewPlans20260930';

export const MOVEMENTS = [
  { id: 'praise', from: 1, to: 7, titleKey: 'planPsalmsMovementPraise' },
  { id: 'trust', from: 8, to: 14, titleKey: 'planPsalmsMovementTrust' },
  { id: 'lament', from: 15, to: 21, titleKey: 'planPsalmsMovementLament' },
  { id: 'mercy', from: 22, to: 28, titleKey: 'planPsalmsMovementMercy' },
  { id: 'justice', from: 29, to: 35, titleKey: 'planPsalmsMovementJustice' },
  { id: 'hope', from: 36, to: 42, titleKey: 'planPsalmsMovementHope' },
];

export const PSALMS_STUDY = {
  id: 'psalms42',
  version: 1,
  count: 42,
  emoji: '🎶',
  category: 'bible-study',
  mode: 'study',
  resourceDomains: ['bible-study'],
  titleKey: 'planPsalmsTitle',
  subKey: 'planPsalmsSub',
  proseTranslations: [],
  review: NEW_PLAN_APPROVALS.psalms42,
  movements: MOVEMENTS,
  intro: {
    en: 'For six weeks you will study one psalm a day and discover how the Psalms give God’s people words for everything: praise, trust, fear, grief, anger, repentance, justice, thanksgiving, waiting and worship. Each week follows one family of psalms, and each day offers some context, a caution about what not to over-read, three questions and a short prayer; allow about twenty minutes with your Bible open. The study will not force every psalm towards a happy ending — some end in darkness, and they are left that way — and it does not turn the Psalter’s confident lines into guarantees of health, wealth or safety. It is an invitation to pray honestly to the God the Psalms reveal, in the company of Jesus, who prayed them too.',
    fr: 'Pendant six semaines, tu étudieras un psaume par jour pour découvrir comment les Psaumes donnent au peuple de Dieu des mots pour tout : la louange, la confiance, la peur, le chagrin, la colère, la repentance, la justice, l’action de grâces, l’attente et l’adoration. Chaque semaine suit une famille de psaumes, et chaque jour propose un contexte, une mise en garde sur ce qu’il ne faut pas surinterpréter, trois questions et une courte prière ; compte une vingtaine de minutes, ta Bible ouverte. Cette étude ne force pas chaque psaume vers une fin heureuse — certains s’achèvent dans les ténèbres, et on les laisse ainsi — et elle ne transforme pas les lignes pleines d’assurance du psautier en garanties de santé, de richesse ou de sécurité. C’est une invitation à prier honnêtement le Dieu que révèlent les Psaumes, en compagnie de Jésus, qui les a priés lui aussi.',
  },
  biblical: {
    ref: 'Colossians 3:16',
    text: {
      en: 'Paul urges believers to let the message of Christ live richly among them as they teach one another and sing psalms, hymns and spiritual songs (Colossians 3:16), and James tells the suffering to pray and the cheerful to sing praise (James 5:13): the whole range of life is meant to be brought to God. Jesus Himself prayed the Psalms. He sang with His disciples after the Last Supper (Matthew 26:30), cried out the opening of Psalm 22 on the cross (Mark 15:34) and entrusted His spirit to the Father in the words of Psalm 31 (Luke 23:46). After the resurrection He taught that the Psalms, with the Law and the Prophets, speak of Him (Luke 24:44). This plan studies the Psalter as the prayer book of God’s people, read in the light of Christ.',
      fr: 'Paul invite les croyants à laisser la parole du Christ habiter en eux avec abondance, en s’instruisant mutuellement et en chantant des psaumes, des hymnes et des cantiques spirituels (Colossiens 3.16), et Jacques demande à celui qui souffre de prier et à celui qui est dans la joie de chanter des louanges (Jacques 5.13) : toute l’étendue de la vie est appelée à être portée devant Dieu. Jésus lui-même a prié les Psaumes. Il a chanté avec ses disciples après le dernier repas (Matthieu 26.30), il a crié le début du Psaume 22 sur la croix (Marc 15.34) et il a remis son esprit au Père avec les mots du Psaume 31 (Luc 23.46). Après sa résurrection, il a enseigné que les Psaumes, avec la Loi et les Prophètes, parlent de lui (Luc 24.44). Ce parcours étudie le psautier comme le livre de prière du peuple de Dieu, lu à la lumière du Christ.',
    },
  },
  completion: {
    en: 'You have walked through forty-two psalms — praising, trusting, lamenting, confessing, crying out for justice and giving thanks — and you have practised six questions that can open any psalm. That is a real apprenticeship in prayer, even on the days when the words felt borrowed or no answer came. The Psalms do not promise that every season will resolve quickly, but they show a God who hears every kind of prayer. To keep going, read one psalm a day from Psalm 1 onwards, or pray one psalm of lament and one of praise each week with a friend or your church.',
    fr: 'Tu as parcouru quarante-deux psaumes — en louant, en te confiant, en te lamentant, en confessant, en criant pour la justice et en rendant grâces — et tu t’es exercé à six questions qui peuvent ouvrir n’importe quel psaume. C’est un véritable apprentissage de la prière, même les jours où les mots semblaient empruntés ou où aucune réponse ne venait. Les Psaumes ne promettent pas que chaque saison se dénouera vite, mais ils montrent un Dieu qui entend toutes sortes de prières. Pour continuer, lis un psaume par jour à partir du Psaume 1, ou prie chaque semaine un psaume de lamentation et un psaume de louange avec un ami ou avec ton Église.',
  },
  days: DAYS,
};

export default PSALMS_STUDY;
