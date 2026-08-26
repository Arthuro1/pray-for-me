// The "Go deeper" resolver is the gate between a curated catalogue and a real
// reader, so these tests are mostly about what must NEVER come out of it:
// unreviewed entries, unverified editions, retired links, or a language the
// reader never said they could read.
import { describe, it, expect } from 'vitest';
import {
  resolveResources, resourceLanguages, replacementFor, DEFAULT_RESOURCE_LIMIT,
  isResourceApprovedForDisplay, isSensitiveResource,
} from './resources.js';
import { RESOURCES, RESOURCE_TOPICS, LIFE_STAGES, RESOURCE_REVIEW_LEVELS } from '../content/resources/catalogue.js';

const edition = (over = {}) => ({
  title: 'A title', author: 'An author', url: 'https://example.org', available: true,
  lastVerifiedAt: '2026-08-01', ...over,
});

// A fixture catalogue, so these tests never depend on what is actually shipped.
const CATALOGUE = [
  {
    id: 'en-original', type: 'book', originalLanguage: 'en', status: 'approved',
    topics: ['marriage', 'covenant'], lifeStages: ['single', 'engaged', 'married'],
    description: { en: 'why', fr: 'pourquoi' },
    editions: { en: edition({ title: 'English original' }) },
  },
  {
    id: 'de-original', type: 'article', originalLanguage: 'de', status: 'approved',
    topics: ['marriage'], lifeStages: ['single'],
    editions: { de: edition({ title: 'Deutsches Original' }) },
  },
  {
    id: 'en-with-de-edition', type: 'book', originalLanguage: 'en', status: 'approved',
    topics: ['marriage'], lifeStages: ['single'],
    editions: {
      en: edition({ title: 'English source' }),
      de: edition({ title: 'Verifizierte deutsche Ausgabe' }),
    },
  },
  {
    id: 'unverified-de', type: 'book', originalLanguage: 'en', status: 'approved',
    topics: ['marriage'], lifeStages: ['single'],
    // A German edition nobody has checked — must never be offered.
    editions: { de: edition({ title: 'Ungeprüft', lastVerifiedAt: null }) },
  },
  {
    id: 'draft-entry', type: 'book', originalLanguage: 'en', status: 'draft',
    topics: ['marriage'], lifeStages: ['single'],
    editions: { en: edition({ title: 'Draft' }) },
  },
  {
    id: 'needs-review-entry', type: 'book', originalLanguage: 'en', status: 'needs_review',
    topics: ['marriage'], lifeStages: ['single'],
    editions: { en: edition({ title: 'Awaiting review' }) },
  },
  {
    id: 'retired-entry', type: 'book', originalLanguage: 'en', status: 'retired',
    topics: ['marriage'], lifeStages: ['single'], replacementResourceId: 'en-original',
    editions: { en: edition({ title: 'Retired' }) },
  },
  {
    id: 'married-only', type: 'book', originalLanguage: 'en', status: 'approved',
    topics: ['marriage'], lifeStages: ['married'],
    editions: { en: edition({ title: 'For married couples' }) },
  },
  {
    id: 'off-topic', type: 'book', originalLanguage: 'en', status: 'approved',
    topics: ['finances'], lifeStages: ['single'],
    editions: { en: edition({ title: 'Off topic' }) },
  },
  {
    id: 'unavailable', type: 'book', originalLanguage: 'en', status: 'approved',
    topics: ['marriage'], lifeStages: ['single'],
    editions: { en: edition({ title: 'Out of print', available: false }) },
  },
];

const resolve = (over = {}) => resolveResources({
  topics: ['marriage'], lifeStage: 'single', languages: ['en'], catalogue: CATALOGUE, ...over,
});

describe('resourceLanguages', () => {
  it('puts the app language first and de-duplicates', () => {
    expect(resourceLanguages('de', ['en', 'de'])).toEqual(['de', 'en']);
  });

  it('is just the app language when no fallback was enabled', () => {
    expect(resourceLanguages('de')).toEqual(['de']);
  });
});

