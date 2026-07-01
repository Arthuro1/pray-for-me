import { fr, enUS, de, ptBR } from 'date-fns/locale';
import { formatDistanceToNow } from 'date-fns';

export const DATE_LOCALES = { fr, en: enUS, de, pt: ptBR };

export function dateLocale(lang) {
  return DATE_LOCALES[lang] || enUS;
}

export function timeAgo(dateStr, lang) {
  return formatDistanceToNow(new Date(dateStr), {
    addSuffix: true,
    locale: dateLocale(lang),
  });
}

// Split items into "this month" vs "earlier" groups for a remembrance-style
// timeline (not a score), keeping their existing order within each group.
export function groupByThisMonth(items, getDate) {
  const now = new Date();
  const inThisMonth = (item) => {
    const d = new Date(getDate(item) || 0);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };
  return [
    { key: 'answeredThisMonth', items: items.filter(inThisMonth) },
    { key: 'answeredEarlier', items: items.filter((item) => !inThisMonth(item)) },
  ].filter((g) => g.items.length > 0);
}
