// The "Go deeper" resolver is the gate between a curated catalogue and a real
// reader, so these tests are mostly about what must NEVER come out of it:
// unreviewed entries, unverified editions, retired links, or a language the
// reader cannot identify before opening it.
import { describe, it, expect } from 'vitest';
import {
  resolveResources, resourceLanguages, availableResourceLanguages, replacementFor, DEFAULT_RESOURCE_LIMIT,
  isResourceApprovedForDisplay, isSensitiveResource,
} from './resources.js';
import { RESOURCES, RESOURCE_TOPICS, RESOURCE_DOMAINS, LIFE_STAGES, RESOURCE_REVIEW_LEVELS, RESOURCE_STATUSES } from '../content/resources/catalogue.js';
import { RELATIONSHIP_BOOKS } from '../content/resources/relationshipBooks.js';
import preparingInPrayerDays from '../content/plans/preparingInPrayerDays.js';
import { DAYS as preparingForCovenantDays } from '../content/plans/preparingForCovenantDays.js';
import prayingForOurMarriageDays from '../content/plans/prayingForOurMarriageDays.js';

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

  it('is just the app language when no additional language was enabled', () => {
    expect(resourceLanguages('de')).toEqual(['de']);
  });
});

describe('availableResourceLanguages', () => {
  it('returns only languages backed by an approved, renderable edition', () => {
    const catalogue = [
      {
        id: 'live', status: 'approved', topics: ['marriage'],
        editions: {
          en: edition(),
          de: edition({ available: false }),
          es: edition({ lastVerifiedAt: null }),
        },
      },
      {
        id: 'draft-only-fr', status: 'draft', topics: ['marriage'],
        editions: { fr: edition() },
      },
      {
        id: 'unsigned-sensitive-ar', status: 'approved', reviewLevel: 'sensitive', topics: ['marriage'],
        editions: { ar: edition() },
      },
      {
        id: 'another-live-language', status: 'approved', topics: ['marriage'],
        editions: { zh: edition() },
      },
    ];

    expect(availableResourceLanguages(catalogue)).toEqual(['en', 'zh']);
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

  it('offers a selected additional language when the app language has no match', () => {
    const withoutAdditionalLanguage = resolveResources({
      topics: ['covenant'], lifeStage: 'single', languages: ['de'], catalogue: CATALOGUE,
    });
    expect(withoutAdditionalLanguage).toEqual([]);

    const withAdditionalLanguage = resolveResources({
      topics: ['covenant'], lifeStage: 'single', languages: ['de', 'en'], catalogue: CATALOGUE,
    });
    expect(withAdditionalLanguage.map((r) => r.id)).toEqual(['en-original']);
    // …and it is flagged, so the UI can name the language.
    expect(withAdditionalLanguage[0].isFallback).toBe(true);
    expect(withAdditionalLanguage[0].lang).toBe('en');
  });

  it('mixes in selected-language-only resources even when the app language has matches', () => {
    const out = resolveResources({
      topics: ['marriage'], lifeStage: 'single', languages: ['de', 'en'], catalogue: CATALOGUE, limit: 50,
    });
    expect(out.map((resource) => resource.lang)).toEqual(['de', 'de', 'en']);
    expect(out.map((resource) => resource.id)).toEqual([
      'de-original', 'en-with-de-edition', 'en-original',
    ]);
    expect(out.at(-1)).toMatchObject({ id: 'en-original', lang: 'en', isFallback: true });
  });

  it('returns one preferred edition per resource instead of duplicate language rows', () => {
    const out = resolveResources({
      topics: ['marriage'], lifeStage: 'single', languages: ['de', 'en'], catalogue: CATALOGUE,
    });
    const translatedWork = out.filter((resource) => resource.id === 'en-with-de-edition');
    expect(translatedWork).toHaveLength(1);
    expect(translatedWork[0]).toMatchObject({
      lang: 'de', isFallback: false, edition: { title: 'Verifizierte deutsche Ausgabe' },
    });
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

  it('returns the complete relevant set by default and honours an explicit cap', () => {
    expect(DEFAULT_RESOURCE_LIMIT).toBe(Number.POSITIVE_INFINITY);
    expect(resolve({ limit: DEFAULT_RESOURCE_LIMIT }).length).toBeGreaterThan(1);
    expect(resolve({ limit: 1 })).toHaveLength(1);
  });

  it('returns [] when nothing matches, so the caller can omit the section', () => {
    expect(resolve({ topics: ['parenting'] })).toEqual([]);
    expect(resolve({ topics: [] })).toEqual([]);
    expect(resolve({ languages: [] })).toEqual([]);
  });
});

describe('resolveResources — domain scope', () => {
  // The failure this exists to stop: topic tags are shared across every plan,
  // so a book about discerning a future spouse ('discernment') matched a
  // deliverance day about discerning occult influence ('discernment') and was
  // recommended to a reader renouncing a covenant.
  const DOMAINS = [
    {
      id: 'dating-book', type: 'book', originalLanguage: 'en', status: 'approved',
      domains: ['relationships'], topics: ['dating', 'discernment'],
      editions: { en: edition({ title: 'Choosing well' }) },
    },
    {
      id: 'freedom-book', type: 'book', originalLanguage: 'en', status: 'approved',
      domains: ['freedom'], topics: ['discernment', 'renunciation'],
      contentReview: { status: 'approved', reviewedBy: 'A reviewer', reviewedAt: '2026-08-28' },
      safetyReview: { status: 'approved', reviewedBy: 'A reviewer', reviewedAt: '2026-08-28' },
      editions: { en: edition({ title: 'Renouncing well' }) },
    },
    {
      id: 'both-book', type: 'book', originalLanguage: 'en', status: 'approved',
      domains: ['relationships', 'freedom'], topics: ['discernment'],
      editions: { en: edition({ title: 'Christian formation' }) },
    },
    {
      id: 'undeclared-book', type: 'book', originalLanguage: 'en', status: 'approved',
      topics: ['discernment'],
      editions: { en: edition({ title: 'Belongs nowhere in particular' }) },
    },
  ];
  const ids = (domains) => resolveResources({ topics: ['discernment'], domains, catalogue: DOMAINS }).map((r) => r.id);

  it('keeps a relationships title off a scoped freedom shelf, however well its topics match', () => {
    expect(ids(['freedom'])).not.toContain('dating-book');
  });

  it('keeps a freedom title off a scoped relationships shelf', () => {
    expect(ids(['relationships'])).not.toContain('freedom-book');
  });

  it('shows an entry that belongs to both on either shelf', () => {
    expect(ids(['freedom'])).toContain('both-book');
    expect(ids(['relationships'])).toContain('both-book');
  });

  it('fails closed: an entry that declares no domain is invisible to a scoped plan', () => {
    expect(ids(['freedom'])).not.toContain('undeclared-book');
    expect(ids(['relationships'])).not.toContain('undeclared-book');
  });

  it('leaves a plan that declares no domains exactly as it was', () => {
    expect(ids([]).sort()).toEqual(['both-book', 'dating-book', 'freedom-book', 'undeclared-book']);
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

  // `approved` is a promise to the curator that the entry is live. An entry the
  // resolver silently drops is a status that lies — say `needs_review` instead.
  it('marks nothing approved that the resolver would refuse to display', () => {
    for (const resource of RESOURCES) {
      if (resource.status !== 'approved') continue;
      expect(isResourceApprovedForDisplay(resource), `${resource.id} is approved but never displayable`).toBe(true);
    }
  });

  // The mirror of the test above. An entry with no status at all is dropped just
  // as silently as an unapproved one — a curator who recorded both sign-offs and
  // left the status off gets no signal that the entry never reached anyone.
  it('places every entry in at least one known domain, so nothing is stranded', () => {
    for (const entry of RESOURCES) {
      expect(entry.domains, entry.id).toBeInstanceOf(Array);
      expect(entry.domains.length, entry.id).toBeGreaterThan(0);
      for (const domain of entry.domains) expect(RESOURCE_DOMAINS, entry.id).toContain(domain);
    }
  });

  it('states an explicit publication status on every entry', () => {
    for (const resource of RESOURCES) {
      expect(RESOURCE_STATUSES, `${resource.id} has no valid status`).toContain(resource.status);
    }
  });

  it('uses unique ids and valid metadata on every entry', () => {
    expect(new Set(RESOURCES.map((resource) => resource.id)).size).toBe(RESOURCES.length);

    for (const resource of RESOURCES) {
      expect(RESOURCE_TOPICS, `${resource.id} has an unknown topic`).toEqual(
        expect.arrayContaining(resource.topics || []),
      );
      expect(LIFE_STAGES, `${resource.id} has an unknown life stage`).toEqual(
        expect.arrayContaining(resource.lifeStages || []),
      );
      expect(resource.description?.en, `${resource.id} needs an English editorial description`).toBeTruthy();
      for (const editionValue of Object.values(resource.editions || {})) {
        expect(editionValue.author, `${resource.id} needs an author`).toBeTruthy();
        expect(editionValue.publisher, `${resource.id} needs a publisher`).toBeTruthy();
      }
    }
  });

  it('ships verified recommendations in every currently covered app language', () => {
    const coveredLanguages = availableResourceLanguages();

    expect(coveredLanguages).toEqual([
      // `hi` arrived with the deliverance shelf: Derek Prince Ministries India
      // sells its own Hindi editions, which is the only Hindi publisher page
      // anyone has verified so far.
      'ar', 'de', 'en', 'es', 'fr', 'hi', 'id', 'ja', 'ko', 'pt', 'ru', 'zh',
    ]);
    // `expect.anything` without the call is a plain function, so the Indonesian
    // edition was being compared against it and this could never pass.
    expect(RESOURCES.find(({ id }) => id === 'keller-meaning-of-marriage').editions)
      .toEqual(expect.objectContaining({
        id: expect.any(Object), ko: expect.any(Object), ru: expect.any(Object),
      }));
  });

  // Locale coverage is the whole point of language selection, so the titles
  // that carry several verified editions are asserted by name: a translation
  // silently dropped in a refactor would otherwise just look like a quiet shelf.
  it('offers the widely translated titles in each language whose edition was verified', () => {
    const editionsFor = (id) => RESOURCES.find((resource) => resource.id === id)?.editions || {};
    const languagesFor = (id) => Object.keys(editionsFor(id)).sort();

    expect(languagesFor('chapman-five-love-languages')).toEqual(['ar', 'de', 'en', 'es', 'pt']);
    expect(languagesFor('chapman-five-love-languages-singles')).toEqual(['de', 'en', 'es', 'pt']);
    expect(languagesFor('chapman-things-before-married')).toEqual(['en', 'es']);
    expect(languagesFor('cloud-townsend-boundaries')).toEqual(['de', 'en']);

    // A translated edition is only useful if it is a real, resolvable one.
    for (const id of [
      'chapman-five-love-languages', 'chapman-five-love-languages-singles',
      'chapman-things-before-married', 'cloud-townsend-boundaries',
    ]) {
      for (const [language, ed] of Object.entries(editionsFor(id))) {
        expect(ed.title, `${id}.${language} needs a verified title`).toBeTruthy();
        expect(ed.publisher, `${id}.${language} needs a publisher`).toBeTruthy();
        expect(new URL(ed.url).protocol, `${id}.${language} needs an HTTPS link`).toBe('https:');
        expect(ed.lastVerifiedAt, `${id}.${language} needs a verification date`).toBeTruthy();
      }
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

describe('the relationship and family book expansion', () => {
  const dayMatches = [
    ...preparingInPrayerDays.map((day) => ({ lifeStage: 'single', topics: day.resourceTopics })),
    ...preparingForCovenantDays.map((day) => ({ lifeStage: 'engaged', topics: day.resourceTopics })),
    ...prayingForOurMarriageDays.flatMap((day) => [
      { lifeStage: 'married', topics: day.resourceTopics },
      ...(day.withChildren?.resourceTopics
        ? [{ lifeStage: 'married', topics: day.withChildren.resourceTopics }]
        : []),
    ]),
  ];

  const matchingDay = (resource) => dayMatches.find(({ lifeStage, topics = [] }) => (
    resource.lifeStages.includes(lifeStage)
      && topics.some((topic) => resource.topics.includes(topic))
  ));

  it('records a curated book from every newly requested author group', () => {
    const requestedIds = [
      'chapman-five-love-languages',
      'omartian-praying-couple',
      'cloud-townsend-boundaries',
      'parrott-saving-your-marriage',
      'todd-relationship-goals',
      'thomas-sacred-marriage',
      'feldhahn-highly-happy-marriages',
      'eggerichs-love-respect',
      'stuart-single-dating-engaged-married',
      'chan-you-and-me-forever',
      'tripp-parenting',
      'wright-before-you-say-i-do',
      'poujol-vivre-a-deux',
      'dufour-construire-mariage-epanoui',
      'jouvet-du-celibat-vie-couple',
      'karambiri-avant-dire-oui',
      'okonkwo-who-should-i-marry',
      'adewale-before-you-say-i-do',
      'emmanuel-love-is-not-enough',
      'fowowe-unbroken',
      'heward-mills-model-marriage',
      'funke-adejumo-marriage-destiny',
      'felix-adejumo-woman-in-your-house',
      'sanogo-six-sagesses-mariage',
      'lilliane-sanogo-sept-alertes',
      'castanou-vous-pensez-mariage',
      'tsengue-preparer-reussir-mariage',
    ];
    const ids = new Set(RESOURCES.map((resource) => resource.id));
    for (const id of requestedIds) expect(ids, id).toContain(id);

    // Timothy & Kathy Keller and Paul David Tripp's marriage title were already
    // present, so the expansion must not create duplicate records for them.
    expect(RESOURCES.filter((resource) => resource.id === 'keller-meaning-of-marriage')).toHaveLength(1);
    expect(RESOURCES.filter((resource) => resource.id === 'tripp-what-did-you-expect')).toHaveLength(1);
  });

  it('maps every added book to at least one relationship-plan day', () => {
    for (const resource of RELATIONSHIP_BOOKS) {
      expect(matchingDay(resource), `${resource.id} has no fitting plan day`).toBeTruthy();
    }
  });

  it('can resolve every approved added book on one of its fitting days', () => {
    for (const resource of RELATIONSHIP_BOOKS.filter(({ status }) => status === 'approved')) {
      const day = matchingDay(resource);
      const out = resolveResources({
        topics: day.topics,
        lifeStage: day.lifeStage,
        languages: [resource.originalLanguage],
        catalogue: [resource],
      });
      expect(out.map(({ id }) => id), `${resource.id} should resolve on a fitting day`).toContain(resource.id);
    }
  });

  it('places the approved books on representative single, engaged, marriage and parenting days', () => {
    const idsFor = (topics, lifeStage, languages = ['en']) => resolveResources({
      topics, lifeStage, languages, catalogue: RESOURCES, limit: 100,
    }).map(({ id }) => id);

    expect(idsFor(preparingInPrayerDays[8].resourceTopics, 'single')).toEqual(expect.arrayContaining([
      'chapman-five-love-languages-singles',
      'okonkwo-who-should-i-marry',
      'emmanuel-love-is-not-enough',
    ]));
    expect(idsFor(preparingForCovenantDays[4].resourceTopics, 'engaged')).toEqual(expect.arrayContaining([
      'chapman-things-before-married',
      'parrott-saving-your-marriage',
      'wright-before-you-say-i-do',
      'adewale-before-you-say-i-do',
    ]));
    expect(idsFor(prayingForOurMarriageDays[14].resourceTopics, 'married')).toContain('omartian-praying-couple');
    expect(idsFor(prayingForOurMarriageDays[25].withChildren.resourceTopics, 'married')).toEqual(expect.arrayContaining([
      'omartian-praying-parent',
      'tripp-parenting',
      'fowowe-out-of-box-parenting',
    ]));
    expect(idsFor(preparingInPrayerDays[8].resourceTopics, 'single', ['fr'])).toEqual(expect.arrayContaining([
      'karambiri-bien-choisir-conjoint',
      'castanou-vous-pensez-mariage',
    ]));
  });

  it('keeps the sensitive and pastorally disputed additions out of every recommendation', () => {
    for (const resource of RELATIONSHIP_BOOKS.filter(({ status }) => status !== 'approved')) {
      const day = matchingDay(resource);
      expect(resolveResources({
        topics: day.topics,
        lifeStage: day.lifeStage,
        languages: [resource.originalLanguage],
        catalogue: [resource],
      }), resource.id).toEqual([]);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// A language Settings offers must be able to REACH a reader.
//
// The stored list is a priority order and each work is offered once, in the
// first enabled language with a verified edition. English is preselected for
// everyone and nearly every catalogue work has an English edition, so while a
// newly ticked language was appended after it, eight of the eleven offerable
// languages could never surface a single row: ticking Japanese, Portuguese,
// Russian, Arabic, Hindi, Indonesian, Korean or Chinese changed nothing the
// reader could see. These tests pin the outcome, not the mechanism.
// ─────────────────────────────────────────────────────────────────────────────
describe('an offered resource language can actually surface a resource', () => {
  const everyTopic = [...RESOURCE_TOPICS];

  it('returns at least one edition in each offered language when it leads the order', () => {
    for (const lang of availableResourceLanguages()) {
      const rows = resolveResources({ topics: everyTopic, languages: [lang] });
      expect(rows.length, lang).toBeGreaterThan(0);
      expect(rows.some((r) => r.lang === lang), lang).toBe(true);
    }
  });

  it('honours a reader who ranks a language ahead of English', () => {
    for (const lang of availableResourceLanguages()) {
      if (lang === 'en') continue;
      // The reader's app language has no catalogue coverage of its own (am), so
      // what they see is decided purely by the additional languages they chose.
      const chosenFirst = resolveResources({
        topics: everyTopic, languages: resourceLanguages('am', [lang, 'en']),
      });
      expect(chosenFirst.some((r) => r.lang === lang), lang).toBe(true);
    }
  });

  it('still falls back to a later language for a work the first one does not publish', () => {
    // Ranking German first must not hide the English-only titles behind it.
    const rows = resolveResources({ topics: everyTopic, languages: resourceLanguages('am', ['de', 'en']) });
    expect(rows.some((r) => r.lang === 'de')).toBe(true);
    expect(rows.some((r) => r.lang === 'en')).toBe(true);
  });
});
