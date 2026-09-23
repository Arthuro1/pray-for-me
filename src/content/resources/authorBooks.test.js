// The books requested by author on 2026-09-23. What this file proves: every
// book either reaches a day of a current plan or waits on a shelf no current
// plan reads, approval comes only from the closed review record, and every
// approved book can actually be shown.
import { describe, it, expect } from 'vitest';
import { AUTHOR_BOOKS } from './authorBooks.js';
import { RESOURCES } from './catalogue.js';
import { RESOURCE_DOMAINS, RESOURCE_PERSPECTIVES } from './topics.js';
import { resolveResources, isResourceApprovedForDisplay } from '../../lib/resources.js';
import { AUTHOR_BOOKS_SIGNOFF, AUTHOR_BOOKS_APPROVED_IDS } from '../reviews/paulAuthorBooks20260923.js';
import { PLANS } from '../prayerPlans.js';
import { LANG_CODES } from '../../i18n.js';

// Every shelf a plan can open: a day, a day's with-children variant, or a
// movement, each with its plan's domains and life stage.
const shelves = PLANS.flatMap((plan) => [
  ...plan.days,
  ...plan.days.map((day) => day.withChildren).filter(Boolean),
  ...(plan.movements || []),
].filter((shelf) => shelf.resourceTopics?.length).map((shelf) => ({
  plan: plan.id,
  topics: shelf.resourceTopics,
  domains: plan.resourceDomains || [],
  lifeStage: plan.lifeStage || null,
})));

const fits = (book, shelf) => (!shelf.domains.length || shelf.domains.some((domain) => book.domains.includes(domain)))
  && (!shelf.lifeStage || !book.lifeStages.length || book.lifeStages.includes(shelf.lifeStage))
  && shelf.topics.some((topic) => book.topics.includes(topic));

// Held for a plan still being written: on the christian-living shelf, or on a
// shelf whose current days ask for none of its subjects. What this leaves out
// is the real mistake — a book tagged for a current day that its life stages
// keep it from ever reaching.
const waitsForAPlan = (book) => book.domains.includes('christian-living')
  || !shelves.some((shelf) => shelf.domains.some((domain) => book.domains.includes(domain))
    && shelf.topics.some((topic) => book.topics.includes(topic)));

const renderable = (edition) => edition.available !== false && Boolean(edition.url) && Boolean(edition.lastVerifiedAt);
const authorsOf = (book) => Object.values(book.editions).map((edition) => edition.author);

describe('the requested authors', () => {
  it('are each represented', () => {
    const authors = AUTHOR_BOOKS.flatMap(authorsOf).join(' | ');
    for (const name of ['Myles Munroe', 'Nicky and Sila Lee', 'Mohammed Sanogo', 'Lilliane Sanogo', 'Zac Poonen', 'Annie Poonen', 'Reinhold Ruthe']) {
      expect(authors, name).toContain(name);
    }
  });

  it('ship once each in the shared catalogue, on the shelves they name', () => {
    for (const book of AUTHOR_BOOKS) {
      const shipped = RESOURCES.filter((entry) => entry.id === book.id);
      expect(shipped, book.id).toHaveLength(1);
      expect(shipped[0].domains, book.id).toEqual(book.domains);
      expect(book.domains.length, book.id).toBeGreaterThan(0);
      for (const domain of book.domains) expect(RESOURCE_DOMAINS, book.id).toContain(domain);
      for (const perspective of book.perspective || []) expect(RESOURCE_PERSPECTIVES, book.id).toContain(perspective);
    }
  });
});

