import { describe, expect, it } from 'vitest';
import { planQualityRecordErrors, syncPlanQualityRecords } from '../../scripts/content-quality/planQualityAudit.mjs';
import { RECORD_STATUSES, reviewProblems } from '../lib/planQuality';

const HASH = (c) => c.repeat(64);
const current = { contentVersion: 1, overlayHash: HASH('a'), sourceHash: HASH('b') };
const quality = {
  pairs: [{ planId: 'plan1', lang: 'de' }, { planId: 'plan1', lang: 'es' }],
  fingerprintOf: () => current,
  reviewProblems,
  statuses: RECORD_STATUSES,
};
const legacy = { status: 'legacy-owner-approved', ...current, since: '2026-10-12', basis: 'owner sign-off', note: 'not a native review' };

describe('plan-quality records in check:content', () => {
  it('creates needs-review records and never grants a status', () => {
    expect(syncPlanQualityRecords(quality, {})).toEqual({
      'de/plan1': { status: 'needs-review', ...current },
      'es/plan1': { status: 'needs-review', ...current },
    });
  });

  it('keeps a record that still matches its overlay, and resets one that does not', () => {
    const records = { 'de/plan1': legacy, 'es/plan1': { ...legacy, overlayHash: HASH('c') } };
    const synced = syncPlanQualityRecords(quality, records);
    expect(synced['de/plan1']).toBe(legacy);
    expect(synced['es/plan1']).toEqual({ status: 'needs-review', ...current });
  });

  it('reports stale, unknown, missing and incomplete records', () => {
    const errors = planQualityRecordErrors(quality, {
      'de/plan1': { ...legacy, overlayHash: HASH('c') },
      'xx/plan9': legacy,
    }).join('\n');
    expect(errors).toMatch(/Stale plan-quality record: de\/plan1/);
    expect(errors).toMatch(/Unknown plan-quality record: xx\/plan9/);
    expect(errors).toMatch(/Missing or invalid plan-quality record: es\/plan1/);
    const incomplete = planQualityRecordErrors(quality, {
      'de/plan1': { status: 'human-reviewed', ...current, review: { reviewer: { name: 'AI critic' } } },
      'es/plan1': { status: 'legacy-owner-approved', ...current },
    }).join('\n');
    expect(incomplete).toMatch(/Incomplete plan-quality review: de\/plan1/);
    expect(incomplete).toMatch(/Legacy plan-quality record needs since, basis and note: es\/plan1/);
  });

  it('accepts current, complete records', () => {
    expect(planQualityRecordErrors(quality, { 'de/plan1': legacy, 'es/plan1': { status: 'needs-review', ...current } })).toEqual([]);
  });
});
