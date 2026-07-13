import { useEffect, useState } from 'react';
import { gospelJourney } from '../content/teaching';
import { loadJourneyTranslations, mergeJourney } from '../content/teaching/translations';

// Returns the gospel journey with the active language folded in, lazy-loading
// that language's overlay on demand. en/fr are authored in the source and need
// no overlay; every other language loads its overlay and the component re-renders
// once it arrives. Mirrors useLocalizedTeaching, but for the single journey object
// rather than an array of items.
export function useLocalizedJourney(lang) {
  const [journey, setJourney] = useState(gospelJourney);

  useEffect(() => {
    if (lang === 'en' || lang === 'fr') {
      setJourney(gospelJourney);
      return undefined;
    }
    let alive = true;
    loadJourneyTranslations(lang).then((overlay) => {
      if (alive) setJourney(mergeJourney(gospelJourney, overlay, lang));
    });
    return () => { alive = false; };
  }, [lang]);

  return journey;
}
