// What each Intercession Circle MEANS: the canonical teaching every surface
// renders — the landing page now, Grow, onboarding and the prayer composer
// later — so no screen ever owns or copies theological prose. Components render
// this content; they never author it. See docs/INTERCESSION_CIRCLES.md.
//
// Two layers per circle:
//   • SHORT (this folder's <circle>.js): formation statement, heading, one or two
//     sentences, the themes Scripture teaches us to pray for, the Scripture
//     anchors and a call to pray. Authored in English + French here; the other
//     14 languages are JSON overlays (translations/<lang>.json, loaded on demand)
//     and the short layer must be complete in all 16 — a public page never mixes
//     languages (guarded by intercessionCircles.test.js).
//   • DEEP (deep/<circle>.js, loaded on demand): meaning, prayer prompts per
//     theme, reflection. English + French only, falling back to English like
//     plan prose and Grow teaching, and hidden behind a human review gate until
//     a named reviewer signs it (lib/circleReview.js, ./review.js).
//
// Scripture is stored as REFERENCES only ("Galatians 5:22-25", English book
// names, one chapter per reference). The words are always resolved at render
// time by the app's Scripture pipeline — never authored, translated or
// generated here.
//
// Prose register: French uses "vous" for explanation (its first home is the
// public landing page) and "tu" only where a prompt speaks to God.
import self from './self';
import household from './household';
import people from './people';
import church from './church';
import authorities from './authorities';
import nations from './nations';
import kingdom from './kingdom';
import { CIRCLES } from '../../lib/circles';
import { pick } from '../teaching/pick';

// Inner to outer, in CIRCLES order (asserted by the contract test).
export const CIRCLE_CONTENT = Object.freeze([self, household, people, church, authorities, nations, kingdom]);

const BY_ID = new Map(CIRCLE_CONTENT.map((content) => [content.id, content]));

export const circleContent = (circle) => BY_ID.get(circle) ?? null;

// How many anchors the short panel shows before the full list (the deep layer's
// "Scripture" section). Each circle lists its most central passages first.
export const KEY_REF_COUNT = 3;

// Words the teaching panel itself needs, in the same two layers. The first three
// appear on every short panel and are required in all 16 languages; the rest
// belong to the deep layer and fall back to English while it is a draft.
export const CIRCLE_UI = Object.freeze({
  choose: { en: 'Choose a circle to see how to pray for it.', fr: 'Choisissez un cercle pour voir comment prier.' },
  prayFor: { en: 'Pray for', fr: 'Prier pour' },
  scripture: { en: 'In Scripture', fr: 'Dans l’Écriture' },
  explore: { en: 'Explore this circle', fr: 'Explorer ce cercle' },
  exploreLess: { en: 'Show less', fr: 'Réduire' },
  meaning: { en: 'What this means', fr: 'Ce que cela veut dire' },
  reflect: { en: 'Reflect', fr: 'Pour réfléchir' },
  prayThis: { en: 'Pray this', fr: 'Prier ainsi' },
  draft: { en: 'Draft · review pending', fr: 'Brouillon · relecture en attente' },
});

export const SHORT_UI_KEYS = Object.freeze(['choose', 'prayFor', 'scripture']);

// The deep layer of a circle, fetched only when someone opens it. A circle
// without an entry here has no deep layer yet.
const DEEP_LOADERS = Object.freeze({
  self: () => import('./deep/self'),
});

// Own keys only, so an id like 'toString' never looks like a circle with content.
const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export const hasDeepLayer = (circle) => owns(DEEP_LOADERS, circle);

export async function loadCircleDeep(circle) {
  const loader = DEEP_LOADERS[circle];
  if (!loader) return null;
  return (await loader()).default;
}

// Per-language overlays for everything above, keyed by circle id (plus `ui`),
// mirroring the source shape; arrays match the source BY POSITION, the same
// convention as the Grow teaching overlays. en/fr need none.
const overlayLoaders = import.meta.glob('./translations/*.json');
const overlayCache = new Map();

