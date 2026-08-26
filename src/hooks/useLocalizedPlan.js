import { useEffect, useState } from 'react';
import { getPlan, planDayContent } from '../content/prayerPlans';
import { loadPlanTranslations, mergePlan } from '../content/plans/translations';
import { canUsePlan } from '../lib/planReview';

// Guided-plan content with the reader's language folded in.
//
// Day themes are authored inline in all 16 languages, so a plan is already
// usable the moment it renders; only the longer prose (reflections, prompts,
// practices, intro, completion) needs the on-demand overlay. Both hooks return
// the AUTHORED content first and re-render once the overlay arrives, so nothing
// ever waits on a fetch — and en/fr never fetch at all.

export function useLocalizedPlan(plan, lang) {
  const [localized, setLocalized] = useState(plan);

  useEffect(() => {
    if (!plan) { setLocalized(plan); return undefined; }
    // en/fr are authored in the source — no overlay to fetch. Neither is a plan
    // that has not declared prose translations: overlays are lazy per plan and
    // language, so fetching one for a plan with no overlay would do work for
    // nothing (see `proseTranslations` in
    // docs/PRAYER_PLANS.md).
    if (!canUsePlan(plan) || lang === 'en' || lang === 'fr' || !plan.proseTranslations) { setLocalized(plan); return undefined; }
    let alive = true;
    setLocalized(plan);
    loadPlanTranslations(lang, plan.id).then((overlay) => {
      if (alive) setLocalized(mergePlan(plan, overlay, lang));
    });
    return () => { alive = false; };
  }, [plan, lang]);

  return localized;
}

// One day of a running plan, localized. Safe to call unconditionally: a missing
// plan id or day number simply resolves to null, so callers that only sometimes
// sit on a plan day (the session walk, the prayer detail page) can still obey
// the rules of hooks.
export function useLocalizedPlanDay(planId, dayNumber, lang, version = null) {
  const resolved = planId ? getPlan(planId, version) : null;
  const plan = canUsePlan(resolved) ? resolved : null;
  const localizedPlan = useLocalizedPlan(plan, lang);
  if (!localizedPlan || !dayNumber) return null;
  return planDayContent(planId, dayNumber, localizedPlan);
}
