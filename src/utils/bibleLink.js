// Build a Bible.com link for a reference so the user can read it in context.
// Centralized here so every caller (prayer points, Scripture guidance, the
// daily verse) opens the Word the same way. version_id=93 matches the link the
// app has always used.
export function bibleLink(reference) {
  return `https://www.bible.com/search/bible?q=${encodeURIComponent(reference || '')}&version_id=93`;
}
