import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPlan } from '../content/prayerPlans';
import { useLocalizedPlanDay } from './useLocalizedPlan';
import { getPlanPrefs, growthTopics } from '../lib/planPrefs';
import { resolveResources, resourceLanguages, resourceLanguageOffers } from '../lib/resources';
import { useResourceLanguages } from './useResourceLanguages';
import { loadPlanPersonalization } from '../lib/planPersonalizationStorage';
import { isCouplePlan, personalizePlanDay, sanitizePlanPersonalization } from '../lib/planPersonalization';
import { canUsePlan } from '../lib/planReview';

// Everything a screen needs to render one day of a running guided plan:
// the day (with the reader's language folded in), the role reflection they asked
// for, the approved resources — if any — for today's topics, and the languages
// not yet chosen that would add to that shelf (`resourceOffers`).
//
// Safe to call unconditionally with a null planId, so a screen that only
// sometimes sits on a plan day can still obey the rules of hooks.
//
// Preferences are read on the device (never synced, never sent anywhere) and
// only ever ADD to a day: they choose which optional reflection is shown and
// which approved resources rank first. They never change the day itself.
//
// `fallbackLanguages` is the legacy API name for additional resource languages.
// It is injectable for tests; in the app it comes from the reader's own
// "Resource languages" preference and may contribute rows alongside app-language
// resources.
export function usePlanDay(planId, dayNumber, lang, {
  fallbackLanguages, prayerId = null, ownerId = null, planVersion = null,
} = {}) {
  const sourceDay = useLocalizedPlanDay(planId, dayNumber, lang, planVersion);
  const resolvedPlan = planId ? getPlan(planId, planVersion) : null;
  const plan = canUsePlan(resolvedPlan) ? resolvedPlan : null;
  // Bumped by reloadPrefs() so a screen that just let the reader answer the
  // husband/wife question, change a partner's name or add a child re-reads the
  // answers without a remount. Both stores are keyed off it: a single reader's
  // live on the device, a couple's in the run's private record.
  const [prefsEpoch, setPrefsEpoch] = useState(0);
  const reloadPrefs = useCallback(() => setPrefsEpoch((n) => n + 1), []);
  const singlesPrefs = useMemo(
    () => (planId && !isCouplePlan(plan) ? getPlanPrefs(planId) : null),
    // prefsEpoch looks unused to the linter because the answers come from
    // localStorage, which it cannot see: it is exactly what makes this re-read
    // after the reader has just answered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [planId, plan, prefsEpoch],
  );
  const [privatePrefs, setPrivatePrefs] = useState(() => sanitizePlanPersonalization());
  useEffect(() => {
    let alive = true;
    setPrivatePrefs(sanitizePlanPersonalization());
    if (!isCouplePlan(plan) || !prayerId || !ownerId) return undefined;
    loadPlanPersonalization(ownerId, prayerId).then((prefs) => {
      if (alive && prefs) setPrivatePrefs(prefs);
    });
    return () => { alive = false; };
  }, [plan, prayerId, ownerId, prefsEpoch]);
  const day = useMemo(
    () => (isCouplePlan(plan) ? personalizePlanDay(plan, sourceDay, privatePrefs, lang) : sourceDay),
    [plan, sourceDay, privatePrefs, lang],
  );
  const prefs = isCouplePlan(plan) ? privatePrefs : singlesPrefs;
  // Live, so a language added from the shelf itself refills the shelf at once.
  const { languages: chosenLanguages } = useResourceLanguages();
  const additionalLanguageKey = (fallbackLanguages || chosenLanguages).join(',');

  const { resources, resourceOffers } = useMemo(() => {
    if (!day?.resourceTopics?.length) return { resources: [], resourceOffers: [] };
    const query = {
      topics: day.resourceTopics,
      lifeStage: plan?.lifeStage || null,
      // The families of resources this plan draws from. Topic tags are shared
      // across every plan, so without this a day about renouncing occult
      // covenants matched dating books on 'discernment'. A plan that declares
      // no domains is unscoped, exactly as before.
      domains: plan?.resourceDomains || [],
      languages: resourceLanguages(lang, additionalLanguageKey ? additionalLanguageKey.split(',') : []),
      boostTopics: growthTopics(prefs),
      // A plan may ask for its shelf to be ORDERED by theological perspective
      // (the deliverance plan puts African Pentecostal material first). Ordering
      // only: it never adds or removes an approved resource.
      perspectiveOrder: plan?.resourcePerspectives || [],
    };
    return { resources: resolveResources(query), resourceOffers: resourceLanguageOffers(query) };
  }, [day, plan, lang, additionalLanguageKey, prefs]);

  // `plan` is handed back too: a screen that needs the run's own length or name
  // would otherwise look it up a second time and could disagree with the day it
  // is rendering.
  return { day, plan, prefs, role: prefs?.role || 'general', resources, resourceOffers, reloadPrefs };
}
