// Resolving which curated external resources (if any) to offer under a plan
// day's "Go deeper".
//
// Three rules shape everything here:
//
//   1. NOTHING UNREVIEWED IS EVER SHOWN. An entry must be `approved`, and the
//      edition in the reader's language must carry a `lastVerifiedAt` date and
//      not be marked unavailable. Draft, needs_review and retired entries are
//      invisible, as is an edition nobody has checked.
//   2. LOCALES ARE NOT TRANSLATIONS OF EACH OTHER. A German reader gets whatever
//      trustworthy German resource covers the topic — very possibly a different
//      book by a different author from the English list. Nothing is ever
//      machine-translated into an edition that does not exist.
//   3. NO MATCH MEANS NO SECTION. Callers render nothing at all rather than an
//      apology, because the prayer plan is complete without external material.
import { RESOURCES } from '../content/resources/catalogue';

export const DEFAULT_RESOURCE_LIMIT = 3;

// The languages a reader should be offered resources in: their app language
// first, then any language they have EXPLICITLY enabled as a fallback (see the
// "Resource languages" preference). A non-English reader is never quietly filled
// with English — English only appears here if they asked for it.
export function resourceLanguages(lang, enabledFallbacks = []) {
  const out = [];
  for (const code of [lang, ...(enabledFallbacks || [])]) {
    if (code && !out.includes(code)) out.push(code);
  }
  return out;
}

function isRenderableEdition(edition) {
  return !!edition && edition.available !== false && !!edition.lastVerifiedAt && !!edition.title;
}

// How well an entry matches what today is about. Day topics are what make a
// resource RELEVANT; the reader's growth areas only break ties, so choosing a
// growth area can never pull an off-topic resource into the list.
function topicScore(resource, dayTopics, boostTopics) {
  const topics = new Set(resource.topics || []);
  let score = 0;
  for (const t of dayTopics) if (topics.has(t)) score += 2;
  if (score === 0) return 0;
  for (const t of boostTopics) if (topics.has(t)) score += 1;
  return score;
}

// § fallback — the three-step hierarchy, lower is better:
//   0  approved resource ORIGINALLY in the reader's language
//   1  a verified edition (translation) in the reader's language
//   2+ an explicitly enabled fallback language, in the order the reader gave
function languageRank(resource, lang, index) {
  if (index === 0) return resource.originalLanguage === lang ? 0 : 1;
  return index + 1;
}

// The resources to show for one plan day, already capped and ordered.
//
//   topics             the day's `resourceTopics`
//   lifeStage          e.g. 'single' — an entry that names lifeStages must include it
//   languages          from resourceLanguages(): [appLang, ...enabled fallbacks]
//   boostTopics        from the reader's growth areas (ranking only)
//   limit              hard cap; one good resource is usually enough
//   catalogue          injectable, so tests never depend on shipped content
//
// Returns [] whenever nothing qualifies — which is the normal case until a
// curator has approved entries for that topic and language.
export function resolveResources({
  topics = [],
  lifeStage = null,
  languages = ['en'],
  boostTopics = [],
  limit = DEFAULT_RESOURCE_LIMIT,
  catalogue = RESOURCES,
} = {}) {
  if (!topics.length || !languages.length) return [];
  const dayTopics = topics;
  const matches = [];

  for (const resource of catalogue) {
    if (resource.status !== 'approved') continue;
    if (lifeStage && resource.lifeStages?.length && !resource.lifeStages.includes(lifeStage)) continue;
    const score = topicScore(resource, dayTopics, boostTopics);
    if (score === 0) continue;

    // First language the reader can actually read this in — the ordering of
    // `languages` already encodes their preference.
    const index = languages.findIndex((code) => isRenderableEdition(resource.editions?.[code]));
    if (index === -1) continue;
    const lang = languages[index];

    matches.push({
      id: resource.id,
      type: resource.type,
      topics: resource.topics || [],
      description: resource.description || null,
      lang,
      // Anything not in the reader's own app language is labelled as such in the
      // UI, so the language of a recommendation is never a surprise.
      isFallback: index > 0,
      edition: resource.editions[lang],
      rank: languageRank(resource, lang, index),
      score,
    });
  }

  matches.sort((a, b) => a.rank - b.rank || b.score - a.score || a.id.localeCompare(b.id));
  return matches.slice(0, Math.max(0, limit));
}

// A retired entry can name its successor; follow that so a link that has died
// is replaced rather than silently dropped. Returns null when the replacement is
// missing or is not itself approved.
export function replacementFor(resource, catalogue = RESOURCES) {
  if (!resource?.replacementResourceId) return null;
  const next = catalogue.find((r) => r.id === resource.replacementResourceId);
  return next?.status === 'approved' ? next : null;
}
