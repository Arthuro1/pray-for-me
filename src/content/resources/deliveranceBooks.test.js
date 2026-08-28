// The deliverance resource shelf, and the gates that decide what reaches it.
//
// The rule this file exists to prove: recommending a book about demons, curses,
// covenants or ancestral practice is a pastoral act, so nothing here reaches a
// reader until a named human has signed off BOTH content and safety. Those
// sign-offs now exist, so the assertions below are about the gate rather than
// about emptiness — take a sign-off away and the entry must vanish again. An
// empty shelf is still a correct state, not a bug: the thirty days are complete
// without a single external book.
import { describe, it, expect } from 'vitest';
import { DELIVERANCE_BOOKS } from './deliveranceBooks.js';
import { RESOURCES } from './catalogue.js';
import { RESOURCE_TOPICS, RESOURCE_PERSPECTIVES, RESOURCE_TYPES, RESOURCE_STATUSES } from './topics.js';
import { resolveResources, isResourceApprovedForDisplay, isSensitiveResource, SENSITIVE_RESOURCE_TOPICS } from '../../lib/resources.js';
import { FREEDOM_IN_CHRIST, MOVEMENTS } from '../plans/freedomInChrist.js';
import { LANG_CODES } from '../../i18n.js';

const allDayTopics = [...new Set(FREEDOM_IN_CHRIST.days.flatMap((d) => d.resourceTopics))];

