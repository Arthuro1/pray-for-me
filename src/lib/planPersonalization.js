// A presentation-only overlay on the existing plan day. No user response is
// added to a prayer row, its schedule, an invitation, a resource, or analytics.
import { t } from '../i18n';

// The OPTIONAL layers a married couple can add on top of the plan.
//
// Prayer for the spouse, for one's own growth, and for the marriage used to sit
// in this list as four pre-ticked boxes. They are the plan itself, not a choice:
// unticking them changed nothing a day said, so the list promised a control it
// could not honour. Every id left here genuinely changes a day.
export const MARRIAGE_INCLUDES = [
  { id: 'children', labelKey: 'planCoupleIncludeChildren' },
  { id: 'home', labelKey: 'planCoupleIncludeHome' },
  { id: 'extended-family', labelKey: 'planCoupleIncludeExtendedFamily' },
];
export const MAX_PLAN_CHILDREN = 20;
export const MAX_PLAN_NAME = 80;
const INCLUDE_IDS = new Set(MARRIAGE_INCLUDES.map(({ id }) => id));
const ROLE_IDS = new Set(['general', 'husband', 'wife']);

export const isCouplePlan = (plan) => ['engaged', 'married'].includes(plan?.lifeStage);

// Does this plan have anything to tailor at all? A plan that declares
// `onboarding` carries the optional layer the personalize sheet edits; every
// other plan is the same for everyone and offers no sheet.
export const hasPersonalization = (plan) => !!plan?.onboarding;

// People already named in the journal, offered as a shortcut when a couple plan
// asks who it is for. The id is the PRAYER's id, not a position: it is stored
// inside the run's private preferences, so a list that reorders must never make
// a saved choice point at someone else.
export function planPeopleFrom(prayers) {
  const seen = new Set();
  return (prayers || []).flatMap((prayer) => {
    const name = prayer._locked ? '' : (prayer.person_name || '').trim();
    const key = name.toLocaleLowerCase();
    if (!name || seen.has(key)) return [];
    seen.add(key);
    return [{ id: prayer.id, prayerId: prayer.id, name }];
  });
}

// Strip bidi controls from user input; rendering supplies its own isolation.
// Names remain plain React text, never HTML or an interpolation replacement
// string (so "$&" / braces in a name cannot become executable/template syntax).
//
// The class covers C0/C1 controls, the embedding and override characters
// (U+202A\u2013202E), the isolates the renderer itself uses (U+2066\u20132069), and the
// implicit marks LRM/RLM/ALM \u2014 which are bidirectional controls too, and were
// the gap between what this did and what the docs claimed it did.
export function cleanPlanName(value) {
  return typeof value === 'string'
    ? value.replace(/[\p{Cc}\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu, '').trim().slice(0, MAX_PLAN_NAME)
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
  // Adding no layer is a real answer: the marriage plan is complete without
  // children, a home or an extended family, so an empty list stands. An id saved
  // by an older build that no longer names a layer simply drops out here.
  const includes = Array.isArray(value?.includes)
    ? [...new Set(value.includes.filter((id) => INCLUDE_IDS.has(id)))]
    : [];
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
  // Praying alone is the default: the shared activities appear only when both
  // people have said they want them.
  if (prefs.mode !== 'together') {
    day.conversationPrompt = undefined;
    day.prayTogether = undefined;
  }
  return day;
}