export async function loadCircleOverlay(lang) {
  if (overlayCache.has(lang)) return overlayCache.get(lang);
  const loader = overlayLoaders[`./translations/${lang}.json`];
  let data = null;
  if (loader) {
    try { data = (await loader()).default; } catch { data = null; }
  }
  overlayCache.set(lang, data);
  return data;
}

export const hasCircleOverlay = (lang) => owns(overlayLoaders, `./translations/${lang}.json`);

// A field authored as { en, fr, … }.
const isLocalized = (value) => !!value && typeof value === 'object' && !Array.isArray(value)
  && (typeof value.en === 'string' || typeof value.fr === 'string');

// Fold one language's overlay into authored content so pick(field, lang)
// resolves to it. Walks the source shape: localized leaves gain the language,
// arrays match by position, ids and references are never touched. Returns a
// new value; the source is never mutated. A missing overlay value keeps the
// authored fallback.
export function withOverlay(source, overlay, lang) {
  if (overlay == null || !lang) return source;
  if (isLocalized(source)) return typeof overlay === 'string' && overlay.trim() ? { ...source, [lang]: overlay } : source;
  if (Array.isArray(source)) return source.map((item, i) => withOverlay(item, Array.isArray(overlay) ? overlay[i] : undefined, lang));
  if (source && typeof source === 'object' && typeof overlay === 'object') {
    return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, withOverlay(value, overlay[key], lang)]));
  }
  return source;
}

// Authored themes are the ONLY thing a circle is ever suggested from — never a
// user's own label (docs/INTERCESSION_CIRCLES.md, "Themes and categories"). A
// theme id can belong to several circles (reconciliation is prayed for in My
// people and among the Nations); the circles come back inner to outer.
export function circlesForTheme(themeId) {
  if (!themeId) return [];
  return CIRCLES.filter((circle) => circleContent(circle)?.themes.some((theme) => theme.id === themeId));
}

// ── Ready-to-render text ────────────────────────────────────────────────
// What components receive: plain strings in one language (the overlay folded
// in, English as the last fallback), with ids and references untouched.

export function localizeCircle(circle, lang, overlay) {
  const content = circleContent(circle);
  if (!content) return null;
  const merged = withOverlay(content, overlay?.[circle], lang);
  return {
    id: circle,
    formation: pick(merged.formation, lang),
    heading: pick(merged.heading, lang),
    summary: pick(merged.summary, lang),
    cta: pick(merged.cta, lang),
    themes: merged.themes.map((theme) => ({ id: theme.id, title: pick(theme.title, lang) })),
    refs: content.refs,
  };
}

export function localizeCircleUi(lang, overlay) {
  const merged = withOverlay(CIRCLE_UI, overlay?.ui, lang);
  return Object.fromEntries(Object.entries(merged).map(([key, field]) => [key, pick(field, lang)]));
}

// The deep layer is authored in English and French only; every other language
// reads the English (the review gate decides whether it is shown at all).
export function localizeCircleDeep(deep, lang) {
  if (!deep) return null;
  const prompts = (list) => (list || []).map((prompt) => pick(prompt, lang));
  return {
    id: deep.id,
    meaning: pick(deep.meaning, lang),
    framework: deep.framework
      ? { title: pick(deep.framework.title, lang), note: pick(deep.framework.note, lang) }
      : null,
    themes: deep.themes.map((theme) => ({
      id: theme.id,
      body: pick(theme.body, lang),
      refs: theme.refs,
      prompts: prompts(theme.prompts),
      facets: (theme.facets || []).map((facet) => ({
        id: facet.id,
        title: pick(facet.title, lang),
        body: pick(facet.body, lang),
        ref: facet.ref,
        prompts: prompts(facet.prompts),
      })),
    })),
    reflection: deep.reflection.map((question) => pick(question, lang)),
  };
}
