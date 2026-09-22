// The public link to a guided plan, and the one intent it has to carry across
// sign-up.
//
//   https://praystead.com/plans/<planId>/<token>?lang=<sharer's language>
//
// The plan id sits in the PATH so the link-preview function can name the plan
// without a database round trip (api/plan-preview.js), and so the token
// survives an email confirmation, whose redirect keeps the path but drops the
// query string (see authRedirectTarget). The token is what names the sharer;
// without one the same URL is a plain public plan page. `lang` only picks the
// language of the link preview: the page itself renders in the visitor's own.
//
// A link carries no prayer content, ever, only which plan it is.
import { isPlanReviewed } from './planReview';

const PLAN_SHARE_PATH = /^\/plans\/([A-Za-z0-9_-]{1,64})(?:\/([A-Za-z0-9_-]{16,32}))?\/?$/;

// { planId, token } for a plan link path (token null when absent), else null.
export function parsePlanSharePath(pathname) {
  const match = PLAN_SHARE_PATH.exec(pathname || '');
  return match ? { planId: match[1], token: match[2] || null } : null;
}

export function isPlanSharePath(pathname) {
  return parsePlanSharePath(pathname) !== null;
}

export function planShareUrl({ origin, planId, token = null, lang = null }) {
  const path = `/plans/${encodeURIComponent(planId)}${token ? `/${encodeURIComponent(token)}` : ''}`;
  return `${origin}${path}${lang ? `?lang=${encodeURIComponent(lang)}` : ''}`;
}

// Only content that has passed its sign-off leaves the app. Review mode lets a
// reviewer READ a draft on this device; it never lets them publish one.
export function isPlanShareable(plan) {
  return isPlanReviewed(plan);
}

// ── The "Join this plan" intent ─────────────────────────────────────────────
// A visitor taps Join on the public page, then has to create an account, which
// may mean confirming an email first. What they chose (this plan, this start
// day) is kept on the device so the plan can start the moment they arrive
// signed in, instead of asking them to choose again. One pending join at a
// time, and it goes stale after a week so a forgotten tap can never start a
// plan out of nowhere months later.
const PENDING_KEY = 'pfm_pending_plan_join';
const PENDING_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function savePendingPlanJoin({ planId, token = null, startDate }, now = Date.now()) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ planId, token, startDate, savedAt: now }));
  } catch { /* storage unavailable: the join page asks again instead */ }
}

function readPending(now) {
  try {
    const value = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
    if (!value?.planId || typeof value.savedAt !== 'number' || now - value.savedAt > PENDING_TTL_MS) return null;
    return value;
  } catch {
    return null;
  }
}

// True while a join is waiting for its account, so the generic first-run
// onboarding stays out of the way: the plan's first day IS their first prayer.
export function hasPendingPlanJoin(now = Date.now()) {
  return readPending(now) !== null;
}

// Reads and clears the pending join for `planId` (one-shot, so a reload can't
// start the plan twice). A pending join for a different plan is left alone.
export function takePendingPlanJoin(planId, now = Date.now()) {
  const pending = readPending(now);
  if (!pending || pending.planId !== planId) return null;
  try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
  return { planId: pending.planId, token: pending.token || null, startDate: pending.startDate || null };
}
