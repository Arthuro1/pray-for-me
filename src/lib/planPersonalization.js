// A presentation-only overlay on the existing plan day. No user response is
// added to a prayer row, its schedule, an invitation, a resource, or analytics.
import { t } from '../i18n';

export const MARRIAGE_INCLUDES = [
  { id: 'marriage', labelKey: 'planCoupleIncludeMarriage' },
  { id: 'spouse', labelKey: 'planCoupleIncludeSpouse' },
  { id: 'self', labelKey: 'planCoupleIncludeSelf' },
  { id: 'spiritual', labelKey: 'planCoupleIncludeSpiritual' },
  { id: 'children', labelKey: 'planCoupleIncludeChildren' },
  { id: 'home', labelKey: 'planCoupleIncludeHome' },
  { id: 'extended-family', labelKey: 'planCoupleIncludeExtendedFamily' },
];
export const DEFAULT_MARRIAGE_INCLUDES = ['marriage', 'spouse', 'self', 'spiritual'];
export const MAX_PLAN_CHILDREN = 20;
export const MAX_PLAN_NAME = 80;
const INCLUDE_IDS = new Set(MARRIAGE_INCLUDES.map(({ id }) => id));
const ROLE_IDS = new Set(['general', 'husband', 'wife']);

export const isCouplePlan = (plan) => ['engaged', 'married'].includes(plan?.lifeStage);

// Strip bidi controls from user input; rendering supplies its own isolation.
// Names remain plain React text, never HTML or an interpolation replacement
// string (so "$&" / braces in a name cannot become executable/template syntax).
export function cleanPlanName(value) {
  return typeof value === 'string'
    ? value.replace(/[\p{Cc}\u202a-\u202e\u2066-\u2069]/gu, '').trim().slice(0, MAX_PLAN_NAME)
    : '';
}

function person(value, fallbackId = '') {
  const name = cleanPlanName(value?.name);
  if (!name) return null;
  const id = typeof value?.id === 'string' && /^[\w-]{1,100}$/.test(value.id) ? value.id : fallbackId;
  const prayerId = typeof value?.prayerId === 'string' && /^[\w-]{1,100}$/.test(value.prayerId) ? value.prayerId : undefined;
  return { ...(id ? { id } : {}), name, ...(prayerId ? { prayerId } : {}) };
}

export function sanitizePlanPersonalization(value = {}) {
  const includes = Array.isArray(value?.includes)
    ? [...new Set(value.includes.filter((id) => INCLUDE_IDS.has(id)))]
    : [...DEFAULT_MARRIAGE_INCLUDES];
  const seen = new Set();
  const children = includes.includes('children') && Array.isArray(value?.children)
    ? value.children.slice(0, MAX_PLAN_CHILDREN).flatMap((child, i) => {
      const cleaned = person(child, `child-${i + 1}`);
      if (!cleaned || seen.has(cleaned.id)) return [];
      seen.add(cleaned.id);
      return [cleaned];
    }) : [];
  return {
    partner: person(value?.partner),
    role: ROLE_IDS.has(value?.role) ? value.role : 'general',
    mode: value?.mode === 'together' ? 'together' : 'private',
    includes,
    children,
  };
}

function withNames(field, names) {
  if (!field || typeof field !== 'object') return field;
  return Object.fromEntries(Object.entries(field).map(([lang, text]) => [lang,
    typeof text === 'string' && lang !== 'ref'
      ? text.replace(/\{(partner|child)\}/g, (token, key) => names[key] ?? token)
      : text,
  ]));
}

const TEXT_FIELDS = ['theme', 'reflection', 'selfPrompt', 'spousePrompt', 'marriagePrompt',
  'practice', 'conversationPrompt', 'prayTogether', 'safetyNote'];

export function personalizePlanDay(plan, source, input, lang) {
  if (!source || !isCouplePlan(plan)) return source;
  const prefs = sanitizePlanPersonalization(input);
  const hasChildren = plan.lifeStage === 'married' && prefs.children.length > 0;
  // The baseline is always a complete day for a couple without children. The
  // optional variant does not add, remove, or renumber any calendar occurrence.
  const day = hasChildren && source.withChildren ? { ...source, ...source.withChildren } : { ...source };
  const generic = t(lang, plan.lifeStage === 'engaged' ? 'planCouplePartnerEngaged' : 'planCouplePartnerMarried');
  const partner = prefs.partner?.name || generic;
  const names = { partner: `\u2068${partner}\u2069` };
  for (const field of TEXT_FIELDS) day[field] = withNames(day[field], names);
  day.prompts = (day.prompts || []).map((prompt) => withNames(prompt, names));
  day.roles = day.roles && Object.fromEntries(Object.entries(day.roles).map(([role, text]) => [role, withNames(text, names)]));
  day.partnerName = prefs.partner?.name || null;
  day.lifeStage = plan.lifeStage;
  day.childPrayers = hasChildren && day.childPrompt
    ? prefs.children.map((child) => ({
      id: child.id,
      name: child.name,
      prompt: withNames(day.childPrompt, { ...names, child: `\u2068${child.name}\u2069` }),
    })) : [];
  const extraPrompts = [];
  if (prefs.includes.includes('home') && day.resourceTopics?.includes('family')) {
    extraPrompts.push({ [lang]: t(lang, 'planCoupleHomePrayer') });
  }
  if (prefs.includes.includes('extended-family') && day.resourceTopics?.includes('family-of-origin')) {
    extraPrompts.push({ [lang]: t(lang, 'planCoupleExtendedFamilyPrayer') });
  }
  day.prompts = [...(day.prompts || []), ...extraPrompts];
  // The three directions stay together: selecting an emphasis must never turn
  // the marriage plan into prayers that only ask God to change the spouse.
  if (prefs.mode !== 'together') {
    day.conversationPrompt = undefined;
    day.prayTogether = undefined;
  }
  return day;
}
