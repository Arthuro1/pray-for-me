// The language the user writes their *personal* prayers in. We stamp it the first
// time we see the user and refresh it whenever they author a new prayer, so it
// tracks the language they actually type in.
//
// Purpose (cost): never spend an AI translation call turning content into the
// language it is already written in. `translateContent` skips entirely when the
// display language equals the content language — the common monolingual case —
// so only a user genuinely reading in a *different* language pays for translation.
const KEY = 'pfm_content_lang';

// The stored writing language, or null if we've never stamped one.
export function getContentLang() {
  try {
    return localStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
}

// Record the language the user is authoring in (overwrites — the latest write
// wins, so switching authoring language is tracked).
export function setContentLang(lang) {
  if (!lang) return;
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    // localStorage unavailable — same-language translation just isn't skipped.
  }
}

// Set the writing language only if we don't have one yet (first-run default).
export function ensureContentLang(lang) {
  if (!lang) return;
  try {
    if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, lang);
  } catch {
    // ignore — see setContentLang.
  }
}
