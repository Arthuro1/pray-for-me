// The deliverance resource worksheet, and the gates that keep it off screen.
//
// The rule this file exists to prove: recommending a book about demons, curses,
// covenants or ancestral practice is a pastoral act, so nothing here reaches a
// reader until a named human has signed off BOTH content and safety. An empty
// "Go deeper" shelf is the correct state, not a bug — the thirty days are
// complete without a single external book.
import { describe, it, expect } from 'vitest';
import { DELIVERANCE_BOOKS } from './deliveranceBooks.js';
import { RESOURCES } from './catalogue.js';
import { RESOURCE_TOPICS, RESOURCE_PERSPECTIVES, RESOURCE_TYPES, RESOURCE_STATUSES } from './topics.js';
import { resolveResources, isResourceApprovedForDisplay, isSensitiveResource, SENSITIVE_RESOURCE_TOPICS } from '../../lib/resources.js';
import { FREEDOM_IN_CHRIST, MOVEMENTS } from '../plans/freedomInChrist.js';

const allDayTopics = [...new Set(FREEDOM_IN_CHRIST.days.flatMap((d) => d.resourceTopics))];

describe('the worksheet is well-formed', () => {
  it('is part of the one shared catalogue rather than a parallel system', () => {
    for (const entry of DELIVERANCE_BOOKS) expect(RESOURCES).toContain(entry);
  });

  it('uses only known ids, types, statuses, topics and perspectives', () => {
    const ids = new Set();
    for (const entry of DELIVERANCE_BOOKS) {
      expect(ids.has(entry.id), entry.id).toBe(false);
      ids.add(entry.id);
      expect(RESOURCE_TYPES, entry.id).toContain(entry.type);
      expect(RESOURCE_STATUSES, entry.id).toContain(entry.status);
      for (const topic of entry.topics) expect(RESOURCE_TOPICS, `${entry.id} / ${topic}`).toContain(topic);
      for (const p of entry.perspective) expect(RESOURCE_PERSPECTIVES, `${entry.id} / ${p}`).toContain(p);
    }
  });

  it('does not collide with any id already in the catalogue', () => {
    const counts = new Map();
    for (const entry of RESOURCES) counts.set(entry.id, (counts.get(entry.id) || 0) + 1);
    for (const [id, n] of counts) expect(n, id).toBe(1);
  });
});

describe('every deliverance resource is treated as sensitive', () => {
  it('raises the review level from the topic itself, not just from a label', () => {
    for (const topic of ['deliverance', 'spiritual-warfare', 'curses', 'covenants', 'altars', 'occult', 'family-line']) {
      expect(SENSITIVE_RESOURCE_TOPICS.has(topic), topic).toBe(true);
    }
    for (const entry of DELIVERANCE_BOOKS) expect(isSensitiveResource(entry), entry.id).toBe(true);
  });

  it('cannot be published by status alone — two named sign-offs are required', () => {
    for (const entry of DELIVERANCE_BOOKS) {
      expect(isResourceApprovedForDisplay(entry), entry.id).toBe(false);
    }
    // Even flipping the status to `approved` is not enough on its own.
    const forced = { ...DELIVERANCE_BOOKS[0], status: 'approved' };
    expect(isResourceApprovedForDisplay(forced)).toBe(false);
    // Both sign-offs, each with a named reviewer and a real date, are what publishes it.
    const signed = {
      ...forced,
      contentReview: { status: 'approved', reviewedBy: 'A reviewer', reviewedAt: '2026-08-28' },
      safetyReview: { status: 'approved', reviewedBy: 'A reviewer', reviewedAt: '2026-08-28' },
    };
    expect(isResourceApprovedForDisplay(signed)).toBe(true);
  });
});

