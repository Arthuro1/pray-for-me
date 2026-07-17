// Remembered translation display preference, per group: once a member chooses
// "See translation" (or goes back to the original) in a group, reopening that
// group's requests keeps their choice. Stored locally; content-free.
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
export function getTranslationPref(groupId) {
  return (groupId && read()[groupId]) || null;
}

export function setTranslationPref(groupId, pref) {
  if (!groupId) return;
  const map = read();
  map[groupId] = pref;
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch { /* storage unavailable */ }
}
