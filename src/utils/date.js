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