describe('the worksheet is well-formed', () => {
  it('is part of the one shared catalogue rather than a parallel system', () => {
    // By id, not by reference: the catalogue stamps each collection with its
    // domain (see inDomain() in ./catalogue.js), so what ships is a copy.
    const shipped = new Set(RESOURCES.map((r) => r.id));
    for (const entry of DELIVERANCE_BOOKS) expect(shipped, entry.id).toContain(entry.id);
  });

  it('ships every candidate on the freedom shelf and no other', () => {
    for (const entry of DELIVERANCE_BOOKS) {
      const shipped = RESOURCES.find((r) => r.id === entry.id);
      expect(shipped.domains, entry.id).toEqual(['freedom']);
    }
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
      // Take either attestation away and the entry goes back off screen, no
      // matter what its status says.
      expect(isResourceApprovedForDisplay({ ...entry, contentReview: undefined }), entry.id).toBe(false);
      expect(isResourceApprovedForDisplay({ ...entry, safetyReview: undefined }), entry.id).toBe(false);
      expect(isResourceApprovedForDisplay({ ...entry, status: 'needs_review' }), entry.id).toBe(false);
    }
    // Both sign-offs, each with a named reviewer and a real date, are what publishes it.
    const signed = {
      ...DELIVERANCE_BOOKS[0],
      status: 'approved',
      contentReview: { status: 'approved', reviewedBy: 'A reviewer', reviewedAt: '2026-08-28' },
      safetyReview: { status: 'approved', reviewedBy: 'A reviewer', reviewedAt: '2026-08-28' },
    };
    expect(isResourceApprovedForDisplay(signed)).toBe(true);
    // An unnamed or undated reviewer is not a sign-off.
    for (const bad of [{ status: 'approved' }, { status: 'approved', reviewedBy: '  ', reviewedAt: '2026-08-28' }, { status: 'approved', reviewedBy: 'A reviewer', reviewedAt: 'soon' }]) {
      expect(isResourceApprovedForDisplay({ ...signed, safetyReview: bad })).toBe(false);
    }
  });

  it('is displayed only where a named human actually signed both reviews', () => {
    for (const entry of DELIVERANCE_BOOKS.filter(isResourceApprovedForDisplay)) {
      for (const review of [entry.contentReview, entry.safetyReview]) {
        expect(review.status, entry.id).toBe('approved');
        expect(review.reviewedBy.trim(), entry.id).toBeTruthy();
        expect(review.reviewedAt, entry.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});

describe('no localized edition is invented', () => {
  // Every entry was written in English, and each translation below was found on
  // the publisher's or the ministry's own site. What this block guards is that a
  // language key is never a placeholder: an entry either carries a real, fully
  // described edition in that language or has no key for it at all.
  const editionsOf = (entry) => Object.entries(entry.editions);

  it('keys editions only by languages the app actually ships', () => {
    for (const entry of DELIVERANCE_BOOKS) {
      expect(Object.keys(entry.editions), entry.id).toContain('en');
      for (const [lang] of editionsOf(entry)) {
        expect(LANG_CODES, `${entry.id} / ${lang}`).toContain(lang);
      }
    }
  });

  it('describes every edition it lists, in every language', () => {
    for (const entry of DELIVERANCE_BOOKS) {
      for (const [lang, edition] of editionsOf(entry)) {
        expect(edition.title && edition.author && edition.publisher, `${entry.id} / ${lang}`).toBeTruthy();
      }
    }
  });

  it('records a URL only where one was actually verified, with the date', () => {
    for (const entry of DELIVERANCE_BOOKS) {
      for (const [lang, edition] of editionsOf(entry)) {
        if (edition.url) {
          expect(new URL(edition.url).protocol, `${entry.id} / ${lang}`).toBe('https:');
          expect(edition.lastVerifiedAt, `${entry.id} / ${lang}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        } else {
          // An unverified edition carries no date either — it cannot render, and
          // a reviewer must supply and check a canonical link first.
          expect(edition.lastVerifiedAt, `${entry.id} / ${lang}`).toBeUndefined();
        }
      }
    }
  });

  it('never reuses one language’s edition under another language’s key', () => {
    // The failure this stops: pasting the English row under `de` so the shelf
    // looks full. Two languages sharing a URL means one of them is a lie.
    for (const entry of DELIVERANCE_BOOKS) {
      const urls = editionsOf(entry).map(([, e]) => e.url).filter(Boolean);
      expect(new Set(urls).size, entry.id).toBe(urls.length);
    }
  });
});

describe('the shelf the reader actually sees', () => {
  it('shows a book in a language only where that language has its own verified edition', () => {
    const byId = new Map(DELIVERANCE_BOOKS.map((b) => [b.id, b]));
    for (const lang of ['en', 'fr', 'de', 'es', 'ru', 'hi', 'pt', 'sw', 'am', 'tl', 'ar', 'fa']) {
      const resolved = resolveResources({
        topics: allDayTopics,
        languages: [lang], // no fallback, so nothing can leak in from English
        domains: FREEDOM_IN_CHRIST.resourceDomains,
        perspectiveOrder: FREEDOM_IN_CHRIST.resourcePerspectives,
      });
      for (const entry of resolved.filter((r) => byId.has(r.id))) {
        const edition = byId.get(entry.id).editions[lang];
        expect(edition, `${lang}: ${entry.id}`).toBeTruthy();
        expect(entry.edition.url, `${lang}: ${entry.id}`).toBe(edition.url);
        expect(entry.isFallback, `${lang}: ${entry.id}`).toBe(false);
      }
    }
  });

  it('leaves the shelf empty in the languages nobody has curated yet', () => {
    // pt/ar/fa/id/ko/ja/zh/sw/tl/am carry no verified edition, and a reader
    // there gets nothing rather than an English row wearing a local label.
    const deliveranceIds = new Set(DELIVERANCE_BOOKS.map((b) => b.id));
    for (const lang of ['pt', 'ar', 'fa', 'id', 'ko', 'ja', 'zh', 'sw', 'tl', 'am']) {
      const resolved = resolveResources({
        topics: allDayTopics,
        languages: [lang],
        domains: FREEDOM_IN_CHRIST.resourceDomains,
        perspectiveOrder: FREEDOM_IN_CHRIST.resourcePerspectives,
      });
      expect(resolved.filter((r) => deliveranceIds.has(r.id)), lang).toEqual([]);
    }
  });

  it('offers no book about dating, marriage or family life, however well its topics match', () => {
    // What this stops: topic tags are shared with the relationship plans, so
    // 'discernment' on day 7 (discerning occult influence) matched books on
    // discerning a future spouse, and a reader renouncing a covenant was
    // offered "Boundaries in Dating" and "Who Should I Marry?". Domain scope is
    // what keeps them apart — see § domain in src/lib/resources.js.
    const relationshipsOnly = new Set(
      RESOURCES.filter((r) => !r.domains.includes('freedom')).map((r) => r.id),
    );
    expect(relationshipsOnly.size).toBeGreaterThan(0);
    const shelves = [...FREEDOM_IN_CHRIST.days.map((d) => d.resourceTopics), ...MOVEMENTS.map((m) => m.resourceTopics)];
    for (const lang of ['en', 'fr', 'de', 'es', 'pt', 'sw', 'am', 'tl', 'hi']) {
      for (const topics of shelves) {
        const resolved = resolveResources({
          topics,
          languages: [lang],
          domains: FREEDOM_IN_CHRIST.resourceDomains,
          lifeStage: FREEDOM_IN_CHRIST.lifeStage,
          perspectiveOrder: FREEDOM_IN_CHRIST.resourcePerspectives,
        });
        for (const entry of resolved) {
          expect(relationshipsOnly.has(entry.id), `${lang}: ${entry.id} on [${topics.join(',')}]`).toBe(false);
        }
      }
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
