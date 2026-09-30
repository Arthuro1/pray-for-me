// "Praying for Your Unborn Child" — a 21-day guided prayer journey during
// pregnancy (research note: docs/plans/unborn21.md).
//
// It prays for the developing child, the mother, the father or other parent,
// the wider family, those who give care, the home and the child's future, and
// ends by entrusting everything to God. It runs on the SAME engine as every
// other guided plan (see src/content/prayerPlans.js); only the content is new.
// No `lifeStage` is set on purpose: mothers, fathers, adoptive or foster
// parents-to-be, grandparents and friends may all pray it, and the intro says so.
//
// PASTORAL AND SAFETY GUARDRAILS (the reason this file reads the way it does):
//   • Prayer never guarantees a healthy pregnancy or a particular birth
//     outcome. Days ask; they never predict. Psalm 121 and Romans 8:28 are
//     read in context precisely because they are so often heard as guarantees.
//   • Pregnancy loss is never the result of weak faith or sin, and a
//     complication or a change of birth plan is never a spiritual failure.
//   • Prayer goes WITH prenatal and medical care, never instead of it: the
//     intro and days 1, 6, 10 and 19 say so in practical terms.
//   • Safety notes: day 1 (worrying symptoms → midwife/doctor/emergency),
//     day 8 (abuse at home), day 16 (loss is not your fault; bereavement
//     support), day 20 (low mood, anxiety or thoughts of harm after birth or
//     loss → doctor/midwife/emergency services).
//   • Jeremiah 1:5 is read as Jeremiah's own prophetic calling, never as a
//     destiny promised to every child; Luke 1, Luke 2 and 1 Samuel 1 are
//     descriptive, never templates.
//   • The completion works whatever the stage or outcome: it must never assume
//     a live birth. The test file guards all of the above.
//
// LOCALIZATION: `theme` is authored in all 16 languages; all other prose in
// en + fr (`proseTranslations: []` — the other languages fall back to English).
// Scripture is stored as references only and resolves through the localized
// verse pipeline; no Bible text is authored here.
//
// VERSIONING: bump `version` whenever a day's meaning changes (see
// docs/PRAYER_PLANS.md). Day numbering, ids and references are the stable part.
import { DAYS } from './prayingForUnbornChildDays';
import { pendingPlanReview } from '../reviews/pendingPlans20260923';

export const MOVEMENTS = [
  { id: 'known', from: 1, to: 5, titleKey: 'planUnbornMovementKnown' },
  { id: 'care', from: 6, to: 10, titleKey: 'planUnbornMovementCare' },
  { id: 'future', from: 11, to: 15, titleKey: 'planUnbornMovementFuture' },
  { id: 'trust', from: 16, to: 21, titleKey: 'planUnbornMovementTrust' },
];

export const PRAYING_FOR_UNBORN_CHILD = {
  id: 'unborn21',
  version: 1,
  count: 21,
  emoji: '🤰',
  category: 'relationships',
  resourceDomains: ['relationships'],
  titleKey: 'planUnbornTitle',
  subKey: 'planUnbornSub',
  proseTranslations: [],
  review: pendingPlanReview('unborn21'),
  movements: MOVEMENTS,
  intro: {
    en: "Pray for a child still in the womb over twenty-one days: for the child, the mother, the father or other parent, the wider family, those who give care and the future, before entrusting it all to God. Mothers, fathers, adoptive or foster parents-to-be, grandparents and friends can all pray it; where a prompt names the mother and you are she, pray it for yourself. Each day takes about ten minutes. Prayer goes hand in hand with prenatal and medical care, so keep every appointment and tell your midwife or doctor about anything that worries you. This plan does not promise a healthy pregnancy or a particular birth outcome, and if this pregnancy ends in loss you may pause or stop at any point; that is not a failure of faith.",
    fr: "Pendant vingt et un jours, prie pour un enfant encore dans le ventre de sa mère : pour l'enfant, pour sa mère, pour son père ou l'autre parent, pour la famille élargie, pour ceux qui soignent et pour l'avenir, avant de tout remettre à Dieu. Mères, pères, futurs parents adoptifs ou d'accueil, grands-parents et amis peuvent tous suivre ce parcours ; quand une prière nomme la mère et que c'est toi, prie-la pour toi-même. Chaque jour demande une dizaine de minutes. La prière va de pair avec le suivi prénatal et les soins médicaux : honore chaque rendez-vous et signale à ta sage-femme ou à ton médecin tout ce qui t'inquiète. Ce parcours ne promet ni une grossesse sans complication ni une issue particulière ; si cette grossesse se termine par une perte, tu peux faire une pause ou t'arrêter à tout moment, et ce ne sera pas un échec de ta foi.",
  },
  biblical: {
    ref: 'Psalm 139:13-16',
    text: {
      en: "Psalm 139 describes God forming a person in the womb and knowing them before anyone else could see them (Psalm 139:13-16), and other psalms speak of trusting God from birth (Psalm 22:9-10; Psalm 71:6). These are songs of worship, not forecasts, and Scripture is honest that pregnancy and birth can bring sorrow as well as joy. Paul invites believers to bring every request to God with thanksgiving, and promises God's peace rather than the outcome we would choose (Philippians 4:6-7). Nothing, he adds, can separate those who are in Christ from the love of God (Romans 8:38-39). So this plan asks boldly and entrusts humbly.",
      fr: "Le Psaume 139 décrit Dieu formant une personne dans le ventre maternel et la connaissant avant que quiconque puisse la voir (Psaume 139:13-16), et d'autres psaumes parlent d'une confiance en Dieu dès la naissance (Psaume 22:9-10 ; Psaume 71:6). Ce sont des chants d'adoration, non des prédictions, et l'Écriture reconnaît que la grossesse et la naissance peuvent apporter la tristesse autant que la joie. Paul invite les croyants à présenter toutes leurs demandes à Dieu avec des actions de grâces, et promet la paix de Dieu plutôt que l'issue que nous choisirions (Philippiens 4:6-7). Rien, ajoute-t-il, ne peut séparer de l'amour de Dieu ceux qui sont en Christ (Romains 8:38-39). Ce parcours demande donc avec audace et remet tout avec humilité.",
    },
  },
  completion: {
    en: "You have spent twenty-one days bringing a child, a family and those who care for them to God, and placing the future in His hands. Whether you are still waiting, have welcomed a baby, or are grieving a loss, these prayers were offered to a God who hears, and their worth never depended on how things turned out. They do not oblige Him to any particular result. If it helps, keep praying once a week for this child and family, and ask a pastor or trusted believer to pray with you in whatever comes next.",
    fr: "Tu as passé vingt et un jours à présenter à Dieu un enfant, une famille et ceux qui en prennent soin, et à remettre l'avenir entre ses mains. Que tu sois encore dans l'attente, que tu aies accueilli un bébé ou que tu traverses le deuil d'une perte, ces prières ont été adressées à un Dieu qui entend, et leur valeur n'a jamais dépendu de l'issue. Elles n'obligent Dieu à aucun résultat particulier. Si cela t'aide, continue à prier une fois par semaine pour cet enfant et sa famille, et demande à un pasteur ou à un croyant de confiance de prier avec toi pour la suite, quelle qu'elle soit.",
  },
  days: DAYS,
};

export default PRAYING_FOR_UNBORN_CHILD;
