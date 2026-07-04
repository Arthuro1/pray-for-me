// Centralized Free vs Supporter feature tiering — the single source of truth for
// which capabilities belong to which plan.
//
// Product principle:
//   "Free = pray faithfully. Supporter = organize, automate, collaborate, go
//    deeper, and help sustain Pray4Me."
//
// Pray4Me ships as a GENEROUS freemium app. This module declares the intended
// tiers now so the product can grow into a pay-what-you-can Supporter membership
// later WITHOUT rewiring every feature check — but it contains NO billing/payment
// logic and, while `BILLING_ENABLED` is false, it never actually locks anyone out
// (`isFeatureAvailable` returns true for everything). UI can still ask
// `getFeatureTier`/`isSupporterFeature` to show a gentle "Supporter" thank-you tag
// or a "coming soon" hint without crippling the free experience.
//
// NON-NEGOTIABLE guarantees encoded in FREE_FEATURES: the personal prayer journal,
// simple reminders, private prayers, basic vault protection, data export and
// account deletion are ALWAYS free. Privacy is never a paid upgrade.
//
// NOTE for future maintainers: a "Supporter membership" that unlocks advanced
// tools is NOT the same as a donation. Keep any true donation flow (see
// DonateModal) separate from feature access — a gift must never be required to
// use the app, and on mobile app stores unlocking features for payment may
// require in-app purchase. Keep this implementation provider-agnostic.

// Plan identifiers. `sponsor` is a higher giving level that unlocks the SAME
// advanced tools as `supporter` — higher amounts are framed as generosity, never
// as higher spiritual status.
export const PLANS = Object.freeze({ FREE: 'free', SUPPORTER: 'supporter', SPONSOR: 'sponsor' });

// Rank so any paid tier (supporter/sponsor) satisfies a "supporter-or-above" gate.
const PLAN_RANK = { [PLANS.FREE]: 0, [PLANS.SUPPORTER]: 1, [PLANS.SPONSOR]: 2 };

// Stable feature keys. Always reference these constants at call sites so a typo
// can't silently mis-tier a feature.
export const FEATURES = Object.freeze({
  // ── Free: a simple, complete, dignified personal prayer companion ──────────
  PRAYER_JOURNAL: 'prayerJournal',       // create / edit / archive prayers
  SIMPLE_REMINDERS: 'simpleReminders',   // today / daily / weekly / follow-up
  MARK_ANSWERED: 'markAnswered',
  BASIC_TESTIMONY: 'basicTestimony',
  BASIC_CATEGORIES: 'basicCategories',
  PRIVATE_PRAYERS: 'privatePrayers',
  VAULT_BASIC: 'vaultBasic',             // encrypted vault, limited allowance
  MULTILINGUAL: 'multilingual',
  COMMUNITY_BASIC: 'communityBasic',     // join a group, share a prayer
  DATA_EXPORT: 'dataExport',             // JSON export — a data right, never paid
  ACCOUNT_DELETION: 'accountDeletion',   // right to erasure — never paid
  PRIVACY_CENTER: 'privacyCenter',       // understanding your privacy — never paid

  // ── Supporter: organize, automate, collaborate, go deeper ──────────────────
  ADVANCED_SCHEDULING: 'advancedScheduling', // recurrence rules, rotations, until-answered
  PRAYER_CHAINS: 'prayerChains',
  GROUP_ADMIN: 'groupAdmin',
  LARGER_GROUPS: 'largerGroups',
  EXTRA_INVITES: 'extraInvites',         // invite links/QR beyond the free limit
  AI_ASSISTANCE: 'aiAssistance',         // AI prayer suggestions + Scripture reflections
  VAULT_UNLIMITED: 'vaultUnlimited',     // larger / unlimited encrypted vault
  CALENDAR_EXPORT: 'calendarExport',
  REFLECTION_INSIGHTS: 'reflectionInsights',
  ANSWERED_TIMELINE: 'answeredTimeline',
  RICH_EXPORT: 'richExport',             // PDF / devotional journal export
  ADVANCED_CUSTOMIZATION: 'advancedCustomization',
});

