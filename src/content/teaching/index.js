// Public entry point for the teaching content layer. Pages import from here so
// the underlying data files (prayer guides, theology) can grow without touching
// callers. Lookups are id-based so routes/state can reference a stable id.
import guides from './prayerGuides';
import articles from './theology';

export { pick, localizeRef } from './pick';
export { guides, articles };

export function getGuide(id) {
  return guides.find((g) => g.id === id) || null;
}

export function getArticle(id) {
  return articles.find((a) => a.id === id) || null;
}
