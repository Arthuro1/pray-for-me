// Resolving which curated external resources (if any) to offer under a plan
// day's "Go deeper".
//
// Three rules shape everything here:
//
//   1. NOTHING UNREVIEWED IS EVER SHOWN. An entry must be `approved`; sensitive
//      entries also need explicit content and safety sign-offs. The edition in
//      the reader's language must carry a `lastVerifiedAt` date, a usable HTTPS
//      URL and not be marked unavailable. Draft, needs_review and retired entries
//      are invisible, as is an edition nobody has checked.
//   2. LOCALES ARE NOT TRANSLATIONS OF EACH OTHER. A German reader gets whatever
//      trustworthy German resource covers the topic — very possibly a different
//      book by a different author from the English list. Nothing is ever
//      machine-translated into an edition that does not exist.
//   3. ENABLED LANGUAGES ARE HONOURED TOGETHER. The app language ranks first,
//      then any additional languages the reader selected. Each resource appears
//      once, in the first enabled language that has a verified edition.
//   4. A TOPIC ONLY MATCHES INSIDE ITS OWN DOMAIN. Topic tags are shared by
//      every plan, so 'discernment', 'healing' or 'identity' can mean one thing
//      to a dating book and something else entirely on a day about renouncing
//      occult covenants. A plan that declares `resourceDomains` therefore sees
//      only entries belonging to those domains, and an entry that declares no
//      domain belongs to none of them.
import { RESOURCES } from '../content/resources/catalogue';

// The resolver returns the complete relevant mixed-language set by default, so
// selected-language resources are not silently discarded before they reach the
// shelf. Callers can still pass a finite limit when they genuinely need a
// bounded subset.
export const DEFAULT_RESOURCE_LIMIT = Number.POSITIVE_INFINITY;

// Topics whose recommendations can touch safety, trauma, sexual coercion,
// disputed marriage roles, or other situations where ordinary editorial review
// is not enough. A catalogue author cannot bypass this list by labelling the
// entry `standard`: the topic itself raises the review level.
export const SENSITIVE_RESOURCE_TOPICS = new Set([
  'sexuality', 'sexual-intimacy', 'purity', 'infertility', 'miscarriage', 'marriage-crisis',
  'abuse-safety', 'trauma', 'divorce', 'pornography', 'addiction',
  'infidelity', 'illness', 'marriage-roles',
  // Every deliverance topic is sensitive without exception. Material on demons,
  // curses, generational curses, covenants, ancestral practices, witchcraft,
  // occult activity, deliverance, exorcism, spiritual warfare, evil altars or
  // prophetic spiritual diagnosis can teach fear, unsupported certainty,
  // dangerous medical claims, defamatory accusation or coercive ministry — so
  // it needs two named human sign-offs before it can ever be shown, and a
  // catalogue author cannot opt out by labelling the entry `standard`.
  'deliverance', 'spiritual-warfare', 'renunciation', 'covenants', 'curses',
  'altars', 'occult', 'idolatry', 'secret-societies', 'dedications',
  'family-line', 'generational-patterns', 'strongholds',
]);

function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function hasExplicitSignoff(review) {
  if (review?.status !== 'approved') return false;
  if (typeof review.reviewedBy !== 'string' || !review.reviewedBy.trim()) return false;
  return isIsoDate(review.reviewedAt);
}

export function isSensitiveResource(resource) {
  return resource?.reviewLevel === 'sensitive'
    || (resource?.topics || []).some((topic) => SENSITIVE_RESOURCE_TOPICS.has(topic));
}

// Publication status and sensitive sign-offs are separate gates. In
// particular, setting `status: 'approved'` never publishes a sensitive entry on
// its own. Unknown review levels fail closed rather than silently becoming
// standard.
export function isResourceApprovedForDisplay(resource) {
  if (resource?.status !== 'approved') return false;
  if (resource.reviewLevel != null && !['standard', 'sensitive'].includes(resource.reviewLevel)) return false;
  if (!isSensitiveResource(resource)) return true;
  return hasExplicitSignoff(resource.contentReview) && hasExplicitSignoff(resource.safetyReview);
}

// The languages a reader should be offered resources in: their app language
// first, then the additional languages selected in "Resource languages".
// English is preselected for a new reader, but it is removable. The order is
// also the edition preference for a resource available in several languages.
export function resourceLanguages(lang, enabledFallbacks = []) {
  const out = [];
  for (const code of [lang, ...(enabledFallbacks || [])]) {
    if (code && !out.includes(code)) out.push(code);
  }
  return out;
}

function isRenderableEdition(edition) {
  if (!edition || edition.available === false || !edition.title) return false;
  if (!isIsoDate(edition.lastVerifiedAt)) return false;
  try {
    return new URL(edition.url).protocol === 'https:';
  } catch {
    return false;
  }
}

