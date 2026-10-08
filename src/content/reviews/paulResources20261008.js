// Explicit user instruction in the project conversation on 2026-10-08:
// "approve all that needed human review and sign with Paul".
// This records that user's approval of the five existing resources below.
// It does not claim an independent content audit, native-language review,
// newly verified links or obtainable editions, and approves no future entries.
export const PAUL_RESOURCE_SIGNOFF_20261008 = {
  status: 'approved',
  reviewedBy: 'Paul',
  reviewedAt: '2026-10-08',
  approvalId: 'resource-approval-2026-10-08',
  provenance: 'Explicit user instruction in the project conversation',
};

const approval = (status) => ({
  status,
  contentReview: { ...PAUL_RESOURCE_SIGNOFF_20261008 },
  safetyReview: { ...PAUL_RESOURCE_SIGNOFF_20261008 },
});

// Closed mapping: unavailable editions retain needs_review publication status
// even though content and safety approval have now been supplied.
export const RESOURCE_APPROVALS_20261008 = {
  'jouvet-du-celibat-vie-couple': approval('approved'),
  'lehmann-wir-powergirls': approval('approved'),
  'lehmann-rakete-startklar': approval('approved'),
  'trobisch-allein-leben-lernen': approval('needs_review'),
  'ruthe-so-stell-ich-mir-die-liebe-vor': approval('needs_review'),
};
