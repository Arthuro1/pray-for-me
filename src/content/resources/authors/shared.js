// Helpers shared by the author collections in this folder. See ../authorBooks.js
// for what the collections are and how they reach a plan.
import { AUTHOR_BOOKS_SIGNOFF, AUTHOR_BOOKS_APPROVED_IDS } from '../../reviews/paulAuthorBooks20260923';

export const VERIFIED_AT = '2026-09-23';

// A verified edition: `url` is the publisher's or ministry's own page, read on
// VERIFIED_AT. Pass `{ available: false }` when that page says it is out of stock.
export const edition = (title, author, publisher, url, extra = {}) => ({
  title, author, publisher, url, available: true, lastVerifiedAt: VERIFIED_AT, ...extra,
});

// A real edition with no page of its own to link. It cannot render (see
// isRenderableEdition in src/lib/resources.js); it is kept for a curator.
export const unlinkedEdition = (title, author, publisher) => ({ title, author, publisher, available: true });

// Approval is a closed list in the review record, never a default: an entry
// added here later stays `needs_review`, with no sign-off, until someone adds
// its id there.
const APPROVED = new Set(AUTHOR_BOOKS_APPROVED_IDS);

export function authorBook({
  id,
  type = 'book',
  language,
  domains,
  perspective,
  topics,
  lifeStages = [],
  reviewLevel,
  description,
  editions,
}) {
  const approved = APPROVED.has(id);
  return {
    id,
    type,
    originalLanguage: language,
    domains,
    ...(perspective ? { perspective } : {}),
    topics,
    lifeStages,
    status: approved ? 'approved' : 'needs_review',
    ...(reviewLevel ? { reviewLevel } : {}),
    ...(approved ? { contentReview: { ...AUTHOR_BOOKS_SIGNOFF }, safetyReview: { ...AUTHOR_BOOKS_SIGNOFF } } : {}),
    description,
    editions,
  };
}
