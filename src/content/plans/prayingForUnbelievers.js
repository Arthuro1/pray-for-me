// "Praying for Those Who Don't Yet Believe" — a 30-day guided intercession
// plan for people who have NOT yet come to faith in Christ (a friend, a
// relative, a colleague, a neighbour, the nations), which also shapes the one
// praying into a loving, honest and courageous witness. People who once
// believed and have drifted away are the subject of a separate plan
// (prodigal30); this one stays with those who have not yet believed.
//
// It runs on the same engine as every other guided plan (see
// src/content/prayerPlans.js); only the content lives here and in
// ./prayingForUnbelieversDays.js.
//
// THEOLOGICAL GUARDRAILS (why the prose reads the way it does):
//   • No guaranteed conversion. Nothing says anyone "will be saved", invites
//     the reader to "claim" someone's salvation, or ties salvation to the
//     amount of prayer. Prayer is trust, not leverage; faithfulness is not
//     measured by visible results (days 26–30).
//   • No manipulation or pressure. People are neighbours to love, never
//     projects; friendship is not a tactic; the person keeps their dignity and
//     freedom, and a relative's boundaries are honoured (day 20).
//   • Spiritual blindness (2 Corinthians 4:4, Acts 26:18) is prayed soberly —
//     no formulas that "bind" anyone's mind (days 8 and 14).
//   • Election passages (John 6:44, Romans 9–11, 1 Timothy 2:4, 2 Peter 3:9)
//     hold God's initiative and the call to respond together, name the
//     disagreement between Christians, and never settle it (days 5, 6, 10,
//     27, 29). See docs/plans/unbelievers30.md.
//   • People of other faiths are prayed for with respect, no caricature
//     (day 22); the persecuted-church day also prays for persecutors and for
//     freedom of belief for all (day 25); harm done by Christians is
//     confessed, not defended (day 21).
//   • Every day turns the prayer back on the reader (`selfPrompt`). Days 20
//     (family boundaries, unsafe homes) and 21 (abuse by Christians) carry a
//     safety note pointing to real help.
//   Guardrail tests: ./prayingForUnbelievers.test.js.
//
// LOCALIZATION: day `theme`s are authored in all 16 languages inline; the
// prose is authored in en + fr and falls back through pick() elsewhere
// (`proseTranslations: []`). Scripture is referenced, never quoted.
import { DAYS } from './prayingForUnbelieversDays';
import { NEW_PLAN_APPROVALS } from '../reviews/paulNewPlans20260930';

export const MOVEMENTS = [
  { id: 'heart', from: 1, to: 7, titleKey: 'planUnbelieversMovementHeart' },
  { id: 'understanding', from: 8, to: 14, titleKey: 'planUnbelieversMovementUnderstanding' },
  { id: 'witness', from: 15, to: 21, titleKey: 'planUnbelieversMovementWitness' },
  { id: 'mission', from: 22, to: 30, titleKey: 'planUnbelieversMovementMission' },
];

