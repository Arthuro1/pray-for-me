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
// Sub-arrays (sections / steps) are matched to the authored item BY POSITION — keep
// them in the same order and count as the source file.

// import.meta.glob gives Vite a static view of each directory so every language
// becomes its own on-demand chunk. The literal glob strings are required — Vite
// resolves them at build time.
const articleLoaders = import.meta.glob('./translations/theology/*.json');
const guideLoaders = import.meta.glob('./translations/guides/*.json');

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