describe('resolveResources — review gate', () => {
  it('renders approved entries', () => {
    expect(resolve().map((r) => r.id)).toContain('en-original');
  });

  it('never renders draft, needs_review or retired entries', () => {
    const ids = resolve({ limit: 50 }).map((r) => r.id);
    expect(ids).not.toContain('draft-entry');
    expect(ids).not.toContain('needs-review-entry');
    expect(ids).not.toContain('retired-entry');
  });

  it('never renders an edition that has not been verified', () => {
    const ids = resolveResources({
      topics: ['marriage'], lifeStage: 'single', languages: ['de'], catalogue: CATALOGUE, limit: 50,
    }).map((r) => r.id);
    expect(ids).not.toContain('unverified-de');
  });

  it('never renders an edition marked unavailable', () => {
    expect(resolve({ limit: 50 }).map((r) => r.id)).not.toContain('unavailable');
  });

  it('requires a usable HTTPS URL as part of edition verification', () => {
    const invalidEditions = ['', 'http://example.org/resource', 'not a url'].map((url, i) => ({
      id: `bad-edition-${i}`, type: 'article', originalLanguage: 'en', status: 'approved',
      topics: ['marriage'], lifeStages: ['married'], editions: { en: edition({ url }) },
    }));
    expect(resolveResources({
      topics: ['marriage'], lifeStage: 'married', languages: ['en'], catalogue: invalidEditions,
    })).toEqual([]);
  });

  it('rejects malformed verification dates rather than treating them as review evidence', () => {
    const catalogue = [{
      id: 'impossible-date', type: 'article', originalLanguage: 'en', status: 'approved',
      topics: ['marriage'], lifeStages: ['married'],
      editions: { en: edition({ lastVerifiedAt: '2026-02-31' }) },
    }];
    expect(resolveResources({
      topics: ['marriage'], lifeStage: 'married', languages: ['en'], catalogue,
    })).toEqual([]);
  });

  it('requires explicit content AND safety sign-off for sensitive resources', () => {
    const signoff = { status: 'approved', reviewedBy: 'reviewer-id', reviewedAt: '2026-08-26' };
    const base = {
      id: 'sensitive', type: 'article', originalLanguage: 'en', status: 'approved',
      reviewLevel: 'sensitive', topics: ['marriage'], lifeStages: ['married'],
      editions: { en: edition() },
    };
    const catalogue = [
      base,
      { ...base, id: 'content-only', contentReview: signoff },
      { ...base, id: 'fully-reviewed', contentReview: signoff, safetyReview: signoff },
    ];
    const ids = resolveResources({
      topics: ['marriage'], lifeStage: 'married', languages: ['en'], catalogue, limit: 10,
    }).map((r) => r.id);
    expect(ids).toEqual(['fully-reviewed']);
  });

  it('cannot lower a sensitive topic to standard review', () => {
    const resource = {
      id: 'unsafe-override', type: 'article', originalLanguage: 'en', status: 'approved',
      reviewLevel: 'standard', topics: ['abuse-safety'], lifeStages: ['married'],
      editions: { en: edition() },
    };
    expect(isSensitiveResource(resource)).toBe(true);
    expect(isResourceApprovedForDisplay(resource)).toBe(false);
    expect(resolveResources({
      topics: ['abuse-safety'], lifeStage: 'married', languages: ['en'], catalogue: [resource],
    })).toEqual([]);
  });
});

describe('resolveResources — language priority', () => {
  it('prefers a resource written IN the reader’s language over a translated one', () => {
    const out = resolveResources({
      topics: ['marriage'], lifeStage: 'single', languages: ['de'], catalogue: CATALOGUE, limit: 5,
    });
    expect(out[0].id).toBe('de-original');
    expect(out[0].lang).toBe('de');
  });

  it('resolves a verified translated edition in the reader’s language', () => {
    const out = resolveResources({
      topics: ['marriage'], lifeStage: 'single', languages: ['de'], catalogue: CATALOGUE, limit: 5,
    });
    const translated = out.find((r) => r.id === 'en-with-de-edition');
    expect(translated).toBeTruthy();
    expect(translated.edition.title).toBe('Verifizierte deutsche Ausgabe');
    expect(translated.isFallback).toBe(false);
  });

  it('never invents a title for a language with no verified edition', () => {
    const out = resolveResources({
      topics: ['marriage'], lifeStage: 'single', languages: ['de'], catalogue: CATALOGUE, limit: 50,
    });
    // 'en-original' has no German edition, so it must simply be absent —
    // never present with a machine-translated title.
    expect(out.map((r) => r.id)).not.toContain('en-original');
  });

  it('offers a fallback language ONLY when the reader enabled it', () => {
    const withoutFallback = resolveResources({
      topics: ['covenant'], lifeStage: 'single', languages: ['de'], catalogue: CATALOGUE,
    });
    expect(withoutFallback).toEqual([]);

    const withFallback = resolveResources({
      topics: ['covenant'], lifeStage: 'single', languages: ['de', 'en'], catalogue: CATALOGUE,
    });
    expect(withFallback.map((r) => r.id)).toEqual(['en-original']);
    // …and it is flagged, so the UI can name the language.
    expect(withFallback[0].isFallback).toBe(true);
    expect(withFallback[0].lang).toBe('en');
  });
});

