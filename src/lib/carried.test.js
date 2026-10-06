// @vitest-environment jsdom
//
// Long-carried prayer is memory, never merit, and "Tend your altar" is a gentle
// review — these tests pin both: dates and plain day counts only, and a review
// that offers exactly the prayers that have quietly rested, once in a while.
import { beforeEach, describe, expect, it } from 'vitest';
import {
  TEND_STORAGE_KEY,
  canReleaseFromRhythm,
  carriedSinceLabel,
  markTended,
  prayedDayCount,
  readTended,
  showsCarriedSince,
  tendCandidates,
} from './carried';

const NOW = new Date('2026-10-06T12:00:00Z');
const prayer = (id, extra = {}) => ({
  id,
  title: `t-${id}`,
  status: 'active',
  created_at: '2025-03-10T09:00:00Z',
  schedule: { type: 'weekly', days: [1] },
  ...extra,
});

beforeEach(() => localStorage.clear());

describe('carried since', () => {
  it('names the month and year in the reader’s language', () => {
    expect(carriedSinceLabel(prayer('p1'), 'en')).toBe('March 2025');
    expect(carriedSinceLabel(prayer('p1'), 'fr')).toBe('mars 2025');
  });

  it('counts distinct days prayed — a memory aid, not a score', () => {
    expect(prayedDayCount({ p1: ['2026-01-01', '2026-01-01', '2026-01-02'] }, 'p1')).toBe(2);
    expect(prayedDayCount({}, 'p1')).toBe(0);
  });

  it('applies to one’s own active prayers, never plan runs or carried copies', () => {
    expect(showsCarriedSince(prayer('p1'))).toBe(true);
    expect(showsCarriedSince(prayer('p2', { status: 'answered' }))).toBe(false);
    expect(showsCarriedSince(prayer('p3', { schedule: { type: 'daily', plan: { id: 'altar7' } } }))).toBe(false);
    expect(showsCarriedSince(prayer('p4', { community_origin_id: 'c1' }))).toBe(false);
    expect(showsCarriedSince(prayer('p5', { _locked: true }))).toBe(false);
  });
});

describe('tend your altar', () => {
  it('offers prayers that have rested a while, oldest-resting first', () => {
    const prayers = [
      prayer('recent', { created_at: '2026-09-30T00:00:00Z' }),
      prayer('prayedLastWeek'),
      prayer('restingSinceJuly'),
      prayer('neverPrayed'),
    ];
    const completions = { prayedLastWeek: ['2026-09-29'], restingSinceJuly: ['2026-07-01'] };
    expect(tendCandidates(prayers, completions, { now: NOW, tended: {} }).map((p) => p.id))
      .toEqual(['neverPrayed', 'restingSinceJuly']);
  });

  it('never offers answered prayers, plan runs, carried copies or locked rows', () => {
    const prayers = [
      prayer('answered', { status: 'answered' }),
      prayer('plan', { schedule: { type: 'daily', plan: { id: 'x' } } }),
      prayer('copy', { community_origin_id: 'c1' }),
      prayer('locked', { _locked: true }),
    ];
    expect(tendCandidates(prayers, {}, { now: NOW, tended: {} })).toEqual([]);
  });

  it('respects a recent answer, then offers the prayer again after a quiet season', () => {
    const prayers = [prayer('p1')];
    expect(tendCandidates(prayers, {}, { now: NOW, tended: { p1: '2026-09-20' } })).toEqual([]);
    expect(tendCandidates(prayers, {}, { now: NOW, tended: { p1: '2026-06-01' } })).toHaveLength(1);
  });

  it('remembers answers on this device as ids and dates only', () => {
    markTended('p1', NOW);
    expect(readTended()).toEqual({ p1: '2026-10-06' });
    expect(localStorage.getItem(TEND_STORAGE_KEY)).not.toContain('t-p1');
  });

  it('offers "release" only to a prayer that still returns on its own', () => {
    expect(canReleaseFromRhythm(prayer('p1'))).toBe(true);
    expect(canReleaseFromRhythm(prayer('legacy', { schedule: null }))).toBe(true);
    expect(canReleaseFromRhythm(prayer('none', { schedule: { type: 'none' } }))).toBe(false);
  });
});