// Languages for which the bundled catalogue has at least one edition that can
// actually reach a reader. This uses the same publication and edition gates as
// resolveResources(), so Settings never offers a language backed only by draft,
// unreviewed, unavailable, malformed or unverified material.
export function availableResourceLanguages(catalogue = RESOURCES) {
  const languages = new Set();
  for (const resource of catalogue) {
    if (!isResourceApprovedForDisplay(resource)) continue;
    for (const [lang, edition] of Object.entries(resource.editions || {})) {
      if (lang && isRenderableEdition(edition)) languages.add(lang);
    }
  }
  return [...languages].sort();
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

// § domain — the coarse scope a topic match is allowed to happen inside (see
// RESOURCE_DOMAINS in ../content/resources/topics). Unlike perspective, this
// FILTERS: a plan that names its domains never sees an entry from another one.
// It fails closed on purpose — an entry declaring no domain is invisible to
// every scoped plan, so a future catalogue cannot leak onto the deliverance
// shelf by forgetting a field.
function matchesDomain(resource, domains) {
  if (!domains?.length) return true;
  return (resource.domains || []).some((d) => domains.includes(d));
}

// Within each enabled language, original work comes before a verified
// translation. Language priority is handled before this rank.
function languageRank(resource, lang) {
  return resource.originalLanguage === lang ? 0 : 1;
}

// § perspective — a plan may declare which theological traditions it wants to
// hear from FIRST (the deliverance plan puts African Pentecostal and African
// deliverance resources ahead of international Pentecostal/charismatic, and
// those ahead of complementary evangelical material). This only ORDERS a shelf
// that has already passed every approval gate: it never adds a resource, never
// removes one, and never says a tradition is better than another. An entry with
// no declared perspective, or one the plan did not rank, sorts after those it
// did rather than being dropped.
function perspectiveRank(resource, perspectiveOrder) {
  if (!perspectiveOrder?.length) return 0;
  const ranks = (resource.perspective || [])
    .map((p) => perspectiveOrder.indexOf(p))
    .filter((i) => i >= 0);
  return ranks.length ? Math.min(...ranks) : perspectiveOrder.length;
}

// The resources to show for one plan day, already capped and ordered.
//
//   topics             the day's `resourceTopics`
//   lifeStage          e.g. 'single' — an entry that names lifeStages must include it
//   domains            from the plan's `resourceDomains`: the families of
//                      resources it draws from ([] leaves the plan unscoped)
//   languages          from resourceLanguages(): [appLang, ...enabled languages]
//   boostTopics        from the reader's growth areas (ranking only)
//   perspectiveOrder   theological traditions this plan wants first (ranking only)
//   limit              optional hard cap; defaults to the complete matching set
//   catalogue          injectable, so tests never depend on shipped content
//
// Returns one row per matching resource. For a work with several verified
// editions, the first enabled language wins; resources that exist only in a
// selected additional language are still included after app-language results.
export function resolveResources({
  topics = [],
  lifeStage = null,
  domains = [],
  languages = ['en'],
  boostTopics = [],
  perspectiveOrder = [],
  limit = DEFAULT_RESOURCE_LIMIT,
  catalogue = RESOURCES,
} = {}) {
  if (!topics.length || !languages.length) return [];
  const dayTopics = topics;
  const languageTiers = [...new Set(languages.filter(Boolean))];
  const languageOrder = new Map(languageTiers.map((code, index) => [code, index]));
  const matches = [];

  for (const resource of catalogue) {
    if (!isResourceApprovedForDisplay(resource)) continue;
    if (!matchesDomain(resource, domains)) continue;
    if (lifeStage && resource.lifeStages?.length && !resource.lifeStages.includes(lifeStage)) continue;
    const score = topicScore(resource, dayTopics, boostTopics);
    if (score === 0) continue;

    // Pick exactly one edition for this resource. The app language wins when it
    // exists; otherwise the reader's additional languages are tried in order.
    const languageIndex = languageTiers.findIndex((code) => isRenderableEdition(resource.editions?.[code]));
    if (languageIndex === -1) continue;
    const lang = languageTiers[languageIndex];

    matches.push({
      id: resource.id,
      type: resource.type,
      topics: resource.topics || [],
      description: resource.description || null,
      lang,
      isFallback: languageIndex > 0,
      edition: resource.editions[lang],
      perspective: resource.perspective || [],
      rank: languageRank(resource, lang),
      perspectiveRank: perspectiveRank(resource, perspectiveOrder),
      score,
    });
  }

  matches.sort((a, b) => languageOrder.get(a.lang) - languageOrder.get(b.lang)
    || a.perspectiveRank - b.perspectiveRank
    || a.rank - b.rank
    || b.score - a.score
    || a.id.localeCompare(b.id));
  const resultLimit = Number.isFinite(limit) ? Math.max(0, limit) : matches.length;
  return matches.slice(0, resultLimit);
}

// A retired entry can name its successor; follow that so a link that has died
// is replaced rather than silently dropped. Returns null when the replacement is
// missing, lacks a verified edition, or fails either publication review gate.
export function replacementFor(resource, catalogue = RESOURCES) {
  if (resource?.status !== 'retired' || !resource.replacementResourceId) return null;
  const next = catalogue.find((r) => r.id === resource.replacementResourceId);
  if (!isResourceApprovedForDisplay(next)) return null;
  return Object.values(next.editions || {}).some(isRenderableEdition) ? next : null;
}
