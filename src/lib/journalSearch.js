import { testimonyList } from '../utils/prayer';

export const EMPTY_JOURNAL_FILTERS = Object.freeze({
  category: 'all',
  person: 'all',
  source: 'all',
  answeredDate: 'all',
});

const normalize = (value) => String(value || '')
  .normalize('NFKD')
  .replace(/\p{M}/gu, '')
  .toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

const translatedText = (text, translate) => {
  if (!text) return '';
  const translated = translate?.(text);
  return translated && translated !== text ? `${text} ${translated}` : text;
};

function searchableFields(prayer, translate) {
  if (!prayer || prayer._locked) return [];
  const fields = [
    { field: 'title', text: prayer.title },
    { field: 'person', text: prayer.person_name },
    { field: 'description', text: prayer.description },
    ...(prayer.prayer_updates || []).map((update) => ({ field: 'update', text: update.text })),
    ...testimonyList(prayer).map((testimony) => ({ field: 'testimony', text: testimony.content })),
  ];
  return fields
    .filter(({ text }) => typeof text === 'string' && text.trim())
    .map(({ field, text }) => ({
      field,
      text,
      normalized: normalize(translatedText(text, translate)),
    }));
}

// Search is intentionally performed over already-decrypted in-memory rows.
// Nothing here calls Supabase, analytics, translation APIs, or another service.
export function journalSearchMatch(prayer, query, translate = (text) => text) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return { field: 'title', text: prayer?.title || '' };

  const fields = searchableFields(prayer, translate);
  const combined = fields.map(({ normalized }) => normalized).join(' ');
  if (!terms.every((term) => combined.includes(term))) return null;

  // Prefer the field that explains the match most clearly. A query may span
  // fields ("Marc surgery"), so choose the field containing the most terms.
  const ranked = fields
    .map((field, index) => ({
      ...field,
      index,
      score: terms.filter((term) => field.normalized.includes(term)).length,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const complete = ranked.find((field) => terms.every((term) => field.normalized.includes(term)));
  const explanatory = ranked.find((field) => !['title', 'person'].includes(field.field) && field.score > 0);
  const best = complete || explanatory || ranked[0];
  return best ? { field: best.field, text: best.text } : null;
}

export function prayerGroupNames(prayer, prayerShares = {}) {
  const names = [
    prayer?.origin_group_name,
    ...(prayerShares[prayer?.id] || []).map((share) => share.groupName),
  ];
  const unique = new Map();
  for (const name of names) {
    const key = normalize(name);
    if (key && !unique.has(key)) unique.set(key, String(name).trim());
  }
  return [...unique.values()];
}

export function journalFilterOptions(prayers, prayerShares = {}) {
  const people = new Map();
  const groups = new Map();
  let hasPersonal = false;
  for (const prayer of prayers || []) {
    if (!prayer?.community_origin_id && !prayer?.origin_group_name) hasPersonal = true;
    if (!prayer?._locked) {
      const personKey = normalize(prayer.person_name);
      if (personKey && !people.has(personKey)) people.set(personKey, prayer.person_name.trim());
    }
    for (const groupName of prayerGroupNames(prayer, prayerShares)) {
      const groupKey = normalize(groupName);
      if (!groups.has(groupKey)) groups.set(groupKey, groupName);
    }
  }
  const byLabel = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' });
  return {
    people: [...people.values()].sort(byLabel),
    groups: [...groups.values()].sort(byLabel),
    hasPersonal,
  };
}

function answeredDateMatches(prayer, value, now) {
  if (value === 'all') return true;
  const date = new Date(prayer.answered_at || prayer.updated_at || 0);
  if (Number.isNaN(date.getTime())) return false;
  const thisMonth = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  return value === 'month' ? thisMonth : value === 'earlier' ? !thisMonth : true;
}

function prayerMatchesFilters(prayer, filters, prayerShares, status, now) {
  if (filters.category !== 'all') {
    const categoryIds = (prayer.prayer_categories || []).map((row) => row.category_id);
    if (!categoryIds.includes(filters.category)) return false;
  }
  if (filters.person !== 'all' && normalize(prayer.person_name) !== normalize(filters.person)) return false;
  if (filters.source === 'personal') {
    if (prayer.community_origin_id || prayer.origin_group_name) return false;
  } else if (filters.source.startsWith('group:')) {
    const selected = normalize(filters.source.slice('group:'.length));
    if (!prayerGroupNames(prayer, prayerShares).some((name) => normalize(name) === selected)) return false;
  }
  if (status === 'answered' && !answeredDateMatches(prayer, filters.answeredDate, now)) return false;
  return true;
}

export function journalFiltersActive(filters, status) {
  return (
    filters.category !== 'all'
    || filters.person !== 'all'
    || filters.source !== 'all'
    || (status === 'answered' && filters.answeredDate !== 'all')
  );
}

export function filterJournalPrayers({
  prayers,
  status,
  query = '',
  filters = EMPTY_JOURNAL_FILTERS,
  prayerShares = {},
  translate,
  now = new Date(),
}) {
  return (prayers || []).flatMap((prayer) => {
    if (prayer.status !== status) return [];
    if (!prayerMatchesFilters(prayer, filters, prayerShares, status, now)) return [];
    const match = query ? journalSearchMatch(prayer, query, translate) : null;
    if (query && !match) return [];
    return [{ prayer, match }];
  });
}
