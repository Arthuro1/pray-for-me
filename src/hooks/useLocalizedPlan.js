import { useEffect, useState } from 'react';
import { getPlan, planDayContent } from '../content/prayerPlans';
import { loadPlanTranslations, mergePlan } from '../content/plans/translations';

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
    // that has not declared prose translations: an overlay file is per LANGUAGE,
    // not per plan, so fetching one for a plan it does not cover would pull a
    // sizeable chunk down for nothing (see `proseTranslations` in
    // docs/PRAYER_PLANS.md).
    if (lang === 'en' || lang === 'fr' || !plan.proseTranslations) { setLocalized(plan); return undefined; }
    let alive = true;
    setLocalized(plan);
    loadPlanTranslations(lang).then((overlay) => {
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
export function useLocalizedPlanDay(planId, dayNumber, lang) {
  const plan = planId ? getPlan(planId) : null;
  const localizedPlan = useLocalizedPlan(plan, lang);
  if (!localizedPlan || !dayNumber) return null;
  return planDayContent(planId, dayNumber, localizedPlan);
}
