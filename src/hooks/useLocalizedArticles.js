import { articles as baseArticles } from '../content/teaching';
import { loadArticleTranslations, mergeArticles } from '../content/teaching/translations';
import { useLocalizedTeaching } from './useLocalizedTeaching';

// Returns the Grow-tab theology articles with the active language folded in,
// lazy-loading that language's overlay on demand. See useLocalizedTeaching.
export function useLocalizedArticles(lang) {
  return useLocalizedTeaching(baseArticles, loadArticleTranslations, mergeArticles, lang);
}
