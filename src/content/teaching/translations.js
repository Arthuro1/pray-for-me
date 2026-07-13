// Lazy, per-language translations for the Grow-tab teaching content — both the
// theology articles (the "Learn" section) and the prayer guides (the "Pray"
// section).
//
// The English + French source is authored in theology.js / prayerGuides.js. Every
// other supported language is authored as a JSON overlay under
// translations/<theology|guides>/<lang>.json and loaded ON DEMAND — the same shape
// and strategy as the offline verse bundle (see src/lib/verseBundle.js). Only the
// reader's active language is fetched, so the main bundle stays lean and doctrine
// still lives in authored files (not the AI translation pipeline). Any missing
// language, item, or field falls back to en/fr through pick(), so the teaching is
// never shown blank or half-translated.
//
// Overlay shapes, keyed by item id:
//   theology: { "<id>": { title, summary, sections: [{ heading, body }, ...] } }
//   guides:   { "<id>": { title, summary, intro, steps: [{ title, prompt }, ...] } }
//   gospel:   { "<journey-id>": { title, summary, respondHeading, respondBody,
//                guidedPrayer, formulaDisclaimer, starterPrompt,
//                sections: [{ heading, body }, ...], questions: [{ heading }, ...] } }
// Sub-arrays (sections / steps / questions) are matched to the authored item BY
// POSITION — keep them in the same order and count as the source file. Stable ids
// (section/question ids, refs, articleIds) stay in the source and are NEVER
// translated, so navigation and Scripture never drift across languages.

// import.meta.glob gives Vite a static view of each directory so every language
// becomes its own on-demand chunk. The literal glob strings are required — Vite
// resolves them at build time.
const articleLoaders = import.meta.glob('./translations/theology/*.json');
const guideLoaders = import.meta.glob('./translations/guides/*.json');
const journeyLoaders = import.meta.glob('./translations/gospel/*.json');

// Build a memoized on-demand loader for one overlay directory. Resolves to null
// when a language has no overlay (e.g. en/fr, which need none) so callers fall
// back to the source.
function makeTranslationLoader(loaders, dir) {
  const cache = new Map();
  return async function load(lang) {
    if (cache.has(lang)) return cache.get(lang);
    const loader = loaders[`./translations/${dir}/${lang}.json`];
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
  };
}

export const loadArticleTranslations = makeTranslationLoader(articleLoaders, 'theology');
export const loadGuideTranslations = makeTranslationLoader(guideLoaders, 'guides');
export const loadJourneyTranslations = makeTranslationLoader(journeyLoaders, 'gospel');

// Add a language to a localized field ({ en, fr, ... }) without dropping the
// authored fallbacks. An empty/missing value leaves the field untouched.
function withLang(field, value, lang) {
  return value ? { ...field, [lang]: value } : field;
}

// Fold a language overlay into the authored theology articles so pick(field, lang)
// resolves to the translation. Returns a new array; the source is never mutated.
export function mergeArticles(articles, overlay, lang) {
  if (!overlay) return articles;
  return articles.map((a) => {
    const tr = overlay[a.id];
    if (!tr) return a;
    return {
      ...a,
      title: withLang(a.title, tr.title, lang),
      summary: withLang(a.summary, tr.summary, lang),
      sections: (a.sections || []).map((s, i) => {
        const st = tr.sections?.[i];
        if (!st) return s;
        return {
          ...s,
          heading: withLang(s.heading, st.heading, lang),
          body: withLang(s.body, st.body, lang),
        };
      }),
    };
  });
}

// Fold a language overlay into the authored gospel journey so pick(field, lang)
// resolves to the translation. Returns a NEW object; the source is never mutated.
// The overlay is keyed by the journey id (mirroring the theology/guide overlays).
// Every id, Scripture reference and articleId stays in the source — only prose is
// translated — so the six-section structure and its links are identical in every
// language. Any missing field simply keeps its en/fr fallback through pick().
export function mergeJourney(journey, overlay, lang) {
  const tr = overlay?.[journey.id];
  if (!tr) return journey;
  return {
    ...journey,
    title: withLang(journey.title, tr.title, lang),
    summary: withLang(journey.summary, tr.summary, lang),
    respondHeading: withLang(journey.respondHeading, tr.respondHeading, lang),
    respondBody: withLang(journey.respondBody, tr.respondBody, lang),
    guidedPrayer: withLang(journey.guidedPrayer, tr.guidedPrayer, lang),
    formulaDisclaimer: withLang(journey.formulaDisclaimer, tr.formulaDisclaimer, lang),
    starterPrompt: withLang(journey.starterPrompt, tr.starterPrompt, lang),
    sections: (journey.sections || []).map((s, i) => {
      const st = tr.sections?.[i];
      if (!st) return s;
      return { ...s, heading: withLang(s.heading, st.heading, lang), body: withLang(s.body, st.body, lang) };
    }),
    questions: (journey.questions || []).map((q, i) => {
      const qt = tr.questions?.[i];
      if (!qt) return q;
      return { ...q, heading: withLang(q.heading, qt.heading, lang) };
    }),
  };
}

// Fold a language overlay into the authored prayer guides so pick(field, lang)
// resolves to the translation. Returns a new array; the source is never mutated.
// Step passages stay in the source (localized separately via localizeRef).
export function mergeGuides(guides, overlay, lang) {
  if (!overlay) return guides;
  return guides.map((g) => {
    const tr = overlay[g.id];
    if (!tr) return g;
    return {
      ...g,
      title: withLang(g.title, tr.title, lang),
      summary: withLang(g.summary, tr.summary, lang),
      intro: withLang(g.intro, tr.intro, lang),
      steps: (g.steps || []).map((s, i) => {
        const st = tr.steps?.[i];
        if (!st) return s;
        return {
          ...s,
          title: withLang(s.title, st.title, lang),
          prompt: withLang(s.prompt, st.prompt, lang),
        };
      }),
    };
  });
}
