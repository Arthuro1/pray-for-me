// How the Journal is shown, remembered on this device. Circles is the default:
// the altar reads inner to outer before it reads as a flat list. Once someone
// picks another view it sticks between visits. Storage is content-free — one
// word, no prayer ids, no names.
export const JOURNAL_VIEW_STORAGE_KEY = 'pfm_journal_view_v1';
export const DEFAULT_JOURNAL_VIEW = 'circles';

const VALID_VIEWS = new Set(['circles', 'list', 'people']);

function storage() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function readJournalView() {
  try {
    const stored = storage()?.getItem(JOURNAL_VIEW_STORAGE_KEY);
    return VALID_VIEWS.has(stored) ? stored : DEFAULT_JOURNAL_VIEW;
  } catch {
    return DEFAULT_JOURNAL_VIEW;
  }
}

export function saveJournalView(view) {
  if (!VALID_VIEWS.has(view)) return;
  try {
    storage()?.setItem(JOURNAL_VIEW_STORAGE_KEY, view);
  } catch {
    // Private/restricted contexts: the choice still holds for this visit.
  }
}
