// Books by five teachers requested on 2026-09-23: Myles Munroe, Nicky & Sila
// Lee, Mohammed & Lilliane Sanogo, Zac Poonen (with Annie and Santosh Poonen)
// and Reinhold Ruthe. One file per author in ./authors/.
//
// ─────────────────────────────────────────────────────────────────────────────
// APPROVAL
// ─────────────────────────────────────────────────────────────────────────────
// Approval is the closed list in src/content/reviews/paulAuthorBooks20260923.js.
// An entry whose id is not on it stays `needs_review` with no sign-off, so a
// book added to these files later is never approved by default. A
// `// Sensitive:` comment on an entry says which subject needs both reviews.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHERE EACH BOOK LANDS
// ─────────────────────────────────────────────────────────────────────────────
// Every entry names its own `domains` (see RESOURCE_DOMAINS in ./topics.js):
//   • `relationships`, `freedom`, `bible-study` — the shelves of the current
//     plans; a day's `resourceTopics` then places the book.
//   • `christian-living` — books on subjects no current plan is about (calling,
//     leadership, holiness, blessing, the Kingdom, pastoral care…), held for
//     the plans being written. No current plan reads this shelf, so they cannot
//     crowd an existing one; a new plan opts in through `resourceDomains`.
// A few Bible-study books wait the same way on the `bible-study` shelf, under
// topics (`bible-overview`, `end-times`, `church`) no current study uses.
//
// Every edition was read on its publisher's or ministry's own page on
// 2026-09-23. A language key exists only where that page exists; each author
// file says which editions were checked and deliberately left out.
import { MUNROE_BOOKS } from './authors/munroe';
import { LEE_BOOKS } from './authors/lee';
import { SANOGO_BOOKS } from './authors/sanogo';
import { POONEN_BOOKS } from './authors/poonen';
import { RUTHE_BOOKS } from './authors/ruthe';

export const AUTHOR_BOOKS = [
  ...MUNROE_BOOKS,
  ...LEE_BOOKS,
  ...SANOGO_BOOKS,
  ...POONEN_BOOKS,
  ...RUTHE_BOOKS,
];

export default AUTHOR_BOOKS;
