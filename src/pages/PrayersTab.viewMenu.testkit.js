// Test helpers for the Journal's view menu (List / People / By circle), which
// sits beside Filter as one small dropdown. Shared by the PrayersTab tests.
import { fireEvent, screen } from '@testing-library/react';
import { t } from '../i18n';

const LANG = 'fr';

// The menu's trigger, or null when there is only one way to show the list.
export const viewMenu = (lang = LANG) => screen.queryByRole('button', {
  name: (name) => name.startsWith(t(lang, 'journalViewLabel')),
});

// The view the trigger currently names, e.g. "Affichage : Par cercle".
export const viewMenuNames = (key, lang = LANG) => viewMenu(lang)?.getAttribute('aria-label')
  === `${t(lang, 'journalViewLabel')}: ${t(lang, key)}`;

export function chooseView(key, lang = LANG) {
  fireEvent.click(viewMenu(lang));
  fireEvent.click(screen.getByRole('menuitemradio', { name: t(lang, key) }));
}

// Whether the menu offers a view at all — it opens the menu, looks, and
// closes it again.
export function viewOffered(key, lang = LANG) {
  const menu = viewMenu(lang);
  if (!menu) return false;
  fireEvent.click(menu);
  const offered = !!screen.queryByRole('menuitemradio', { name: t(lang, key) });
  fireEvent.click(menu);
  return offered;
}
