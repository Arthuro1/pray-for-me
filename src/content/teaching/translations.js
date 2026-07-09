// Lazy, per-language translations for the Grow-tab theology articles.
//
// The English + French source is authored in theology.js. Every other supported
// language is authored as a JSON overlay under translations/theology/<lang>.json
// and loaded ON DEMAND — the same shape and strategy as the offline verse bundle
// (see src/lib/verseBundle.js). Only the reader's active language is fetched, so
// the main bundle stays lean and doctrine still lives in authored files (not the
// AI translation pipeline). Any missing language, article, or field falls back to
// en/fr through pick(), so the teaching is never shown blank or half-translated.
//
// Overlay shape, keyed by article id:
//   { "<id>": { title, summary, sections: [{ heading, body }, ...] } }
// Section overlays are matched to the authored article BY POSITION — keep them in
// the same order and count as theology.js (the order ArticleReader renders them).

// import.meta.glob gives Vite a static view of the directory so each language
// becomes its own on-demand chunk.
const loaders = import.meta.glob('./translations/theology/*.json');
const cache = new Map();

// Load a language's overlay, memoized. Resolves to null when the language has no
// overlay (e.g. en/fr, which need none) so callers fall back to the source.
export async function loadArticleTranslations(lang) {
  if (cache.has(lang)) return cache.get(lang);
  const loader = loaders[`./translations/theology/${lang}.json`];
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
  return value ? { ...field, [lang]: value } : field;
}

// Fold a language overlay into the authored articles so pick(field, lang) resolves
// to the translation. Returns a new array; the source articles are never mutated.
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
