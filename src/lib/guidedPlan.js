// Guided-plan helpers shared by the Plan tab (starting a plan yourself) and the
// invitation accept flow (starting a plan someone invited you to), so both build
// the SAME prayer instead of duplicating the schedule shape.
//
// Starting a guided plan creates ONE recurring daily prayer capped after N
// occurrences; schedule.plan = { id, version?, startDate } lets the engine number the days
// and prayerPlans.js supply each day's theme (see src/lib/planner.js).
import { PLANS } from '../content/prayerPlans';
import { t } from '../i18n';
import { todayKey } from './prayedLog';
import { canUsePlan } from './planReview';

// Look up a PLANS entry by its content id (e.g. 'fast3'); null if unknown.
export function planById(id) {
  const plan = PLANS.find((p) => p.id === id) || null;
  return canUsePlan(plan) ? plan : null;
}

// The personal-prayer payload for addPrayer() that represents "running this
// guided plan from `startDate`". `startDate` defaults to today.
export function buildGuidedPlanPrayer(plan, startDate, lang) {
  if (!canUsePlan(plan)) throw new Error('Plan content review is required');
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
      plan: {
        id: plan.id,
        startDate: start,
        ...(Number.isInteger(plan.version) && plan.version > 0 ? { version: plan.version } : {}),
      },
    },
  };
}

// What a running plan is CALLED on screen.
//
// The title and subtitle are WRITTEN INTO the prayer when the run is created, in
// whatever language the reader was using at that moment. A reader who later
// switched language was then left with a French plan name in a German app — and,
// worse, the AI translation toggle appeared over a name that already has a
// proper translation in all 16 locales. The plan owns its own name, so read it
// from the plan content in the language being read, never from the stored copy.
export function planPrayerText(plan, lang) {
  if (!plan?.titleKey) return null;
  return {
    title: t(lang, plan.titleKey),
    description: plan.subKey ? t(lang, plan.subKey) : '',
  };
}
