// Explicit user instruction: "resourcen und plan freigeben unter der Name Paul".
// This approval is separate from the earlier four-plan approval on the same day.
// It covers the current discernment28 v1 text, all sixteen complete translations
// and the named resource selection. It is not an independent native-language audit.
export const DISCERNMENT_REVIEWED_LOCALES = [
  'fr', 'en', 'de', 'pt', 'zh', 'es', 'hi', 'ja', 'sw', 'am', 'id', 'tl', 'ko', 'ru', 'ar', 'fa',
];
export const DISCERNMENT_PLAN_SIGNOFF = {
  status: 'approved', reviewer: 'Paul', reviewedAt: '2026-09-03',
};
export const DISCERNMENT_PLAN_APPROVAL = {
  status: 'approved', contentVersion: 1,
  theology: { ...DISCERNMENT_PLAN_SIGNOFF },
  safety: { ...DISCERNMENT_PLAN_SIGNOFF },
  locales: Object.fromEntries(DISCERNMENT_REVIEWED_LOCALES.map((lang) => [lang, {
    ...DISCERNMENT_PLAN_SIGNOFF, scope: 'current-complete-translation',
  }])),
};

export const DISCERNMENT_RESOURCE_SIGNOFF = {
  status: 'approved', reviewedBy: 'Paul', reviewedAt: '2026-09-03',
  approvalId: 'discernment-2026-09-03',
};
// Closed audit list, not a blanket approval for the relationship catalogue.
// Existing entries keep their earlier approvals and edition verification dates.
export const DISCERNMENT_EXISTING_RESOURCE_IDS = [
  'keller-meaning-of-marriage', 'chapman-things-before-married',
  'chapman-five-love-languages-singles', 'allberry-7-myths-singleness',
  'fdm-marriage-is-a-ministry', 'shepherds-global-christian-family',
];
export const DISCERNMENT_NEW_RESOURCE_IDS = [
  'bibleproject-wisdom-proverbs', 'bibleproject-holy-spirit', 'alpha-pre-marriage-course',
  'gotquestions-found-spouse', 'gotquestions-christian-girlfriend',
  'gotquestions-dating-choice', 'lifechurch-dateable',
];
export const DISCERNMENT_RESOURCE_IDS = [
  ...DISCERNMENT_EXISTING_RESOURCE_IDS, ...DISCERNMENT_NEW_RESOURCE_IDS,
];
