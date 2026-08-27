// Whether the Journal should quietly point at one of its own tools right now.
//
// The Journal keeps search, filters and the People lens visually quiet on
// purpose — an empty screen with two segments is the right first impression. The
// cost is that a few genuinely useful things are unlabelled icons, which some
// people never find. So each is introduced ONCE, in words, at the moment it
// starts being useful, and never again after it is dismissed or used.
//
// Nothing here is a checklist or a tour: at most one hint exists at a time, it
// disappears the moment the tool it points at is in use, and dismissing it is
// permanent. Storage is content-free — a single flag per hint, no counts, no
// prayer ids, no dates.
import { peopleViewAvailable } from './people';

export const JOURNAL_HINTS_STORAGE_KEY = 'pfm_journal_hints_v1';

export const JOURNAL_HINTS = Object.freeze({
  PEOPLE: 'people',
  SEARCH: 'search',
});

const VALID_HINTS = new Set(Object.values(JOURNAL_HINTS));

// Below this a journal is short enough to read, and search would be a solution
// looking for a problem.
const SEARCH_HINT_MIN_PRAYERS = 4;

function storage() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function readJournalHints() {
  try {
    const parsed = JSON.parse(storage()?.getItem(JOURNAL_HINTS_STORAGE_KEY) || 'null');
    const seen = Array.isArray(parsed?.seen) ? parsed.seen.filter((h) => VALID_HINTS.has(h)) : [];
    return { version: 1, seen: [...new Set(seen)] };
  } catch {
    return { version: 1, seen: [] };
  }
}

export function markJournalHintSeen(hint) {
  if (!VALID_HINTS.has(hint)) return readJournalHints();
  const next = { version: 1, seen: [...new Set([...readJournalHints().seen, hint])] };
  try {
    storage()?.setItem(JOURNAL_HINTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable in private/restricted contexts; the hint is
    // still dismissed in memory for this render, and reading prayers is
    // unaffected either way.
  }
  return next;
}

// ONE hint, or null. Ordered so the more specific invitation wins: "you pray for
// several people" says something true about this person's journal, while the
// search hint is generic advice.
export function nextJournalHint({
  prayers = [],
  peopleOpen = false,
  toolsInUse = false,
  seen = readJournalHints().seen,
} = {}) {
  const done = new Set(seen);

  if (!done.has(JOURNAL_HINTS.PEOPLE) && !peopleOpen && peopleViewAvailable(prayers)) {
    return JOURNAL_HINTS.PEOPLE;
  }
  // Someone already searching or filtering has found the tools; saying so would
  // be noise.
  if (!done.has(JOURNAL_HINTS.SEARCH) && !toolsInUse && prayers.length >= SEARCH_HINT_MIN_PRAYERS) {
    return JOURNAL_HINTS.SEARCH;
  }
  return null;
}

// Whether the Journal's retrieval tools are worth showing at all times rather
// than only once someone has opened search. Same threshold as the hint: they
// appear when the list stops being something you can simply read down.
export function journalToolsUseful(prayers = []) {
  return prayers.length >= SEARCH_HINT_MIN_PRAYERS;
}
