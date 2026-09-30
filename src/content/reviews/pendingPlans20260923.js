// Thirteen curricula drafted on 2026-09-23 with AI assistance.
//
// NOTHING in this file is an approval. Every record is `needs_review` and names
// no reviewer and no date, so isPlanReviewed() is false: the plan stays in the
// data catalogue, carries its "review pending" badge, and can be read only in
// review preview (`?planPreview=1`, or any development build). A plan becomes
// public only when a named human replaces its record with dated theology,
// safety and all-locale sign-offs — never an AI, never a script. Earlier
// approvals (paul20260903, paulWisdom20260908, paulDiscernment20260903,
// paulAuthorBooks20260923) do not cover any of this content.
//
// What each reviewer must check is listed per plan in
// docs/NEW_PLANS_2026-09-23.md and docs/plans/<plan-id>.md.
export const NEW_PLAN_IDS = [
  'fruit10', 'identity21', 'kingdomCome14', 'holySpirit21',
  'children21', 'prodigal30', 'unbelievers30', 'work21', 'psalms42',
  'manOfGod21', 'womanOfGod21', 'unborn21', 'churchHurt21',
];

// Plans whose subject alone needs a safeguarding reviewer, not only a
// theological one (pregnancy and loss, abuse, guidance claims, disputed
// gender roles, estranged family).
export const SENSITIVE_PLAN_IDS = [
  'unborn21', 'churchHurt21', 'holySpirit21', 'prodigal30', 'manOfGod21', 'womanOfGod21',
];

const PENDING = { status: 'needs_review' };

export function pendingPlanReview(planId) {
  if (!NEW_PLAN_IDS.includes(planId)) throw new Error(`No pending review record for ${planId}`);
  return {
    status: 'needs_review',
    contentVersion: 1,
    draftedAt: '2026-09-23',
    draftedWith: 'ai-assisted',
    sensitive: SENSITIVE_PLAN_IDS.includes(planId),
    theology: { ...PENDING },
    safety: { ...PENDING },
    // No locale has been reviewed; EN and FR are authored, the other fourteen
    // show AI-drafted day titles and English prose.
    locales: {},
  };
}