describe('resolveResources — relevance and caps', () => {
  it('drops entries whose topics do not overlap the day', () => {
    expect(resolve({ limit: 50 }).map((r) => r.id)).not.toContain('off-topic');
  });

  it('drops entries that do not fit the life stage', () => {
    expect(resolve({ limit: 50 }).map((r) => r.id)).not.toContain('married-only');
  });

  it('filters engaged and married recommendations by their stable life-stage ids', () => {
    const engaged = resolveResources({
      topics: ['marriage'], lifeStage: 'engaged', languages: ['en'], catalogue: CATALOGUE, limit: 50,
    }).map((r) => r.id);
    const married = resolveResources({
      topics: ['marriage'], lifeStage: 'married', languages: ['en'], catalogue: CATALOGUE, limit: 50,
    }).map((r) => r.id);
    expect(engaged).toContain('en-original');
    expect(engaged).not.toContain('married-only');
    expect(married).toContain('en-original');
    expect(married).toContain('married-only');
  });

  it('growth-area boosts only re-rank; they never pull in an off-topic entry', () => {
    const out = resolve({ boostTopics: ['finances'], limit: 50 });
    expect(out.map((r) => r.id)).not.toContain('off-topic');
  });

  it('caps the list — a day offers a few resources, not a library', () => {
    expect(DEFAULT_RESOURCE_LIMIT).toBeLessThanOrEqual(3);
    expect(resolve({ limit: 1 })).toHaveLength(1);
  });

  it('returns [] when nothing matches, so the caller can omit the section', () => {
    expect(resolve({ topics: ['parenting'] })).toEqual([]);
    expect(resolve({ topics: [] })).toEqual([]);
    expect(resolve({ languages: [] })).toEqual([]);
  });
});

describe('replacementFor', () => {
  it('follows a retired entry to its approved successor', () => {
    const retired = CATALOGUE.find((r) => r.id === 'retired-entry');
    expect(replacementFor(retired, CATALOGUE)?.id).toBe('en-original');
  });

  it('is null when there is no successor', () => {
    expect(replacementFor(CATALOGUE[0], CATALOGUE)).toBeNull();
  });

  it('cannot bypass sensitive review through a retired replacement', () => {
    const retired = { status: 'retired', replacementResourceId: 'sensitive-successor' };
    const successor = {
      id: 'sensitive-successor', type: 'article', originalLanguage: 'en', status: 'approved',
      topics: ['marriage-crisis'], editions: { en: edition() },
    };
    expect(replacementFor(retired, [successor])).toBeNull();
  });
});

// Nothing reaches a reader until a human has verified it. These assertions are
// what keep that promise honest in code for the content that actually ships.
describe('the shipped catalogue', () => {
  const renderableEditions = (resource) => (resource.status === 'approved'
    ? Object.values(resource.editions || {}).filter((e) => e.available !== false && e.lastVerifiedAt)
    : []);

  it('shows a reader nothing that has not been reviewed AND verified', () => {
    for (const resource of RESOURCES) {
      if (resource.status === 'approved') continue;
      // An unreviewed entry may sit here as curation work in progress, but the
      // resolver must never surface it, whatever its editions say.
      expect(resolveResources({
        topics: resource.topics || [], languages: Object.keys(resource.editions || {}),
        catalogue: [resource], limit: 50,
      })).toEqual([]);
    }
  });

  it('gives every approved edition somewhere to go', () => {
    for (const resource of RESOURCES) {
      for (const ed of renderableEditions(resource)) {
        expect(ed.title).toBeTruthy();
        expect(ed.url).toBeTruthy();
      }
    }
  });

  it('carries no unverified URL on any edition', () => {
    for (const resource of RESOURCES) {
      for (const ed of Object.values(resource.editions || {})) {
        if (ed.url) expect(ed.lastVerifiedAt).toBeTruthy();
      }
    }
  });

  it('uses canonical publisher or ministry pages instead of retailer links', () => {
    for (const resource of RESOURCES) {
      for (const editionValue of Object.values(resource.editions || {})) {
        if (!editionValue.url) continue;
        const host = new URL(editionValue.url).hostname;
        expect(host, `${resource.id} should not use a retailer URL`).not.toMatch(/(^|\.)amazon\./i);
      }
    }
  });

  it('publishes no sensitive entry without explicit content and safety sign-off', () => {
    for (const resource of RESOURCES) {
      if (!isSensitiveResource(resource) || resource.status !== 'approved') continue;
      expect(isResourceApprovedForDisplay(resource), resource.id).toBe(true);
    }
  });

  it('uses the shared relationships taxonomy and stable life-stage ids', () => {
    expect(LIFE_STAGES).toEqual(expect.arrayContaining(['single', 'dating', 'engaged', 'married']));
    expect(new Set(LIFE_STAGES).size).toBe(LIFE_STAGES.length);
    expect(RESOURCE_REVIEW_LEVELS).toEqual(['standard', 'sensitive']);
    expect(new Set(RESOURCE_TOPICS).size).toBe(RESOURCE_TOPICS.length);
    expect(RESOURCE_TOPICS).toEqual(expect.arrayContaining([
      'premarital', 'marriage', 'covenant', 'communication', 'listening',
      'conflict', 'forgiveness', 'trust', 'sexual-intimacy', 'finances',
      'family-of-origin', 'boundaries', 'friendship', 'spiritual-rhythms',
      'prayer-together', 'children', 'parenting', 'hospitality', 'suffering',
      'grief', 'infertility', 'marriage-crisis', 'abuse-safety', 'generosity', 'mission',
    ]));
  });
});
