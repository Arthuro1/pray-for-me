// Explicit user instruction in the project conversation on 2026-10-08:
// "approve all that needed human review and sign with Paul".
// This records that supplied approval; it is not an independent review by an AI
// or a claim that Paul performed a native-language audit. The closed scope is
// zechariah10 v1 as currently presented (including English prose fallbacks),
// plus the six exact wording re-review notes below. Future content, versions,
// locales and changed notes need their own approval.
export const PLAN_APPROVAL_PROVENANCE = Object.freeze({
  approvalId: 'plan-reviews-2026-10-08',
  source: 'explicit-user-instruction',
  instruction: 'approve all that needed human review and sign with Paul',
  reviewer: 'Paul',
  reviewedAt: '2026-10-08',
});

export const PLAN_SIGNOFF_20261008 = Object.freeze({
  status: 'approved',
  reviewer: PLAN_APPROVAL_PROVENANCE.reviewer,
  reviewedAt: PLAN_APPROVAL_PROVENANCE.reviewedAt,
  approvalId: PLAN_APPROVAL_PROVENANCE.approvalId,
});

// An explicit list rather than LANG_CODES: adding a language cannot grant it
// an approval from this historical instruction.
export const ALTAR_REVIEWED_LOCALES = Object.freeze([
  'en', 'fr', 'de', 'es', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'fa', 'hi', 'id', 'sw', 'tl', 'am',
]);

export const AT_THE_ALTAR_APPROVAL = Object.freeze({
  status: 'approved',
  contentVersion: 1,
  draftedAt: '2026-10-06',
  draftedWith: 'ai-assisted',
  sensitive: false,
  approvalId: PLAN_APPROVAL_PROVENANCE.approvalId,
  theology: { ...PLAN_SIGNOFF_20261008 },
  safety: { ...PLAN_SIGNOFF_20261008 },
  locales: Object.fromEntries(ALTAR_REVIEWED_LOCALES.map((lang) => [lang, {
    ...PLAN_SIGNOFF_20261008,
    scope: 'current-presentation-including-authored-fallbacks',
  }])),
});

// Retain the exact notes Paul approved so a later wording change cannot be
// cleared just because it belongs to one of these plans.
const REREVIEW_NOTES = {
  covenant21: 'de and ru prose rewritten in full (both were compressed); es and pt gained 5 safety notes (days 8, 10, 13, 17, 20) and 4 shared prayers (days 14, 15, 18, 21) that were missing. EN and FR unchanged.',
  marriage30: 'EN and FR introduction; FR day 2 reflection and day 5 self-prompt (grammar); FR plan subtitle.',
  freedom30: 'Day 14 first prompt in EN and FR ("keep you from inventing"); DE subtitle, two movement titles and two follow-up descriptions; ZH labels and 30 day themes converted from Traditional to Simplified characters (the zh locale is Simplified), plus five mainland word choices (添加, 推荐, 保存/发送, 用它祷告, 仍需要祷告).',
  david12: 'FR title of the fourth movement ("Un cœur reconnaissant qui s’abandonne à Dieu").',
  discernment28: 'EN and FR reading prompts on days 4 and 7; 93 DE corrections (two truncated entries completed, calques, „“ quotes, du-form prayers ending „Im Namen Jesu“); DE label for the reflection section.',
  wisdom42: 'DE title of week 5.',
};

export const PLAN_REREVIEW_APPROVALS = Object.freeze(Object.fromEntries(
  Object.entries(REREVIEW_NOTES).map(([id, changed]) => [id, Object.freeze({
    ...PLAN_SIGNOFF_20261008,
    contentVersion: 1,
    since: '2026-09-23',
    changed,
    scope: 'wording-changes-described-in-note',
  })]),
));

// Preserve the original theology, safety and locale records. Only the dated
// note covered by this explicit instruction moves from pending into history.
export function withApprovedPlanRereview(id, review) {
  const approval = PLAN_REREVIEW_APPROVALS[id];
  const pending = review?.rereviewPending;
  if (!approval || review?.contentVersion !== approval.contentVersion
    || pending?.since !== approval.since || pending?.changed !== approval.changed) return review;
  const current = { ...review };
  delete current.rereviewPending;
  return {
    ...current,
    rereviewHistory: [...(review.rereviewHistory || []), approval],
  };
}
