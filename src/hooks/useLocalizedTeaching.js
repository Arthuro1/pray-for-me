import { useEffect, useState } from 'react';

// Shared engine for lazily folding a language overlay into authored teaching
// content (theology articles or prayer guides). en/fr are authored in the source
// and need no overlay; every other language loads its overlay on demand and the
// component re-renders once it arrives. Mirrors how i18n locales load on demand.
//
// `base` is the authored source array, `load(lang)` resolves its overlay (or null),
// and `merge(base, overlay, lang)` folds it in. All three are module-level and
// stable, so the effect only re-runs when the language changes.
export function useLocalizedTeaching(base, load, merge, lang) {
  const [items, setItems] = useState(base);

  useEffect(() => {
    // en/fr are authored in the source — no overlay to fetch.
    if (lang === 'en' || lang === 'fr') {
      setItems(base);
      return undefined;
    }
    let alive = true;
    load(lang).then((overlay) => {
      if (alive) setItems(merge(base, overlay, lang));
    });
    return () => { alive = false; };
  }, [base, load, merge, lang]);

  return items;
}
