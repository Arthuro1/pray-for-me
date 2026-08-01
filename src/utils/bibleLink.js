// Build a Bible.com link for a reference so the user can read it in context.
// Centralized here so every caller (prayer points, Scripture guidance, the daily
// verse, the in-app reader) opens the Word the same way — in the reader's own
// language when we have a version for it, otherwise Bible.com's own default.
import { usfmFromReference, versionForLang } from '../lib/bibleRef';

export function bibleLink(reference, lang) {
  const version = versionForLang(lang);
  const usfm = usfmFromReference(reference);

  // Bible.com's canonical passage URLs are universal links: phones can open
  // them in the installed Bible App, while laptops open the same location on
  // Bible.com. The action promises the whole chapter, so deliberately remove a
  // verse or verse range from the locally resolved USFM reference.
  if (version && usfm) {
    const chapter = usfm.split('.').slice(0, 2).join('.');
    return `https://www.bible.com/bible/${version}/${chapter}`;
  }

  // If a reference cannot be mapped safely, retain the existing search fallback
  // rather than sending the reader to a confidently wrong chapter.
  const versionParam = version ? `&version_id=${version}` : '';
  return `https://www.bible.com/search/bible?q=${encodeURIComponent(reference || '')}${versionParam}`;
}
