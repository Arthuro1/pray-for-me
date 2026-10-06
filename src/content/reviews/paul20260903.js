// Paul's explicit approval in the project conversation on 2026-09-03.
// Scope: the four currently pending v1 plans, their optional role content,
// existing language presentations/fallbacks, and associated resource content.
// This is a dated record, never a default for future plans, locales or entries.
// It does not verify URLs, revive unavailable editions or complete translations.
export const REVIEWED_PLAN_IDS = ['covenant21', 'marriage30', 'freedom30', 'david12'];
export const REVIEWED_LOCALES = ['en', 'fr', 'de', 'es', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'fa', 'hi', 'id', 'sw', 'tl', 'am'];

export const PAUL_PLAN_SIGNOFF = { status: 'approved', reviewer: 'Paul', reviewedAt: '2026-09-03' };
export const PAUL_RESOURCE_SIGNOFF = { status: 'approved', reviewedBy: 'Paul', reviewedAt: '2026-09-03' };

// The 2026-09-23 wording pass changed text after Paul signed. The plans stay
// live on his sign-off above; each note lists what he has not re-read yet.
// Only Paul re-approving clears a note — never an AI, never a script.
export const PAUL_REREVIEW_PENDING = {
  covenant21: { since: '2026-09-23', changed: 'de and ru prose rewritten in full (both were compressed); es and pt gained 5 safety notes (days 8, 10, 13, 17, 20) and 4 shared prayers (days 14, 15, 18, 21) that were missing. EN and FR unchanged.' },
  marriage30: { since: '2026-09-23', changed: 'EN and FR introduction; FR day 2 reflection and day 5 self-prompt (grammar); FR plan subtitle.' },
  freedom30: { since: '2026-09-23', changed: 'Day 14 first prompt in EN and FR ("keep you from inventing"); DE subtitle, two movement titles and two follow-up descriptions; ZH labels and 30 day themes converted from Traditional to Simplified characters (the zh locale is Simplified), plus five mainland word choices (添加, 推荐, 保存/发送, 用它祷告, 仍需要祷告).' },
  david12: { since: '2026-09-23', changed: 'FR title of the fourth movement ("Un cœur reconnaissant qui s’abandonne à Dieu").' },
};

export const PLAN_APPROVALS = Object.fromEntries(REVIEWED_PLAN_IDS.map((id) => [id, {
  status: 'approved',
  contentVersion: 1,
  rereviewPending: PAUL_REREVIEW_PENDING[id],
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
