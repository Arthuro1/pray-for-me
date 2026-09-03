// Paul's explicit approval in the project conversation on 2026-09-03.
// Scope: the four currently pending v1 plans, their optional role content,
// existing language presentations/fallbacks, and associated resource content.
// This is a dated record, never a default for future plans, locales or entries.
// It does not verify URLs, revive unavailable editions or complete translations.
export const REVIEWED_PLAN_IDS = ['covenant21', 'marriage30', 'freedom30', 'david12'];
export const REVIEWED_LOCALES = ['en', 'fr', 'de', 'es', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'fa', 'hi', 'id', 'sw', 'tl', 'am'];

export const PAUL_PLAN_SIGNOFF = { status: 'approved', reviewer: 'Paul', reviewedAt: '2026-09-03' };
export const PAUL_RESOURCE_SIGNOFF = { status: 'approved', reviewedBy: 'Paul', reviewedAt: '2026-09-03' };

export const PLAN_APPROVALS = Object.fromEntries(REVIEWED_PLAN_IDS.map((id) => [id, {
  status: 'approved',
  contentVersion: 1,
  theology: { ...PAUL_PLAN_SIGNOFF },
  safety: { ...PAUL_PLAN_SIGNOFF },
  locales: Object.fromEntries(REVIEWED_LOCALES.map((lang) => [lang, {
    ...PAUL_PLAN_SIGNOFF,
    scope: 'current-presentation-including-authored-fallbacks',
  }])),
}]));

// Explicit audit targets; these lists do not stamp runtime approval onto a
// catalogue. The records live on each selected resource below its own status.
export const APPROVED_RESOURCE_IDS = [
  'fdm-marriage-is-a-ministry',
  'shepherds-global-christian-family',
  'dg-ask-pastor-john',
  'todd-relationship-goals',
  'thomas-sacred-search',
  'thomas-sacred-marriage',
  'feldhahn-secrets-sex-marriage',
  'eggerichs-love-respect',
  'stuart-single-dating-engaged-married',
  'dufour-construire-mariage-epanoui',
  'dufour-de-a-a-sexe',
  'karambiri-premieres-annees',
  'karambiri-sept-regles-couple',
  'sanogo-six-sagesses-mariage',
  'lilliane-sanogo-sept-alertes',
  'tsengue-preparer-reussir-mariage',
  'heward-mills-model-marriage',
  'funke-adejumo-marriage-destiny',
  'felix-adejumo-woman-in-your-house',
  'berger-liebe-laesst-sich-lernen',
  'schmidt-liebeslust',
  'schmidt-alltagslust',
  'schmidt-endlich-gleich',
  'hartl-kunst-frau-lieben',
  'hartl-kunst-mann-lieben',
  'lehmann-sexualerziehung-familiensache',
  'buth-frau-sein',
  'cdf-origins-monarchy-2026',
  'jewish-museum-tel-dan',
  'louvre-mesha-stele',
  'mesha-reading-hypothetical',
  'mesha-reading-defence',
  'daahl-atlas',
  'british-museum-philistine-pottery',
  'iaa-qeiyafa-2013',
  'tau-ancient-jerusalem',
];

// Content approval is recorded, but the current editions remain unavailable.
// Keep status needs_review until an obtainable, verified edition is selected.
export const CONTENT_ONLY_RESOURCE_IDS = [
  'berger-garten-der-liebe',
  'trobisch-mit-freuden-frau-sein',
  'trobisch-du-bist-mir-wichtig',
  'ruthe-mimosen-und-dickhaeuter',
  'ruthe-intim-gefragt',
];
