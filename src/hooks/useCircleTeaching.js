import { useEffect, useMemo, useState } from 'react';
import { hasCircleOverlay, loadCircleOverlay, localizeCircle, localizeCircleUi } from '../content/intercessionCircles';

// The circle teaching in one language, ready to render. English and French are
// authored in source and ready at once; any other language waits for its
// overlay, so a page never flashes English words inside a translated page.
// Returns null until the language is ready.
export function useCircleTeaching(lang) {
  const needsOverlay = hasCircleOverlay(lang);
  const [loaded, setLoaded] = useState({ lang: null, overlay: null });

  useEffect(() => {
    if (!needsOverlay || loaded.lang === lang) return undefined;
    let current = true;
    loadCircleOverlay(lang).then((overlay) => {
      if (current) setLoaded({ lang, overlay });
    });
    return () => { current = false; };
  }, [lang, needsOverlay, loaded.lang]);

  const ready = !needsOverlay || loaded.lang === lang;
  const overlay = needsOverlay && ready ? loaded.overlay : null;

  return useMemo(() => (ready
    ? { lang, ui: localizeCircleUi(lang, overlay), circle: (id) => localizeCircle(id, lang, overlay) }
    : null), [ready, lang, overlay]);
}
