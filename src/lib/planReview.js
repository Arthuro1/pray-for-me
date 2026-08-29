// New relationship curricula are drafts until named human reviewers approve
// theology, safety, and every shipped language. Development previews are not a
// release switch: a production build always enforces these records.
import { LANG_CODES } from '../i18n';

export function hasReviewSignoff(review) {
  if (review?.status !== 'approved' || typeof review.reviewer !== 'string' || !review.reviewer.trim()) return false;
  if (typeof review.reviewedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedAt)) return false;
  const [year, month, day] = review.reviewedAt.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isPlanReviewed(plan) {
  if (!plan) return false;
  // Existing plans keep their established release behavior.
  if (!plan.review) return !['engaged', 'married'].includes(plan.lifeStage);
  return plan.review.status === 'approved'
    && hasReviewSignoff(plan.review.theology)
    && hasReviewSignoff(plan.review.safety)
    && LANG_CODES.every((lang) => hasReviewSignoff(plan.review.locales?.[lang]));
}

// A reviewer cannot correct what they cannot read, and a sign-off record is an
// attestation only a named human may write — so reading a draft is a device
// setting, never a content change. `?planPreview=1` turns review mode on for
// this browser (`0` turns it off), which is what makes a draft readable on a
// real deployed build; a development build previews drafts anyway. Everything
// review mode reveals keeps its "review pending" badge, and the sign-off
// records above stay the only thing that ever ships a plan.
const PREVIEW_KEY = 'pfm_plan_preview';

export function isPlanPreviewOn() {
  try { return localStorage.getItem(PREVIEW_KEY) === '1'; } catch { return false; }
}

export function setPlanPreview(on) {
  try {
    if (on) localStorage.setItem(PREVIEW_KEY, '1');
    else localStorage.removeItem(PREVIEW_KEY);
  } catch { /* private mode: review mode simply stays off */ }
}

// Read once at boot, before anything renders, so a reviewer only ever pastes
// the link — no build, no redeploy, no environment variable.
export function syncPlanPreviewFromUrl(search = typeof location === 'undefined' ? '' : location.search) {
  const value = new URLSearchParams(search || '').get('planPreview');
  if (value === '1' || value === 'true') setPlanPreview(true);
  else if (value === '0' || value === 'false') setPlanPreview(false);
  return isPlanPreviewOn();
}

export function canUsePlan(plan, { preview = import.meta.env.DEV || isPlanPreviewOn() } = {}) {
  return !!plan && (isPlanReviewed(plan) || preview === true);
}
