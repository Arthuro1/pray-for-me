import { useEffect, useState } from 'react';
import { articles as baseArticles } from '../content/teaching';
import { loadArticleTranslations, mergeArticles } from '../content/teaching/translations';

// Returns the Grow-tab theology articles with the active language folded in,
// lazy-loading that language's overlay on demand. en/fr (the authored source) and
// any not-yet-loaded language render immediately from the source; the component
// re-renders once the overlay arrives. Mirrors how i18n locales load on demand.
export function useLocalizedArticles(lang) {
  const [articles, setArticles] = useState(baseArticles);

  useEffect(() => {
    // en/fr are authored in the source — no overlay to fetch.
    if (lang === 'en' || lang === 'fr') {
      setArticles(baseArticles);
      return undefined;
    }
    let alive = true;
    loadArticleTranslations(lang).then((overlay) => {
      if (alive) setArticles(mergeArticles(baseArticles, overlay, lang));
    });
    return () => { alive = false; };
  }, [lang]);

  return articles;
}
