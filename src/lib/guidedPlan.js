// Guided-plan helpers shared by the Plan tab (starting a plan yourself) and the
// invitation accept flow (starting a plan someone invited you to), so both build
// the SAME prayer instead of duplicating the schedule shape.
//
// Starting a guided plan creates ONE recurring daily prayer capped after N
// occurrences; schedule.plan = { id, startDate } lets the engine number the days
// and prayerPlans.js supply each day's theme (see src/lib/planner.js).
import { PLANS } from '../content/prayerPlans';
import { t } from '../i18n';
import { todayKey } from './prayedLog';

// Look up a PLANS entry by its content id (e.g. 'fast3'); null if unknown.
export function planById(id) {
  return PLANS.find((p) => p.id === id) || null;
}

// The personal-prayer payload for addPrayer() that represents "running this
// guided plan from `startDate`". `startDate` defaults to today.
export function buildGuidedPlanPrayer(plan, startDate, lang) {
  const start = startDate || todayKey();
  return {
    title: t(lang, plan.titleKey),
    description: t(lang, plan.subKey),
    categoryIds: [],
    schedule: {
      type: 'recurring',
      freq: 'daily',
      startDate: start,
      end: { kind: 'count', count: plan.count },
      plan: { id: plan.id, startDate: start },
    },
  };
}
