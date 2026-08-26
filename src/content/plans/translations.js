// Lazy, per-language translations for guided-plan PROSE.
//
// The plans' day themes are authored inline in all 16 languages (see
// prayerPlans.js and preparingInPrayerDays.js). The longer prose a rich plan
// carries — intro, the biblical story, per-day reflections, prayer prompts,
// self-prompts, practices, optional role reflections and the completion copy —
// is authored in English + French in the source and folded in for every other
// language from a JSON overlay loaded ON DEMAND. Same shape and strategy as the
// Grow-tab teaching overlays (src/content/teaching/translations.js), so doctrine
// stays in authored, reviewable files rather than the AI translation pipeline.
//
// Overlay shape, keyed by PLAN id:
//   {
//     "<planId>": {
//       "intro": "...",
//       "biblical": "...",          // the story text only; `ref` stays in source
//       "completion": "...",
//       "days": [                    // matched to the authored days BY POSITION
//         {
//           "reflection": "...",
//           "prompts": ["...", "...", "..."],   // also positional
//           "selfPrompt": "...",
//           "practice": "...",
//           "roles": { "husband": "...", "wife": "..." }
//         }
//       ]
//     }
//   }
//
// Every field is optional: anything missing simply keeps its en/fr fallback
// through pick(), so a partially translated plan is never blank or half-broken.
// Scripture references, day themes, ids, movements and resource topics all stay
// in the source and are NEVER translated here, so the journey is structurally
// identical in every language.

// import.meta.glob gives Vite a static view of the directory so each language
// becomes its own on-demand chunk. The literal glob string is required.
const planLoaders = import.meta.glob('./translations/*.json');

const cache = new Map();

// Resolve one language's plan overlay, or null when it has none (en/fr need
// none, and a language may simply not be translated yet).
export async function loadPlanTranslations(lang) {
  if (cache.has(lang)) return cache.get(lang);
  const loader = planLoaders[`./translations/${lang}.json`];
  let data = null;
  if (loader) {
    try {
      data = (await loader()).default;
    } catch {
      data = null;
    }
  }
  cache.set(lang, data);
  return data;
}

// Add a language to a localized field ({ en, fr, ... }) without dropping the
// authored fallbacks. An empty/missing value leaves the field untouched.
function withLang(field, value, lang) {
  return value ? { ...(field || {}), [lang]: value } : field;
}

// Fold one language's overlay into an authored plan so pick(field, lang)
// resolves to the translation. Returns a NEW plan; the source is never mutated.
export function mergePlan(plan, overlay, lang) {
  const tr = overlay?.[plan.id];
  if (!tr) return plan;
  return {
    ...plan,
    intro: withLang(plan.intro, tr.intro, lang),
    biblical: plan.biblical
      ? { ...plan.biblical, text: withLang(plan.biblical.text, tr.biblical, lang) }
      : plan.biblical,
    completion: withLang(plan.completion, tr.completion, lang),
    days: (plan.days || []).map((day, i) => {
      const dt = tr.days?.[i];
      if (!dt) return day;
      return {
        ...day,
        reflection: withLang(day.reflection, dt.reflection, lang),
        selfPrompt: withLang(day.selfPrompt, dt.selfPrompt, lang),
        practice: withLang(day.practice, dt.practice, lang),
        prompts: (day.prompts || []).map((p, j) => withLang(p, dt.prompts?.[j], lang)),
        roles: day.roles
          ? Object.fromEntries(
            Object.entries(day.roles).map(([role, value]) => [role, withLang(value, dt.roles?.[role], lang)]),
          )
          : day.roles,
      };
    }),
  };
}