export const FREE_FEATURES = Object.freeze([
  FEATURES.PRAYER_JOURNAL,
  FEATURES.SIMPLE_REMINDERS,
  FEATURES.MARK_ANSWERED,
  FEATURES.BASIC_TESTIMONY,
  FEATURES.BASIC_CATEGORIES,
  FEATURES.PRIVATE_PRAYERS,
  FEATURES.VAULT_BASIC,
  FEATURES.MULTILINGUAL,
  FEATURES.COMMUNITY_BASIC,
  FEATURES.DATA_EXPORT,
  FEATURES.ACCOUNT_DELETION,
  FEATURES.PRIVACY_CENTER,
]);

export const SUPPORTER_FEATURES = Object.freeze([
  FEATURES.ADVANCED_SCHEDULING,
  FEATURES.PRAYER_CHAINS,
  FEATURES.GROUP_ADMIN,
  FEATURES.LARGER_GROUPS,
  FEATURES.EXTRA_INVITES,
  FEATURES.AI_ASSISTANCE,
  FEATURES.VAULT_UNLIMITED,
  FEATURES.CALENDAR_EXPORT,
  FEATURES.REFLECTION_INSIGHTS,
  FEATURES.ANSWERED_TIMELINE,
  FEATURES.RICH_EXPORT,
  FEATURES.ADVANCED_CUSTOMIZATION,
]);

const FREE_SET = new Set(FREE_FEATURES);
const SUPPORTER_SET = new Set(SUPPORTER_FEATURES);

// Master switch. While false (no subscription infrastructure yet) the app is a
// soft-gated freemium: tiers are declared for UI hints, but nothing is locked.
// Flip to true once billing exists to begin enforcing Supporter gates.
export const BILLING_ENABLED = false;

// Suggested pay-what-you-can giving levels, in euros/month. Amounts, not
// spiritualized tiers — every paid level unlocks the same advanced tools. Kept
// here so UI copy and any future checkout read one source of truth.
export const GIVING_LEVELS = Object.freeze([
  { id: 'supporter', amount: 2, plan: PLANS.SUPPORTER },
  { id: 'builder', amount: 5, plan: PLANS.SUPPORTER },
  { id: 'sponsor', amount: 10, plan: PLANS.SPONSOR },
]);

// The tier a feature belongs to: 'free' | 'supporter'. Unknown keys default to
// 'free' — an unrecognized feature must never be accidentally gated.
export function getFeatureTier(featureKey) {
  if (SUPPORTER_SET.has(featureKey)) return 'supporter';
  return 'free';
}

export function isSupporterFeature(featureKey) {
  return getFeatureTier(featureKey) === 'supporter';
}

// Read the current plan safely. No billing yet, so this is a scaffold: a local
// `pfm_plan` flag (useful for previewing Supporter UI) validated against PLANS,
// defaulting to 'free'. Never throws — works in SSR/tests where storage is absent.
export function getUserPlan() {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem('pfm_plan');
    if (raw && Object.values(PLANS).includes(raw)) return raw;
  } catch { /* storage unavailable — fall through */ }
  return PLANS.FREE;
}

export function isSupporter(userPlan = getUserPlan()) {
  return PLAN_RANK[userPlan] >= PLAN_RANK[PLANS.SUPPORTER];
}

// Whether the current plan may USE a feature right now.
//   • Free features are always available.
//   • While BILLING_ENABLED is false, EVERYTHING is available (soft gate) so the
//     free experience is never crippled.
//   • Once billing is on, Supporter features require a supporter-or-above plan.
// Never logs the feature key or plan — a plan check must not leak usage.
export function isFeatureAvailable(featureKey, userPlan = getUserPlan()) {
  if (FREE_SET.has(featureKey)) return true;
  if (!BILLING_ENABLED) return true;
  if (SUPPORTER_SET.has(featureKey)) return isSupporter(userPlan);
  return true; // unknown feature — default open
}
