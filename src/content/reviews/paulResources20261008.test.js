import { describe, expect, it } from 'vitest';
import { RELATIONSHIP_BOOKS } from '../resources/relationshipBooks';
import { RESOURCES } from '../resources/catalogue';
import { isResourceApprovedForDisplay, resolveResources } from '../../lib/resources';
import { PAUL_RESOURCE_SIGNOFF, CONTENT_ONLY_RESOURCE_IDS } from './paul20260903';
import { PAUL_RESOURCE_SIGNOFF_20261008, RESOURCE_APPROVALS_20261008 } from './paulResources20261008';

const book = (id) => RELATIONSHIP_BOOKS.find((entry) => entry.id === id);
const resolved = (entry) => resolveResources({
  topics: entry.topics,
  languages: Object.keys(entry.editions),
  catalogue: [entry],
});

describe('Paul’s explicit 2026-10-08 resource approval', () => {
  it('records the user instruction for exactly the five existing resources', () => {
    expect(Object.keys(RESOURCE_APPROVALS_20261008).sort()).toEqual([
      'jouvet-du-celibat-vie-couple', 'lehmann-wir-powergirls',
      'lehmann-rakete-startklar', 'trobisch-allein-leben-lernen',
      'ruthe-so-stell-ich-mir-die-liebe-vor',
    ].sort());
    expect(PAUL_RESOURCE_SIGNOFF_20261008).toMatchObject({
      status: 'approved', reviewedBy: 'Paul', reviewedAt: '2026-10-08',
      provenance: 'Explicit user instruction in the project conversation',
    });
    for (const id of Object.keys(RESOURCE_APPROVALS_20261008)) {
      expect(book(id), id).toBeDefined();
      expect(book(id).contentReview, id).toEqual(PAUL_RESOURCE_SIGNOFF_20261008);
      expect(book(id).safetyReview, id).toEqual(PAUL_RESOURCE_SIGNOFF_20261008);
    }
    expect(RESOURCE_APPROVALS_20261008['future-relationship-resource']).toBeUndefined();
    expect(book('chapman-five-love-languages').contentReview?.approvalId)
      .not.toBe(PAUL_RESOURCE_SIGNOFF_20261008.approvalId);
  });

  it('publishes the three obtainable resources through the ordinary resolver', () => {
    for (const id of ['jouvet-du-celibat-vie-couple', 'lehmann-wir-powergirls', 'lehmann-rakete-startklar']) {
      const entry = RESOURCES.find((resource) => resource.id === id);
      expect(entry.status, id).toBe('approved');
      expect(resolved(entry).map((resource) => resource.id), id).toEqual([id]);
    }
  });

  it('still refuses a sensitive title when either named sign-off is removed', () => {
    for (const id of ['lehmann-wir-powergirls', 'lehmann-rakete-startklar']) {
      const entry = book(id);
      expect(isResourceApprovedForDisplay(entry), id).toBe(true);
      expect(isResourceApprovedForDisplay({ ...entry, contentReview: null }), id).toBe(false);
      expect(isResourceApprovedForDisplay({ ...entry, safetyReview: null }), id).toBe(false);
    }
  });

  it('keeps the two unavailable editions hidden despite their new approval records', () => {
    for (const id of ['trobisch-allein-leben-lernen', 'ruthe-so-stell-ich-mir-die-liebe-vor']) {
      const entry = book(id);
      expect(entry.status, id).toBe('needs_review');
      expect(Object.values(entry.editions).every((edition) => edition.available === false), id).toBe(true);
      expect(resolved(entry), id).toEqual([]);
      // Even an accidental publication-status change cannot make an unavailable
      // edition renderable.
      expect(resolved({ ...entry, status: 'approved' }), id).toEqual([]);
    }
  });

  it('preserves earlier content-only approvals and retired publication state', () => {
    for (const id of CONTENT_ONLY_RESOURCE_IDS) {
      const entry = RESOURCES.find((resource) => resource.id === id);
      expect(entry.contentReview, id).toEqual(PAUL_RESOURCE_SIGNOFF);
      expect(entry.safetyReview, id).toEqual(PAUL_RESOURCE_SIGNOFF);
      expect(entry.status, id).toBe('needs_review');
      expect(resolved(entry), id).toEqual([]);
    }
    const retired = book('berger-mit-offenen-augen-lieben');
    expect(retired.status).toBe('retired');
    expect(resolved(retired)).toEqual([]);
  });
});
