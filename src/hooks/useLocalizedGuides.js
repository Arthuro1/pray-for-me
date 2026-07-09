import { guides as baseGuides } from '../content/teaching';
import { loadGuideTranslations, mergeGuides } from '../content/teaching/translations';
import { useLocalizedTeaching } from './useLocalizedTeaching';

// Returns the Grow-tab prayer guides with the active language folded in,
// lazy-loading that language's overlay on demand. See useLocalizedTeaching.
export function useLocalizedGuides(lang) {
  return useLocalizedTeaching(baseGuides, loadGuideTranslations, mergeGuides, lang);
}
