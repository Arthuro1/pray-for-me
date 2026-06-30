// Build a Bible.com link for a reference so the user can read it in context.
// Centralized here so every caller (prayer points, Scripture guidance, the daily
// verse, the in-app reader) opens the Word the same way — in the reader's own
// language when we have a version for it, otherwise Bible.com's own default.
import { versionForLang } from '../lib/bibleRef';

export function bibleLink(reference, lang) {
  const version = versionForLang(lang);
  const versionParam = version ? `&version_id=${version}` : '';
  return `https://www.bible.com/search/bible?q=${encodeURIComponent(reference || '')}${versionParam}`;
}
