// Per-plan onboarding answers, kept on the device only.
//
// PRIVACY: what a person hopes for in marriage, or the areas they want to grow
// in, is exactly the kind of thing that must not leave the device. So this
// stores nothing but SHORT IDS from the fixed lists below, in localStorage,
// alongside the other on-device progress (see guideProgress.js). No free text,
// no server row, nothing in analytics.
//
// Nothing here is collected unless it CHANGES something the reader will see:
// `role` picks which optional reflection a day shows, `growth` ranks the
// resources on the "Go deeper" shelf. Neither adds, removes or reorders a day —
// the 21-day sequence is identical for everyone.
const KEY = 'pfm_plan_prefs';

// "Would you like reflections specifically about preparing to be a husband or
// wife?" — asked explicitly, never inferred from a name, a photo or anything
// else, and defaulting to the general plan.
export const ROLES = [
  { id: 'general', labelKey: 'planPrepRoleGeneral' },
  { id: 'husband', labelKey: 'planPrepRoleHusband' },
  { id: 'wife', labelKey: 'planPrepRoleWife' },
];

// The wording a day uses when no one has chosen — and the value that means "I
// was asked and I want it general". An ABSENT role means the question has not
// been put yet, which is what lets a plan day offer it at the moment it matters.
export const DEFAULT_ROLE = 'general';

// Growth areas matter more than the husband/wife choice (they are what actually
// personalizes the journey). Each maps to resource topics, which is the ONLY
// thing they change — the prayers and Scripture stay the same for everyone.
export const GROWTH_AREAS = [
  { id: 'responsibility', labelKey: 'planPrepGrowthResponsibility', topics: ['character'] },
  { id: 'serving', labelKey: 'planPrepGrowthServing', topics: ['character', 'marriage'] },
  { id: 'communication', labelKey: 'planPrepGrowthCommunication', topics: ['communication'] },
  { id: 'trust', labelKey: 'planPrepGrowthTrust', topics: ['contentment', 'discernment'] },
  { id: 'purity', labelKey: 'planPrepGrowthPurity', topics: ['purity', 'sexuality'] },
  { id: 'healing', labelKey: 'planPrepGrowthHealing', topics: ['healing'] },
  { id: 'maturity', labelKey: 'planPrepGrowthMaturity', topics: ['character', 'communication'] },
  { id: 'leadership', labelKey: 'planPrepGrowthLeadership', topics: ['character', 'marriage'] },
  { id: 'receivingHelp', labelKey: 'planPrepGrowthReceivingHelp', topics: ['community', 'healing'] },
  { id: 'conflict', labelKey: 'planPrepGrowthConflict', topics: ['conflict', 'forgiveness'] },
  { id: 'finances', labelKey: 'planPrepGrowthFinances', topics: ['finances'] },
  { id: 'familyExpectations', labelKey: 'planPrepGrowthFamily', topics: ['family'] },
];

const ROLE_IDS = new Set(ROLES.map((r) => r.id));
const GROWTH_IDS = new Set(GROWTH_AREAS.map((g) => g.id));

function readAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(all) {
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* storage unavailable */ }
}

// Drop anything that is not a known id, so a stale or hand-edited value can
// never reach the UI or the resource resolver.
function sanitize(prefs) {
  const out = {};
  if (ROLE_IDS.has(prefs?.role)) out.role = prefs.role;
  out.growth = (prefs?.growth || []).filter((id) => GROWTH_IDS.has(id));
  if (typeof prefs?.startedAt === 'string') out.startedAt = prefs.startedAt;
  if (typeof prefs?.completedAt === 'string') out.completedAt = prefs.completedAt;
  return out;
}

// The saved answers for a plan, always in a usable shape: an unanswered plan
// returns an empty set of answers rather than null, so every caller can read
// prefs without a special case. `role` is absent until it has actually been
// answered — read it as `prefs.role || DEFAULT_ROLE` to render.
export function getPlanPrefs(planId) {
  return sanitize(readAll()[planId]);
}

export function savePlanPrefs(planId, prefs) {
  if (!planId) return;
  const all = readAll();
  const previous = all[planId] || {};
  all[planId] = { ...sanitize({ ...previous, ...prefs }), startedAt: previous.startedAt || new Date().toISOString() };
  writeAll(all);
}

export function markPlanCompleted(planId) {
  if (!planId) return;
  const all = readAll();
  all[planId] = { ...sanitize(all[planId]), completedAt: new Date().toISOString() };
  writeAll(all);
}

// ── Completion reported once, per run ────────────────────────────────────────
// A plan's `completed` event used to fire only if the reader took a follow-up
// action, so finishing thirty days and closing the app counted as nothing. It
// now fires when the last day is actually behind them — which means it needs a
// guard, because the completion card renders on every visit to that prayer.
//
// Keyed by PRAYER id, not plan id, so a renewable plan started again is counted
// again. Device-local and content-free, like the rest of this module.
const REPORTED_KEY = 'pfm_plan_completed_reported';
const MAX_REPORTED = 200;

function readReported() {
  try {
    const parsed = JSON.parse(localStorage.getItem(REPORTED_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

// True the FIRST time it is asked about a run, false ever after — so a caller
// can simply guard on it. A device that cannot store anything reports every
// time it re-renders, so it fails closed instead: nothing is reported.
export function claimPlanCompletionReport(prayerId) {
  if (!prayerId) return false;
  const reported = readReported();
  if (reported.includes(prayerId)) return false;
  try {
    localStorage.setItem(REPORTED_KEY, JSON.stringify([...reported, prayerId].slice(-MAX_REPORTED)));
  } catch {
    return false;
  }
  return true;
}

// Clearing a plan's answers is part of "my data is mine": ending or restarting a
// plan should not leave a record of what someone once said they hoped for.
export function clearPlanPrefs(planId) {
  const all = readAll();
  if (!(planId in all)) return;
  delete all[planId];
  writeAll(all);
}

// ── Resource languages ───────────────────────────────────────────────────────
// Recommended books, articles and teachings are shown in the app's language by
// default — that requires no configuration and is what almost everyone wants.
// This list holds the ADDITIONAL languages someone has explicitly said they can
// read, which is the only way a resource in another language is ever offered
// (see the fallback hierarchy in src/lib/resources.js). Device-local, like the
// rest of this module.
const LANG_KEY = 'pfm_resource_langs';

export function getResourceFallbackLanguages() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LANG_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function setResourceFallbackLanguages(codes) {
  try { localStorage.setItem(LANG_KEY, JSON.stringify([...new Set(codes || [])])); } catch { /* storage unavailable */ }
}

// Resource topics the user's growth areas ask us to prefer. Used to rank, never
// to filter — a day's own topics still decide what is relevant.
export function growthTopics(prefs) {
  const chosen = new Set(prefs?.growth || []);
  const topics = new Set();
  for (const area of GROWTH_AREAS) {
    if (chosen.has(area.id)) area.topics.forEach((t) => topics.add(t));
  }
  // The optional layers a married couple added also rank already-relevant
  // resources; they never broaden a day's topic filter or reach analytics.
  const includeTopics = {
    children: ['children', 'parenting', 'family-discipleship'],
    home: ['family', 'hospitality'],
    'extended-family': ['family-of-origin', 'boundaries'],
  };
  for (const include of prefs?.includes || []) {
    for (const topic of includeTopics[include] || []) topics.add(topic);
  }
  return [...topics];
}
