import { LANG_CODES } from '../i18n';
import { PLANS } from '../content/prayerPlans';
import { isPlanReviewed } from '../lib/planReview';
import { overlayLanguages } from '../content/plans/translations';
import articles from '../content/teaching/theology';
import guides from '../content/teaching/prayerGuides';
import gospel from '../content/teaching/gospelJourney';
import { CIRCLE_CONTENT, CIRCLE_UI, hasDeepLayer, loadCircleDeep } from '../content/intercessionCircles';
import { CIRCLE_DEEP_REVIEWS } from '../content/intercessionCircles/review';
import { isCircleDeepReviewed } from '../lib/circleReview';
import { flattenStrings, localizedEntries, makeEntries } from './entries';

const ui = import.meta.glob('../i18n/locales/*.js');
const landing = import.meta.glob('../pages/landing/locales/*.js');
const overlays = import.meta.glob(['../content/plans/translations/*.json', '../content/plans/translations/*/*.json', '../content/teaching/translations/*/*.json', '../content/intercessionCircles/translations/*.json']);

async function load(loaders, path) {
  return loaders[path] ? (await loaders[path]()).default : {};
}

// Requested-language chunks only; loaded lazily when the reporting dialog opens.
export async function loadCatalogue(locale) {
  if (!LANG_CODES.includes(locale)) throw new Error('Unsupported locale');
  const [sourceUi, targetUi, sourceLanding, targetLanding, planBase] = await Promise.all([
    load(ui, '../i18n/locales/en.js'), load(ui, `../i18n/locales/${locale}.js`),
    load(landing, '../pages/landing/locales/landing-en.js'), load(landing, `../pages/landing/locales/landing-${locale}.js`),
    load(overlays, `../content/plans/translations/${locale}.json`),
  ]);
  const result = [
    ...makeEntries('ui', locale, flattenStrings(sourceUi), flattenStrings(targetUi)),
    ...makeEntries('landing', locale, flattenStrings(sourceLanding), flattenStrings(targetLanding)),
  ];
  for (const plan of PLANS) {
    // Report what readers see: an overlay the plan has not declared ready is a
    // hidden stub, and the reader gets the authored fallback instead.
    const ready = overlayLanguages(plan).includes(locale);
    const dedicated = ready ? await load(overlays, `../content/plans/translations/${plan.id}/${locale}.json`) : {};
    const overlay = ready ? dedicated[plan.id] ?? planBase[plan.id] : undefined;
    result.push(...localizedEntries(`plans/${plan.id}`, locale, plan, overlay).map((entry) => ({
      ...entry, surfaceLabel: targetUi[plan.titleKey] ?? sourceUi[plan.titleKey], published: isPlanReviewed(plan),
    })));
  }
  for (const [kind, items] of Object.entries({ theology: articles, guides, gospel: Array.isArray(gospel) ? gospel : [gospel] })) {
    const translated = await load(overlays, `../content/teaching/translations/${kind}/${locale}.json`);
    for (const item of items) result.push(...localizedEntries(`${kind}/${item.id}`, locale, item, translated[item.id]).map((entry) => ({
      ...entry, surfaceLabel: translated[item.id]?.title ?? item.title?.[locale] ?? item.title?.en,
    })));
  }
  // Intercession Circles: the short layer and the panel's words in every
  // language; the deep layer (English + French, English elsewhere) counts as
  // published only once its human review is signed.
  const circles = await load(overlays, `../content/intercessionCircles/translations/${locale}.json`);
  result.push(...localizedEntries('circles/ui', locale, CIRCLE_UI, circles.ui));
  for (const content of CIRCLE_CONTENT) {
    result.push(...localizedEntries(`circles/${content.id}`, locale, content, circles[content.id]));
    if (!hasDeepLayer(content.id)) continue;
    const deep = await loadCircleDeep(content.id);
    result.push(...localizedEntries(`circles/${content.id}/deep`, locale, deep).map((entry) => ({
      ...entry, published: isCircleDeepReviewed(CIRCLE_DEEP_REVIEWS[content.id]),
    })));
  }
  return result;
}