describe('where they land', () => {
  it('reach a day of a current plan, or wait for a plan being written', () => {
    for (const book of AUTHOR_BOOKS) {
      const onADay = shelves.some((shelf) => fits(book, shelf));
      expect(onADay || waitsForAPlan(book), `${book.id} can never reach a day`).toBe(true);
    }
  });

  it('keep the christian-living shelf away from every current plan', () => {
    for (const plan of PLANS) expect(plan.resourceDomains || [], plan.id).not.toContain('christian-living');
    for (const book of AUTHOR_BOOKS.filter(({ domains }) => domains.includes('christian-living'))) {
      expect(book.domains, book.id).toEqual(['christian-living']);
      for (const shelf of shelves.filter(({ domains }) => domains.length)) {
        expect(fits(book, shelf), `${book.id} on ${shelf.plan}`).toBe(false);
      }
    }
  });

  it('are live on a fitting day of a current plan when approved', () => {
    for (const book of AUTHOR_BOOKS.filter(({ status }) => status === 'approved')) {
      const shelf = shelves.find((candidate) => fits(book, candidate));
      if (!shelf) continue;
      const rows = resolveResources({
        topics: shelf.topics,
        domains: shelf.domains,
        lifeStage: shelf.lifeStage,
        languages: LANG_CODES,
        catalogue: [book],
      });
      expect(rows.map(({ id }) => id), `${book.id} on ${shelf.plan}`).toEqual([book.id]);
    }
  });

  it('offer Freedom readers an African Pentecostal title before the others, in French', () => {
    const day = PLANS.find(({ id }) => id === 'freedom30').days[29];
    const rows = resolveResources({
      topics: day.resourceTopics,
      domains: ['freedom'],
      languages: ['fr'],
      perspectiveOrder: ['african-pentecostal', 'pentecostal', 'charismatic', 'evangelical'],
      catalogue: AUTHOR_BOOKS,
    });
    expect(rows.length).toBeGreaterThan(1);
    expect(rows[0].perspective).toContain('african-pentecostal');
  });
});

describe('approval', () => {
  const approved = new Set(AUTHOR_BOOKS_APPROVED_IDS);

  it('comes only from the closed review record, with both named reviews', () => {
    expect(approved.size).toBe(AUTHOR_BOOKS_APPROVED_IDS.length);
    for (const book of AUTHOR_BOOKS) {
      if (approved.has(book.id)) {
        expect(book.status, book.id).toBe('approved');
        expect(book.contentReview, book.id).toEqual(AUTHOR_BOOKS_SIGNOFF);
        expect(book.safetyReview, book.id).toEqual(AUTHOR_BOOKS_SIGNOFF);
        expect(isResourceApprovedForDisplay(book), book.id).toBe(true);
      } else {
        expect(book.status, book.id).toBe('needs_review');
        expect(book.contentReview, book.id).toBeUndefined();
        expect(book.safetyReview, book.id).toBeUndefined();
      }
    }
  });

  it('names no id that is not in the collection', () => {
    const ids = new Set(AUTHOR_BOOKS.map(({ id }) => id));
    for (const id of AUTHOR_BOOKS_APPROVED_IDS) expect(ids, id).toContain(id);
  });

  it('covers every book presented on 2026-09-23', () => {
    for (const book of AUTHOR_BOOKS) expect(approved, book.id).toContain(book.id);
  });

  it('means something a reader can open: every approved book has a live edition', () => {
    for (const book of AUTHOR_BOOKS.filter(({ status }) => status === 'approved')) {
      expect(Object.values(book.editions).some(renderable), book.id).toBe(true);
    }
  });
});

describe('the editions', () => {
  it('link only verified publisher or ministry pages, in languages the app ships', () => {
    for (const book of AUTHOR_BOOKS) {
      const urls = [];
      for (const [lang, edition] of Object.entries(book.editions)) {
        expect(LANG_CODES, `${book.id} / ${lang}`).toContain(lang);
        expect(edition.title && edition.author && edition.publisher, `${book.id} / ${lang}`).toBeTruthy();
        if (!edition.url) {
          expect(edition.lastVerifiedAt, `${book.id} / ${lang}`).toBeUndefined();
          continue;
        }
        const url = new URL(edition.url);
        expect(url.protocol, `${book.id} / ${lang}`).toBe('https:');
        expect(url.hostname, `${book.id} / ${lang}`).not.toMatch(/(^|\.)amazon\./i);
        expect(edition.lastVerifiedAt, `${book.id} / ${lang}`).toBe('2026-09-23');
        urls.push(edition.url);
      }
      // Two languages sharing a link would mean one of them is not a real edition.
      expect(new Set(urls).size, book.id).toBe(urls.length);
    }
  });

  it('describe every book in English and French', () => {
    for (const book of AUTHOR_BOOKS) {
      expect(book.description.en, book.id).toBeTruthy();
      expect(book.description.fr, book.id).toBeTruthy();
    }
  });
});
