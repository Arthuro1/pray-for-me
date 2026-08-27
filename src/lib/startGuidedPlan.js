// The ONE way a guided plan lands on someone's calendar.
//
// There are four entry points — the Plan tab's own start button, accepting a
// "pray together" invitation from either the Plan tab or Community, and joining
// a plan a group is praying. They used to call buildGuidedPlanPrayer directly,
// which meant only the first honoured the content review gate, so in production
// the invitation paths reported success while creating nothing.
//
// Most plans begin where they were tapped and can be tailored afterwards from
// their own day. The singles marriage-preparation plan is the exception: its two
// small choices affect the wording and resources from day one, so every start
// first hands those choices back to the Plan tab.
import { buildGuidedPlanPrayer } from './guidedPlan';
import { canUsePlan } from './planReview';
import { savePlanPrefs } from './planPrefs';

export function needsPreStartPersonalization(plan) {
  return plan?.lifeStage === 'single' && !!plan?.onboarding;
}

//   { ok: true, prayerId }               the plan is on the calendar
//   { ok: false, reason: 'unavailable' } content review has not passed
//   { ok: false, reason: 'personalize' } the singles choices must be collected
//   { ok: false, reason: 'create' }      the prayer could not be created
export async function startGuidedPlan({ plan, startDate, lang, addPrayer, prefs = null }) {
  if (!canUsePlan(plan)) return { ok: false, reason: 'unavailable' };
  if (needsPreStartPersonalization(plan) && !prefs) return { ok: false, reason: 'personalize' };
  const prayerId = await addPrayer(buildGuidedPlanPrayer(plan, startDate, lang));
  if (!prayerId) return { ok: false, reason: 'create' };
  if (needsPreStartPersonalization(plan)) savePlanPrefs(plan.id, prefs);
  return { ok: true, prayerId };
}