export const PRAYING_FOR_UNBELIEVERS = {
  id: 'unbelievers30',
  version: 1,
  count: 30,
  emoji: '🌍',
  category: 'others',
  primaryCircle: 'people',
  circles: ['people', 'kingdom'],
  resourceDomains: ['mission'],
  titleKey: 'planUnbelieversTitle',
  subKey: 'planUnbelieversSub',
  proseTranslations: [],
  review: NEW_PLAN_APPROVALS.unbelievers30,
  movements: MOVEMENTS,
  intro: {
    en: "For thirty days you will pray for people you love who do not yet know Christ — a friend, a relative, a colleague, a neighbour — and for the wider world beyond them. Each day takes about ten minutes: a passage, a short reflection, three prayers for others and one for yourself, and a small practice. The plan moves from God's heart for the lost to prayer for understanding, for witnesses and conversations, and for mission across the world. It treats the people you pray for as neighbours to love, never as projects, and it respects their freedom. Prayer is trust, not leverage: no plan can promise anyone's conversion, and faithful prayer is worth offering whatever you see. If the person on your heart once followed Christ and has drifted away, a separate plan is written for that.",
    fr: "Pendant trente jours, tu prieras pour des personnes que tu aimes et qui ne connaissent pas encore Christ — un ami, un proche, un collègue, un voisin — et pour le monde au-delà d'elles. Chaque jour prend une dizaine de minutes : un passage, une courte méditation, trois prières pour les autres et une pour toi, et une petite action. Le parcours va du cœur de Dieu pour les perdus à la prière pour la compréhension, pour les témoins et les conversations, puis pour la mission dans le monde. Il considère les personnes pour qui tu pries comme des prochains à aimer, jamais comme des projets, et il respecte leur liberté. La prière est confiance, non levier : aucun parcours ne peut promettre la conversion de quiconque, et prier fidèlement a du sens quoi que tu voies. Si la personne que tu portes a suivi Christ autrefois puis s'est éloignée, un autre parcours est prévu pour cela.",
  },
  biblical: {
    ref: '1 Timothy 2:1-6',
    text: {
      en: "Paul urges prayer for all people because God our Saviour desires everyone to be saved and to come to know the truth, and Christ gave Himself as a ransom for all (1 Timothy 2:1-6). Jesus came to seek and save the lost (Luke 19:10) and told His disciples to ask the Lord of the harvest for workers (Matthew 9:38). Scripture is just as clear that only God opens hearts and gives sight (Acts 16:14; 2 Corinthians 4:6), so intercession is the natural response of people who cannot convert anyone themselves. Paul models both sides: he prayed with anguish for his own people (Romans 9:1-3; 10:1) and asked others to pray for open doors and clear words (Colossians 4:2-6).",
      fr: "Paul exhorte à prier pour tous les hommes, car Dieu notre Sauveur veut que tous parviennent au salut et à la connaissance de la vérité, et Christ s'est donné en rançon pour tous (1 Timothée 2.1-6). Jésus est venu chercher et sauver ce qui était perdu (Luc 19.10) et a demandé à Ses disciples de prier le Maître de la moisson d'envoyer des ouvriers (Matthieu 9.38). L'Écriture est tout aussi claire : Dieu seul ouvre les cœurs et donne la vue (Actes 16.14 ; 2 Corinthiens 4.6) ; l'intercession est donc la réponse naturelle de ceux qui ne peuvent convertir personne par eux-mêmes. Paul montre les deux faces : il priait avec angoisse pour son propre peuple (Romains 9.1-3 ; 10.1) et demandait qu'on prie pour des portes ouvertes et des paroles claires (Colossiens 4.2-6).",
    },
  },
  completion: {
    en: "For thirty days you have carried people you love before God — through His searching heart, prayer for understanding, witnesses and conversations, and the wider mission of the church. You may have seen signs of openness, or nothing you can point to; neither is the measure of your faithfulness. Their lives and their salvation belong to God, and your love for them is still yours to give. One way to continue is to keep each name as an ongoing prayer, with a rhythm you can sustain, and to stay the kind of friend who listens.",
    fr: "Pendant trente jours, tu as porté devant Dieu des personnes que tu aimes — à travers Son cœur qui cherche, la prière pour la compréhension, les témoins et les conversations, et la mission plus large de l'Église. Tu as peut-être vu des signes d'ouverture, ou rien que tu puisses montrer ; ni l'un ni l'autre ne mesure ta fidélité. Leur vie et leur salut appartiennent à Dieu, et ton amour pour elles reste à donner. Pour continuer, tu peux garder chaque nom comme un sujet de prière durable, avec un rythme que tu peux tenir, et rester l'ami qui écoute.",
  },
  days: DAYS,
};

export default PRAYING_FOR_UNBELIEVERS;
