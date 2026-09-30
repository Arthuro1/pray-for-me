// "Your Kingdom Come" — a 14-day guided journey through the prayer Jesus
// taught (Matthew 6:5-13; Luke 11:1-13). Research note: docs/plans/kingdomCome14.md.
//
// PURPOSE: to move prayer from a list of personal wants toward God's name,
// kingdom and will, and from there to daily dependence, forgiveness, holiness,
// protection from evil, mission and the hope of Christ's return. Every day
// prays in two movements with existing fields: the `prompts` INTERCEDE (what
// are we asking God to do?) and the `selfPrompt` SUBMITS (what in my own life
// must come under the reign I am asking for?). A plan day without both does
// not belong here.
//
// THEOLOGICAL GUARDRAILS (why the prose reads the way it does):
//   • The kingdom is God's reign revealed in and through Jesus — begun, not
//     yet complete. It is never equated with a nation, party, government,
//     denomination, social movement, material prosperity or cultural
//     dominance (days 3, 6 and 12 say so in their own words).
//   • "Our Father" never asks a wounded reader to picture an earthly father:
//     the Father is the one Jesus reveals (Luke 15; Matthew 7:9-11).
//   • Surrender is not emotional denial — Gethsemane is honest sorrow placed
//     under the Father's will (day 4).
//   • Forgiveness is not immediate trust, reconciliation or renewed access;
//     day 9 carries a safety note that says so and points to real help.
//   • Temptation and evil are handled soberly: translation questions are
//     named, hidden causes are never diagnosed, and day 11 carries a safety
//     note that prayer never replaces practical help.
//   • Nothing promises an outcome, and day 14 hopes for Christ's return
//     without setting dates. The doxology is absent from the earliest
//     manuscripts, so no day is built on it.
//   • Praystead never speaks for God; no Bible text is stored here.
//
// LOCALIZATION: day titles are authored in all 16 languages; the prose is
// authored in en + fr and falls back through pick() elsewhere
// (`proseTranslations: []`). References resolve through the verse pipeline.
import { DAYS } from './yourKingdomComeDays';
import { pendingPlanReview } from '../reviews/pendingPlans20260923';

export const MOVEMENTS = [
  { id: 'father', from: 1, to: 6, titleKey: 'planKingdomMovementFather' },
  { id: 'daily', from: 7, to: 11, titleKey: 'planKingdomMovementDaily' },
  { id: 'sent', from: 12, to: 14, titleKey: 'planKingdomMovementSent' },
];

export const YOUR_KINGDOM_COME = {
  id: 'kingdomCome14',
  version: 1,
  count: 14,
  emoji: '👑',
  category: 'formation',
  resourceDomains: ['christian-living'],
  titleKey: 'planKingdomTitle',
  subKey: 'planKingdomSub',
  proseTranslations: [],
  review: pendingPlanReview('kingdomCome14'),
  movements: MOVEMENTS,
  intro: {
    en: "Fourteen days praying the prayer Jesus taught His disciples, one petition at a time. Each day offers a short reflection on a passage, prayers for others and for the world, and one question that brings your own life under the reign you are asking for. Allow about fifteen minutes. The plan is for anyone who wants their prayer shaped less by their own list and more by God's name, kingdom and will. It does not promise that any prayer will be answered in a particular way; it invites you to pray as Jesus taught and to trust the Father with the rest.",
    fr: "Quatorze jours pour prier la prière que Jésus a enseignée à ses disciples, une demande à la fois. Chaque jour propose une courte méditation sur un passage, des sujets de prière pour les autres et pour le monde, et une question qui place ta propre vie sous le règne que tu demandes. Compte environ quinze minutes. Ce parcours s'adresse à quiconque souhaite que sa prière soit moins façonnée par sa propre liste et davantage par le nom, le règne et la volonté de Dieu. Il ne promet pas que tes prières seront exaucées d'une manière particulière ; il t'invite à prier comme Jésus l'a enseigné et à confier le reste au Père.",
  },
  biblical: {
    ref: 'Matthew 6:9-13',
    text: {
      en: "Jesus gave this prayer twice: in the Sermon on the Mount, as a pattern set against showy and wordy prayer (Matthew 6:5-13), and in Luke, when a disciple asked Him to teach them to pray (Luke 11:1-13). Its first half asks God to act for His own name, kingdom and will; its second asks Him for bread, forgiveness and protection — in that order. The kingdom it prays for is God's reign, announced and embodied by Jesus (Mark 1:14-15), already at work by the Spirit and still awaited in its fullness (1 Corinthians 15:20-28; Revelation 21). To pray it is both to ask God to act and to hand our own lives over to His rule (Romans 12:1-2).",
      fr: "Jésus a donné cette prière deux fois : dans le Sermon sur la montagne, comme modèle opposé à la prière d'apparat et aux longs discours (Matthieu 6:5-13), et dans Luc, quand un disciple Lui a demandé de leur apprendre à prier (Luc 11:1-13). Sa première moitié demande à Dieu d'agir pour son nom, son règne et sa volonté ; la seconde Lui demande le pain, le pardon et la protection — dans cet ordre. Le règne qu'elle appelle est celui de Dieu, annoncé et incarné par Jésus (Marc 1:14-15), déjà à l'œuvre par l'Esprit et encore attendu dans sa plénitude (1 Corinthiens 15:20-28 ; Apocalypse 21). La prier, c'est à la fois demander à Dieu d'agir et remettre sa propre vie sous son autorité (Romains 12:1-2).",
    },
  },
  completion: {
    en: "You have prayed through the prayer Jesus taught, from “Our Father” to “Come, Lord Jesus”, asking God to act and bringing your own life under His reign. None of it was a technique for getting results; it was practice in praying the way He taught. What you have asked for rests in the Father's hands. To keep going, pray the Lord's Prayer slowly each morning, and let one petition carry a person or a place on your heart that day.",
    fr: "Tu as prié la prière que Jésus a enseignée, de « Notre Père » à « Viens, Seigneur Jésus », en demandant à Dieu d'agir et en plaçant ta propre vie sous son règne. Rien de tout cela n'était une technique pour obtenir des résultats : c'était un apprentissage de la prière telle qu'Il l'a enseignée. Ce que tu as demandé repose entre les mains du Père. Pour continuer, prie lentement le Notre Père chaque matin, et laisse l'une de ses demandes porter une personne ou un lieu qui te tient à cœur ce jour-là.",
  },
  days: DAYS,
};

export default YOUR_KINGDOM_COME;
