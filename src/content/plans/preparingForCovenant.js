// Draft content on the existing guided-plan engine. Do not publish until the
// Scripture, theology, safety wording and all translations have been reviewed.
// References are identifiers for the existing reader, never authored verse text.
import { DAYS } from './preparingForCovenantDays';

export const PREPARING_FOR_COVENANT = {
  id: 'covenant21',
  emoji: '🤝',
  count: 21,
  version: 1,
  category: 'relationships',
  // Relationship material only: deliverance and freedom titles share topics like
  // 'healing', 'forgiveness' and 'family-line' with these days, and belong on
  // their own plan's shelf rather than this one.
  resourceDomains: ['relationships'],
  lifeStage: 'engaged',
  titleKey: 'planCovenantTitle',
  subKey: 'planCovenantSub',
  // Only the languages whose overlay is real prose. The remaining files in
  // translations/covenant21/ are still structural stubs — one frame repeated on
  // every day — so they are deliberately NOT served: a reader in those languages
  // gets the authored English/French through pick(), which is the better of the
  // two. Add a code here once its overlay is genuinely translated; the check in
  // translationQuality.test.js enforces that.
  proseTranslations: ['de', 'es', 'pt', 'ru'],
  onboarding: 'engaged',
  review: { status: 'needs_review' },
  analyticsEvents: {
    started: 'engaged_plan_started',
    dayCompleted: 'engaged_plan_day_completed',
    completed: 'engaged_plan_completed',
  },
  intro: {
    en: 'Twenty-one days to prepare for your marriage, not only your wedding. Read Scripture, pray for one another and for your own growth, and make room for honest conversation. You may pray privately or choose activities together. Your notes remain private. Marriage is a context for following Christ, not a higher spiritual rank than singleness.',
    fr: 'Vingt et un jours pour préparer votre vie conjugale, pas seulement votre cérémonie. Lisez la Bible, priez l’un pour l’autre et pour votre propre croissance, et faites place à des conversations sincères. Tu peux prier en privé ou choisir des activités à deux. Tes notes restent privées. Le mariage est un cadre pour suivre Christ, pas un rang spirituel supérieur au célibat.',
  },
  biblical: {
    ref: 'Matthew 6:33',
    text: {
      en: 'Jesus places God’s kingdom first. Genesis describes a new, committed household; Philippians directs believers toward Christlike humility and service. These passages invite preparation rooted in faithfulness, without turning engagement into proof that God guarantees a particular outcome.',
      fr: 'Jésus donne la première place au royaume de Dieu. La Genèse décrit un nouveau foyer fondé sur un engagement ; Philippiens invite les croyants à l’humilité et au service à l’image de Christ. Ces textes appellent à une préparation fidèle, sans faire des fiançailles la preuve que Dieu garantit une issue particulière.',
    },
  },
  completion: {
    en: 'You have spent these days praying, talking when you chose to, and preparing for the marriage you are entering. Thank God for what you have learned and entrust what remains to Him. A wedding begins a lifelong practice of faithfulness; finishing a plan is not a certificate of readiness. You may continue praying for your marriage when you choose. Your history stays yours, and your relationship status does not change automatically.',
    fr: 'Tu as consacré ces jours à prier, à échanger lorsque tu le souhaitais et à préparer le mariage dans lequel tu t’engages. Remercie Dieu pour ce que tu as appris et confie-Lui ce qui reste. La cérémonie inaugure une fidélité à vivre au quotidien ; terminer un parcours n’est pas un certificat de préparation. Tu pourras continuer à prier pour votre mariage quand tu le choisiras. Ton historique reste conservé et ton statut relationnel ne change pas automatiquement.',
  },
  days: DAYS,
};

export default PREPARING_FOR_COVENANT;
