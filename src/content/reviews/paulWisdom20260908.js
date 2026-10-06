// User confirmation in the project conversation: "review approved from Paul".
// Scope: wisdom42 v1 and its four linked resource entries as presented for review.
// Locale approval covers current presentations, including English fallbacks;
// it does not attest to translations that have not been authored or to a new
// independent audit of external content. Link verification remains separate.
export const WISDOM_REVIEWED_LOCALES = [
  'en', 'fr', 'de', 'es', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'fa', 'hi', 'id', 'sw', 'tl', 'am',
];
export const WISDOM_PLAN_SIGNOFF = {
  status: 'approved', reviewer: 'Paul', reviewedAt: '2026-09-08',
};
// The 2026-09-23 wording pass changed text after Paul signed. The plan stays
// live on his sign-off; only Paul re-approving clears this note.
export const WISDOM_REREVIEW_PENDING = {
  since: '2026-09-23',
  changed: 'DE title of week 5.',
};
export const WISDOM_PLAN_APPROVAL = {
  status: 'approved', contentVersion: 1,
  rereviewPending: WISDOM_REREVIEW_PENDING,
  theology: { ...WISDOM_PLAN_SIGNOFF },
  safety: { ...WISDOM_PLAN_SIGNOFF },
  locales: Object.fromEntries(WISDOM_REVIEWED_LOCALES.map((lang) => [lang, {
    ...WISDOM_PLAN_SIGNOFF,
    scope: 'current-presentation-including-authored-fallbacks',
  }])),
};
export const WISDOM_APPROVED_RESOURCE_IDS = [
  'bibleproject-wisdom-videos',
  'bibleproject-wisdom-podcast',
  'ligonier-introduction-wisdom',
  'evangile21-james-resources',
];
export const WISDOM_RESOURCE_SIGNOFF = {
  status: 'approved', reviewedBy: 'Paul', reviewedAt: '2026-09-08',
};
