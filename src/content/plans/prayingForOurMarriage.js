// Draft content on the existing guided-plan engine. Publication is blocked by
// planReview until named reviewers approve Scripture/theology, safety, and all
// 16 languages. References are resolved by the existing Scripture reader.
import { DAYS } from './prayingForOurMarriageDays';

export const PRAYING_FOR_OUR_MARRIAGE = {
  id: 'marriage30',
  emoji: '💍',
  count: 30,
  version: 1,
  category: 'relationships',
  lifeStage: 'married',
  audienceKey: 'planMarriageAudience',
  titleKey: 'planMarriageTitle',
  subKey: 'planMarriageSub',
  proseTranslations: true,
  onboarding: 'married',
  renewable: true,
  review: { status: 'needs_review' },
  analyticsEvents: {
    started: 'marriage_plan_started',
    dayCompleted: 'marriage_plan_day_completed',
    completed: 'marriage_plan_completed',
  },
  intro: {
    en: 'Thirty days of Scripture and prayer for your spouse, your own growth, and your marriage. This is a renewable rhythm, not a score or diagnosis. A married couple is already a family; children are an optional layer and the whole plan remains complete without them. You may use shared activities when both of you wish, while Prayer Notes and voice notes remain private.',
    fr: 'Trente jours de lecture biblique et de prière pour ton conjoint, ta propre croissance et votre mariage. C’est un rythme que vous pouvez reprendre, pas un score ni un diagnostic. Un couple marié est déjà une famille ; les enfants sont une dimension facultative et le parcours reste complet sans eux. Vous pouvez choisir certaines activités à deux lorsque vous le souhaitez tous les deux, tandis que les notes écrites et vocales restent privées.',
  },
  biblical: {
    ref: 'Colossians 3:12-15',
    text: {
      en: 'The New Testament calls every believer to compassion, humility, patience, forgiveness, love, and peace. Marriage gives these shared Christian practices a close and ordinary setting. Prayer for a spouse must therefore include prayer for one’s own repentance and for the good of the marriage, never a request that God simply fix the other person.',
      fr: 'Le Nouveau Testament appelle chaque croyant à la compassion, à l’humilité, à la patience, au pardon, à l’amour et à la paix. Le mariage offre à ces pratiques chrétiennes communes un cadre proche et quotidien. Prier pour son conjoint inclut donc la prière pour sa propre repentance et pour le bien du couple ; il ne s’agit jamais de demander simplement à Dieu de corriger l’autre.',
    },
  },
  completion: {
    en: 'You have spent thirty days praying in three directions: for your spouse, for your own growth, and for your marriage. Thank God for grace already given and entrust what remains unfinished. Completing this rhythm does not measure the health of your marriage. You may begin it again or continue with an ordinary recurring prayer; your earlier history remains intact.',
    fr: 'Tu as consacré trente jours à prier dans trois directions : pour ton conjoint, pour ta propre croissance et pour votre mariage. Remercie Dieu pour la grâce déjà reçue et confie-Lui ce qui reste inachevé. Terminer ce rythme ne mesure pas la santé de votre couple. Tu peux le recommencer ou poursuivre avec une prière récurrente ordinaire ; l’historique précédent reste intact.',
  },
  days: DAYS,
};

export default PRAYING_FOR_OUR_MARRIAGE;
