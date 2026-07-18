// Remembered translation display preference, per SCOPE: a group id (community
// requests keep one choice per group) or a prayer scope like `prayer:<id>` for
// a personal prayer. Once the user chooses "See translation" (or goes back to
// the original), reopening that scope keeps their choice. Stored locally;
// content-free (scope keys and the words 'translated'/'original' only).
const KEY = 'pfm_translate_pref';

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

// 'translated' | 'original' | null (no preference recorded yet)
export function getTranslationPref(scope) {
  return (scope && read()[scope]) || null;
}

export function setTranslationPref(scope, pref) {
  if (!scope) return;
  const map = read();
  map[scope] = pref;
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch { /* storage unavailable */ }
}

// Stable scope key for a personal prayer's own preference.
export function prayerScope(prayerId) {
  return prayerId ? `prayer:${prayerId}` : null;
}
