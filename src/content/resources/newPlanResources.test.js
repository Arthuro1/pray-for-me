// Resource candidates for the plans drafted 2026-09-23. What this file proves:
// nothing here can reach a reader before a human approves it; every entry is
// well-formed and verified on a real page; each one would land on a day of the
// plan it was researched for — and only on plans of its own family — once it
// IS approved.
import { describe, expect, it } from 'vitest';
import { NEW_PLAN_RESOURCES, mergeCandidates } from './newPlanResources.js';
import { RESOURCES } from './catalogue.js';
import {
  LIFE_STAGES, RESOURCE_DOMAINS, RESOURCE_PERSPECTIVES, RESOURCE_TOPICS, RESOURCE_TYPES,
} from './topics.js';
import { isResourceApprovedForDisplay, isSensitiveResource, resolveResources } from '../../lib/resources.js';
import { PLANS } from '../prayerPlans.js';
import { NEW_PLAN_IDS } from '../reviews/pendingPlans20260923.js';
import { LANG_CODES } from '../../i18n.js';

const TODAY = new Date().toISOString().slice(0, 10);
const RETAILERS = /amazon\.|christianbook\.|fnac\.|thalia\.|bol\.com|ebay\.|audible\./i;
const DELIVERANCE_TOPICS = ['deliverance', 'spiritual-warfare', 'renunciation', 'covenants', 'curses', 'altars', 'occult', 'secret-societies', 'dedications', 'family-line', 'generational-patterns', 'strongholds'];
const CHILDREN_TAGS = ['children', 'parenting', 'family-discipleship'];

// What an entry WOULD do once a human signed it — used only to test where its
// topics and domains would land, never shipped. An out-of-print edition is
// recorded for curators (and never rendered), so stock is set aside here too.
const asIfApproved = (entry) => {
  const signoff = { status: 'approved', reviewedBy: 'simulation', reviewedAt: '2026-09-28' };
  const editions = Object.fromEntries(Object.entries(entry.editions).map(([lang, edition]) => [lang, { ...edition, available: true }]));
  return { ...entry, editions, status: 'approved', contentReview: signoff, safetyReview: signoff };
};
const newPlans = PLANS.filter((plan) => NEW_PLAN_IDS.includes(plan.id));
const daysReached = (entry, plan) => plan.days
  .map((day, i) => (resolveResources({
    topics: day.resourceTopics, domains: plan.resourceDomains, languages: LANG_CODES, catalogue: [asIfApproved(entry)],
  }).length ? i + 1 : null))
  .filter(Boolean);

