// The ONE way a guided plan lands on someone's calendar.
//
// There are four entry points — the Plan tab's own start button, accepting a
// "pray together" invitation from either the Plan tab or Community, and joining
// a plan a group is praying. They used to call buildGuidedPlanPrayer directly,
// which meant only the first honoured the content review gate, so in production
// the invitation paths reported success while creating nothing.
//
// Starting used to be gated behind a sheet of questions as well, which is why
// three of those four screens could not finish a start on their own: they had no
// sheet, so they recorded an intent and sent the reader to the Plan tab to
// complete it. That gate is gone. A plan begins where it was tapped, and is
// tailored afterwards from its own day (see PlanPersonalizeModal) — where the
// reader can see what an answer changes before giving it.
import { buildGuidedPlanPrayer } from './guidedPlan';
import { canUsePlan } from './planReview';

//   { ok: true, prayerId }               the plan is on the calendar
//   { ok: false, reason: 'unavailable' } content review has not passed
//   { ok: false, reason: 'create' }      the prayer could not be created
export async function startGuidedPlan({ plan, startDate, lang, addPrayer }) {
  if (!canUsePlan(plan)) return { ok: false, reason: 'unavailable' };
  const prayerId = await addPrayer(buildGuidedPlanPrayer(plan, startDate, lang));
  if (!prayerId) return { ok: false, reason: 'create' };
  return { ok: true, prayerId };
}
