// Lazy, per-plan/per-language translations for guided-plan PROSE.
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
// Each JSON file remains keyed by PLAN id, even though new files are also
// directory-scoped (`translations/<plan-id>/<lang>.json`). This preserves the
// legacy overlay contract while keeping bundles small:
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
const planLoaders = import.meta.glob(['./translations/*.json', './translations/*/*.json']);

const cache = new Map();

// Which languages a plan is actually ready to be READ in.
//
// `proseTranslations` is an explicit statement about quality, not a count of
// files on disk. A plan may declare `true` (every supported language is ready)
// or a list of language codes — which is how a plan whose remaining overlays
// are still structural stubs keeps those stubs out of readers' hands while the
// files stay in the repo for a translator to finish. Anything not listed falls
// back through pick() to the authored English and French, which is always
// better than serving a frame repeated on every day.
export function overlayLanguages(plan) {
  const declared = plan?.proseTranslations;
  if (Array.isArray(declared)) return [...declared];
  if (!declared) return [];
  return Object.keys(planLoaders)
    .map((path) => path.match(/\/([a-z]{2})\.json$/)?.[1])
    .filter((lang, i, all) => lang && all.indexOf(lang) === i);
}

export function hasOverlay(plan, lang) {
  return overlayLanguages(plan).includes(lang);
}

// Resolve one language's plan overlay, or null when it has none (en/fr need
// none, and a language may simply not be translated yet).
export async function loadPlanTranslations(lang, planId = null) {
  const cacheKey = `${lang}:${planId || '*'}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const loaders = [
    planLoaders[`./translations/${lang}.json`],
    planId ? planLoaders[`./translations/${planId}/${lang}.json`] : null,
  ].filter(Boolean);
  let data = null;
  for (const loader of loaders) {
    try { data = { ...(data || {}), ...(await loader()).default }; } catch { /* keep any usable overlay */ }
  }
  cache.set(cacheKey, data);
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
      const mergeDay = (source, translated) => {
        if (!source || !translated) return source;
        const next = {
          ...source,
          reflection: withLang(source.reflection, translated.reflection, lang),
          selfPrompt: withLang(source.selfPrompt, translated.selfPrompt, lang),
          spousePrompt: withLang(source.spousePrompt, translated.spousePrompt, lang),
          marriagePrompt: withLang(source.marriagePrompt, translated.marriagePrompt, lang),
          childPrompt: withLang(source.childPrompt, translated.childPrompt, lang),
          practice: withLang(source.practice, translated.practice, lang),
          conversationPrompt: withLang(source.conversationPrompt, translated.conversationPrompt, lang),
          prayTogether: withLang(source.prayTogether, translated.prayTogether, lang),
          safetyNote: withLang(source.safetyNote, translated.safetyNote, lang),
          prompts: (source.prompts || []).map((p, j) => withLang(p, translated.prompts?.[j], lang)),
          roles: source.roles
            ? Object.fromEntries(
              Object.entries(source.roles).map(([role, value]) => [role, withLang(value, translated.roles?.[role], lang)]),
            )
            : source.roles,
        };
        if (source.withChildren) next.withChildren = mergeDay(source.withChildren, translated.withChildren);
        if (source.study && translated.study) {
          next.study = { ...source.study };
          for (const key of ['context', 'tension', 'synthesis', 'prayer']) {
            next.study[key] = withLang(source.study[key], translated.study[key], lang);
          }
          next.study.questions = (source.study.questions || []).map((q, j) => withLang(q, translated.study.questions?.[j], lang));
        }
        return next;
      };
      return mergeDay(day, dt);
    }),
  };
}
