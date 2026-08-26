// The ONE way a guided plan lands on someone's calendar.
//
// There are four entry points — the Plan tab's own start button, accepting a
// "pray together" invitation from either the Plan tab or Community, and joining
// a plan a group is praying. They used to call buildGuidedPlanPrayer directly,
// which meant only the first honoured a plan's onboarding: a spouse invited to
// marriage30 got it with no partner name, no private/together choice, no role
// and no children, permanently, because personalization can only be captured at
// the start of a run. The review gate was skipped in the same way, so in
// production the invitation paths reported success while creating nothing.
//
// So every path comes through here. A plan that asks its onboarding questions is
// handed back as `needs_onboarding` rather than started silently; the caller
// either shows the sheet or sends the user to the Plan tab, which will.
import { buildGuidedPlanPrayer } from './guidedPlan';
import { canUsePlan } from './planReview';
import { isCouplePlan } from './planPersonalization';
import { savePlanPersonalization, clearPlanPersonalization } from './planPersonalizationStorage';
import { savePlanPrefs, hasPlanPrefs } from './planPrefs';

// Does this plan still owe the user its onboarding questions?
//
// Couple plans ask every run, because the answers (a partner's name, praying
// privately or together, children) belong to THAT run and are stored under its
// id. The singles plan asks once and keeps the answers for later runs.
export function needsOnboarding(plan) {
  if (!plan?.onboarding) return false;
  return isCouplePlan(plan) || !hasPlanPrefs(plan.id);
}

//   { ok: true, prayerId }              the plan is on the calendar
//   { ok: false, reason: 'unavailable' } content review has not passed
//   { ok: false, reason: 'onboarding' }  the caller must collect answers first
//   { ok: false, reason: 'create' }      the prayer could not be created
export async function startGuidedPlan({
  plan, startDate, lang, ownerId, addPrayer, prefs = null, skipOnboarding = false,
}) {
  if (!canUsePlan(plan)) return { ok: false, reason: 'unavailable' };
  if (!prefs && !skipOnboarding && needsOnboarding(plan)) return { ok: false, reason: 'onboarding' };

  // A couple plan's answers are private to one RUN, so the run id is minted
  // first and used as the prayer id — that is what lets usePlanDay find them
  // again from the prayer alone.
  let runId = null;
  if (isCouplePlan(plan) && ownerId) {
    runId = crypto.randomUUID();
    try {
      await savePlanPersonalization(ownerId, runId, prefs || {});
    } catch {
      // The plan stays complete without personalization; never downgrade a
      // name to plaintext just because private storage is unavailable.
      runId = null;
    }
  } else if (prefs) {
    savePlanPrefs(plan.id, prefs);
  }

  const prayerId = await addPrayer({
    ...buildGuidedPlanPrayer(plan, startDate, lang),
    ...(runId ? { id: runId } : {}),
  });
  if (!prayerId) {
    if (runId && ownerId) await clearPlanPersonalization(ownerId, runId);
    return { ok: false, reason: 'create' };
  }
  return { ok: true, prayerId };
}
