// A one-shot handoff for "start this plan, but ask its questions first".
//
// Accepting an invitation from Community, or joining a plan a group is praying,
// happens on a screen that has no onboarding sheet. Rather than start a couple
// plan with no answers — which can never be corrected for that run — those
// screens record the intent here and send the user to the Plan tab, which owns
// the sheet and completes the start properly.
//
// Deliberately module-local and single-use: it is a navigation intent, not
// state. Nothing about it is persisted, and a reload simply drops it.
let pending = null;

export function requestPlanStart(planId, startDate) {
  if (planId) pending = { planId, startDate: startDate || null };
}

// Reads and clears in one step, so a re-render can't start the plan twice.
export function takePlanStart() {
  const claimed = pending;
  pending = null;
  return claimed;
}

export function __resetPendingPlanStartForTests() {
  pending = null;
}