describe('resource candidates for the new plans', () => {
  it('exist and ship once each in the shared catalogue', () => {
    expect(NEW_PLAN_RESOURCES.length).toBeGreaterThan(0);
    const ids = RESOURCES.map((entry) => entry.id);
    for (const entry of NEW_PLAN_RESOURCES) {
      expect(ids.filter((id) => id === entry.id), entry.id).toHaveLength(1);
    }
  });

  it('can never reach a reader: needs_review, no sign-off, not displayable', () => {
    for (const entry of NEW_PLAN_RESOURCES) {
      expect(entry.status, entry.id).toBe('needs_review');
      expect(entry.contentReview, entry.id).toBeUndefined();
      expect(entry.safetyReview, entry.id).toBeUndefined();
      expect(isResourceApprovedForDisplay(entry), entry.id).toBe(false);
    }
  });

  it('use only known ids for type, topics, domains, perspectives and life stages', () => {
    for (const entry of NEW_PLAN_RESOURCES) {
      expect(entry.id, entry.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(RESOURCE_TYPES, entry.id).toContain(entry.type);
      expect(entry.topics.length, entry.id).toBeGreaterThan(0);
      for (const topic of entry.topics) expect(RESOURCE_TOPICS, entry.id).toContain(topic);
      expect(entry.domains.length, entry.id).toBeGreaterThan(0);
      for (const domain of entry.domains) expect(RESOURCE_DOMAINS, entry.id).toContain(domain);
      for (const perspective of entry.perspective || []) expect(RESOURCE_PERSPECTIVES, entry.id).toContain(perspective);
      for (const stage of entry.lifeStages || []) expect(LIFE_STAGES, entry.id).toContain(stage);
      if (entry.reviewLevel != null) expect(['standard', 'sensitive'], entry.id).toContain(entry.reviewLevel);
    }
  });

  it('describe themselves in our own words, in English and French', () => {
    for (const entry of NEW_PLAN_RESOURCES) {
      expect(entry.description?.en?.length, entry.id).toBeGreaterThan(20);
      expect(entry.description?.fr?.length, entry.id).toBeGreaterThan(20);
    }
  });

  it('record only editions someone opened: canonical https page, real date, no retailer', () => {
    for (const entry of NEW_PLAN_RESOURCES) {
      const editions = Object.entries(entry.editions || {});
      expect(editions.length, entry.id).toBeGreaterThan(0);
      for (const [lang, edition] of editions) {
        const at = `${entry.id}/${lang}`;
        expect(LANG_CODES, at).toContain(lang);
        for (const field of ['title', 'author', 'publisher']) expect(edition[field]?.trim().length, `${at} ${field}`).toBeGreaterThan(0);
        expect(new URL(edition.url).protocol, at).toBe('https:');
        expect(edition.url, at).not.toMatch(RETAILERS);
        expect(edition.lastVerifiedAt, at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(edition.lastVerifiedAt >= '2026-09-23' && edition.lastVerifiedAt <= TODAY, at).toBe(true);
      }
    }
  });

  it('belong only to the families of plans they were researched for', () => {
    const newDomains = new Set(newPlans.flatMap((plan) => plan.resourceDomains));
    for (const entry of NEW_PLAN_RESOURCES) {
      for (const domain of entry.domains) expect(newDomains.has(domain), `${entry.id} → ${domain}`).toBe(true);
      expect(entry.domains, entry.id).not.toContain('freedom');
    }
  });

  it('would each reach at least one day of a new plan once approved', () => {
    const orphans = NEW_PLAN_RESOURCES
      .filter((entry) => !newPlans.some((plan) => daysReached(entry, plan).length))
      .map((entry) => `${entry.id} [${entry.domains}] ${entry.topics}`);
    expect(orphans).toEqual([]);
  });

  // Church hurt and spiritual abuse are safeguarding subjects, and a reader
  // recovering from an abusive church must never be handed deliverance material.
  it('keep the care shelf sensitive and free of deliverance topics', () => {
    for (const entry of NEW_PLAN_RESOURCES.filter(({ domains }) => domains.includes('care'))) {
      expect(isSensitiveResource(entry), entry.id).toBe(true);
    }
    for (const entry of NEW_PLAN_RESOURCES) {
      for (const topic of DELIVERANCE_TOPICS) expect(entry.topics, entry.id).not.toContain(topic);
    }
  });

  it('put only children-tagged material on the children plan', () => {
    const plan = newPlans.find(({ id }) => id === 'children21');
    for (const entry of NEW_PLAN_RESOURCES.filter((candidate) => daysReached(candidate, plan).length)) {
      expect(entry.topics.some((topic) => CHILDREN_TAGS.includes(topic)), entry.id).toBe(true);
    }
  });

  // The seven "Growing in Christ" plans share one shelf, so a men's book must
  // not surface on the women's plan (or the reverse) through a shared tag.
  it('keep men’s and women’s material on their own plan', () => {
    const man = newPlans.find(({ id }) => id === 'manOfGod21');
    const woman = newPlans.find(({ id }) => id === 'womanOfGod21');
    for (const entry of NEW_PLAN_RESOURCES) {
      if (entry.topics.includes('manhood') && !entry.topics.includes('womanhood')) {
        expect(daysReached(entry, woman), entry.id).toEqual([]);
      }
      if (entry.topics.includes('womanhood') && !entry.topics.includes('manhood')) {
        expect(daysReached(entry, man), entry.id).toEqual([]);
      }
    }
  });

  // unborn21 days 16, 20 and 21 may be read after a loss: a cheerful
  // week-by-week pregnancy devotional must never be what greets that reader.
  it('keep plain pregnancy devotionals off the days that may follow a loss', () => {
    const plan = newPlans.find(({ id }) => id === 'unborn21');
    const CARE = ['miscarriage', 'grief', 'lament', 'mental-health', 'fear', 'suffering', 'intercession'];
    for (const entry of NEW_PLAN_RESOURCES) {
      const lossDays = daysReached(entry, plan).filter((day) => [16, 20, 21].includes(day));
      if (lossDays.length) expect(entry.topics.some((topic) => CARE.includes(topic)), `${entry.id} on day ${lossDays}`).toBe(true);
    }
  });

  // prodigal30 (intercession) and unbelievers30 (mission) share generic tags;
  // separate domains keep world-mission guides off a wandering child's plan.
  it('keep the prodigal and unbelievers shelves apart', () => {
    const prodigal = newPlans.find(({ id }) => id === 'prodigal30');
    const unbelievers = newPlans.find(({ id }) => id === 'unbelievers30');
    for (const entry of NEW_PLAN_RESOURCES) {
      if (entry.domains.includes('mission') && !entry.domains.includes('intercession')) {
        expect(daysReached(entry, prodigal), entry.id).toEqual([]);
      }
      if (entry.domains.includes('intercession') && !entry.domains.includes('mission')) {
        expect(daysReached(entry, unbelievers), entry.id).toEqual([]);
      }
    }
  });
});

describe('mergeCandidates', () => {
  const base = {
    id: 'same-work', type: 'book', topics: ['prayer'], domains: ['intercession'], lifeStages: [],
    status: 'approved', description: { en: 'first', fr: 'premier' },
    editions: { en: { title: 'A', url: 'https://example.org/a' } },
  };

  it('turns the same work found twice into one pending entry', () => {
    const merged = mergeCandidates([[base], [{
      ...base, topics: ['lament'], domains: ['mission'], reviewLevel: 'sensitive',
      description: { en: 'second', fr: 'second' }, editions: { fr: { title: 'B', url: 'https://example.org/b' } },
      contentReview: { status: 'approved', reviewedBy: 'x', reviewedAt: '2026-09-28' },
    }]]);
    expect(merged).toHaveLength(1);
    const [entry] = merged;
    expect(entry.domains).toEqual(['intercession', 'mission']);
    expect(entry.topics).toEqual(['prayer', 'lament']);
    expect(entry.reviewLevel).toBe('sensitive');
    expect(entry.description.en).toBe('first');
    expect(Object.keys(entry.editions).sort()).toEqual(['en', 'fr']);
    expect(entry.status).toBe('needs_review');
    expect(entry.contentReview).toBeUndefined();
  });

  it('never narrows an entry meant for every life stage', () => {
    const [entry] = mergeCandidates([[{ ...base, lifeStages: ['married'] }], [{ ...base, lifeStages: [] }]]);
    expect(entry.lifeStages).toEqual([]);
  });
});
