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

export function canUsePlan(plan, { preview = import.meta.env.DEV } = {}) {
  return !!plan && (isPlanReviewed(plan) || preview === true);
}