describe('no localized edition is invented', () => {
  it('lists only languages a real edition was verified in', () => {
    for (const entry of DELIVERANCE_BOOKS) {
      expect(Object.keys(entry.editions), entry.id).toEqual(['en']);
    }
  });

  it('records a URL only where one was actually verified, with the date', () => {
    for (const entry of DELIVERANCE_BOOKS) {
      const edition = entry.editions.en;
      expect(edition.title && edition.author && edition.publisher, entry.id).toBeTruthy();
      if (edition.url) {
        expect(new URL(edition.url).protocol, entry.id).toBe('https:');
        expect(edition.lastVerifiedAt, entry.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      } else {
        // An unverified edition carries no date either — it cannot render, and
        // a reviewer must supply and check a canonical link first.
        expect(edition.lastVerifiedAt, entry.id).toBeUndefined();
      }
    }
  });
});

describe('the shelf the reader actually sees', () => {
  it('is empty in every language, because nothing has been approved yet', () => {
    for (const lang of ['en', 'fr', 'de', 'es', 'pt', 'sw', 'am', 'tl', 'hi']) {
      const resolved = resolveResources({
        topics: allDayTopics,
        languages: [lang],
        perspectiveOrder: FREEDOM_IN_CHRIST.resourcePerspectives,
      });
      // Only entries approved for OTHER topics could appear; none of the
      // deliverance candidates may.
      const deliveranceIds = new Set(DELIVERANCE_BOOKS.map((b) => b.id));
      expect(resolved.filter((r) => deliveranceIds.has(r.id)), lang).toEqual([]);
    }
  });

  it('is not fabricated from a missing translation — a language with no edition simply gets nothing', () => {
    const catalogue = [{
      ...DELIVERANCE_BOOKS[0],
      status: 'approved',
      contentReview: { status: 'approved', reviewedBy: 'A reviewer', reviewedAt: '2026-08-28' },
      safetyReview: { status: 'approved', reviewedBy: 'A reviewer', reviewedAt: '2026-08-28' },
      editions: { en: { title: 'A title', author: 'An author', publisher: 'A publisher', url: 'https://example.org/a', available: true, lastVerifiedAt: '2026-08-28' } },
    }];
    // A German reader with no English fallback gets an empty shelf, not a
    // German-looking version of the English edition.
    expect(resolveResources({ topics: ['deliverance'], languages: ['de'], catalogue })).toEqual([]);
    // With English configured as a fallback, they get the English edition,
    // labelled as a fallback.
    const withFallback = resolveResources({ topics: ['deliverance'], languages: ['de', 'en'], catalogue });
    expect(withFallback).toHaveLength(1);
    expect(withFallback[0].lang).toBe('en');
    expect(withFallback[0].isFallback).toBe(true);
  });

  it('orders an approved shelf by the plan’s perspective preference', () => {
    const sign = (entry) => ({
      ...entry,
      status: 'approved',
      contentReview: { status: 'approved', reviewedBy: 'A reviewer', reviewedAt: '2026-08-28' },
      safetyReview: { status: 'approved', reviewedBy: 'A reviewer', reviewedAt: '2026-08-28' },
      editions: { en: { title: entry.id, author: 'An author', publisher: 'A publisher', url: `https://example.org/${entry.id}`, available: true, lastVerifiedAt: '2026-08-28' } },
    });
    const catalogue = [
      sign({ id: 'evangelical-one', type: 'book', originalLanguage: 'en', perspective: ['evangelical'], topics: ['deliverance'] }),
      sign({ id: 'african-one', type: 'book', originalLanguage: 'en', perspective: ['african-pentecostal'], topics: ['deliverance'] }),
      sign({ id: 'charismatic-one', type: 'book', originalLanguage: 'en', perspective: ['charismatic'], topics: ['deliverance'] }),
      sign({ id: 'unlabelled-one', type: 'book', originalLanguage: 'en', perspective: [], topics: ['deliverance'] }),
    ];
    const ordered = resolveResources({
      topics: ['deliverance'],
      languages: ['en'],
      perspectiveOrder: FREEDOM_IN_CHRIST.resourcePerspectives,
      catalogue,
    }).map((r) => r.id);
    expect(ordered).toEqual(['african-one', 'charismatic-one', 'evangelical-one', 'unlabelled-one']);
  });

  it('leaves ordering untouched for plans that declare no preference', () => {
    const sign = (id, perspective) => ({
      id, type: 'book', originalLanguage: 'en', perspective, topics: ['deliverance'],
      status: 'approved',
      contentReview: { status: 'approved', reviewedBy: 'A reviewer', reviewedAt: '2026-08-28' },
      safetyReview: { status: 'approved', reviewedBy: 'A reviewer', reviewedAt: '2026-08-28' },
      editions: { en: { title: id, author: 'An author', publisher: 'A publisher', url: `https://example.org/${id}`, available: true, lastVerifiedAt: '2026-08-28' } },
    });
    const catalogue = [sign('b-entry', ['evangelical']), sign('a-entry', ['african-pentecostal'])];
    const ordered = resolveResources({ topics: ['deliverance'], languages: ['en'], catalogue }).map((r) => r.id);
    expect(ordered).toEqual(['a-entry', 'b-entry']); // alphabetical tie-break, as before
  });
});

describe('the worksheet covers what the plan asks for', () => {
  it('offers at least one candidate for every movement’s shelf topics', () => {
    for (const movement of MOVEMENTS) {
      const matches = DELIVERANCE_BOOKS.filter((b) => b.topics.some((t) => movement.resourceTopics.includes(t)));
      expect(matches.length, movement.id).toBeGreaterThan(0);
    }
  });

  it('leads with African Pentecostal candidates, as the plan asks', () => {
    const african = DELIVERANCE_BOOKS.filter((b) => b.perspective.includes('african-pentecostal'));
    expect(african.length).toBeGreaterThanOrEqual(3);
  });

  it('never carries prayer text copied from a recommended book', () => {
    // Descriptions are Pray4Me-authored, one sentence, and describe the book —
    // they never reproduce its prayers, prayer points or renunciation formulas.
    for (const entry of DELIVERANCE_BOOKS) {
      const description = entry.description.en;
      expect(description, entry.id).toBeTruthy();
      expect(description, entry.id).not.toMatch(/\bI renounce\b|\bin the name of Jesus\b|\bI break\b/i);
      expect(description.length, entry.id).toBeLessThan(260);
    }
  });
});
