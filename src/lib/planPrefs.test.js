// @vitest-environment jsdom
//
// Plan onboarding answers are among the most personal things this app touches —
// what season someone is in, whether they hope to marry, what they want healed.
// These tests hold the two promises made about them: they stay on the device,
// and only known ids ever come back out.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPlanPrefs, hasPlanPrefs, savePlanPrefs, markPlanCompleted, clearPlanPrefs,
  growthTopics, getResourceFallbackLanguages, setResourceFallbackLanguages,
  SEASONS, EMPHASES, ROLES, GROWTH_AREAS, DEFAULT_EMPHASIS, DEFAULT_ROLE,
} from './planPrefs.js';

const PLAN = 'preparing21';

beforeEach(() => localStorage.clear());

describe('defaults', () => {
  it('returns usable recommended defaults before anyone has answered', () => {
    const prefs = getPlanPrefs(PLAN);
    expect(hasPlanPrefs(PLAN)).toBe(false);
    expect(prefs.emphasis).toEqual(DEFAULT_EMPHASIS);
    expect(prefs.role).toBe(DEFAULT_ROLE);
    expect(prefs.growth).toEqual([]);
    expect(prefs.season).toBeUndefined();
  });

  it('defaults the husband/wife question to keeping the plan general', () => {
    expect(DEFAULT_ROLE).toBe('general');
    expect(ROLES.map((r) => r.id)).toContain('general');
  });

  it('recommends growing closer to God, character and a possible spouse', () => {
    expect(DEFAULT_EMPHASIS).toEqual(['closeness', 'character', 'spouse']);
  });
});

describe('saving', () => {
  it('round-trips a full set of answers', () => {
    savePlanPrefs(PLAN, { season: 'hope', emphasis: ['healing'], role: 'wife', growth: ['conflict'] });
    const prefs = getPlanPrefs(PLAN);
    expect(hasPlanPrefs(PLAN)).toBe(true);
    expect(prefs).toMatchObject({ season: 'hope', emphasis: ['healing'], role: 'wife', growth: ['conflict'] });
    expect(prefs.startedAt).toBeTruthy();
  });

  it('keeps the original start date when answers are revised', () => {
    savePlanPrefs(PLAN, { season: 'hope' });
    const first = getPlanPrefs(PLAN).startedAt;
    savePlanPrefs(PLAN, { season: 'open' });
    expect(getPlanPrefs(PLAN).startedAt).toBe(first);
    expect(getPlanPrefs(PLAN).season).toBe('open');
  });

  it('records completion', () => {
    savePlanPrefs(PLAN, { season: 'hope' });
    markPlanCompleted(PLAN);
    expect(getPlanPrefs(PLAN).completedAt).toBeTruthy();
  });

  it('forgets everything when the answers are cleared', () => {
    savePlanPrefs(PLAN, { season: 'hope', role: 'husband' });
    clearPlanPrefs(PLAN);
    expect(hasPlanPrefs(PLAN)).toBe(false);
    expect(localStorage.getItem('pfm_plan_prefs')).not.toMatch(/husband/);
  });
});

describe('only known ids survive', () => {
  it('drops anything that is not on the fixed lists', () => {
    savePlanPrefs(PLAN, {
      season: 'in a relationship with Alex',
      emphasis: ['closeness', 'my ex'],
      role: 'something else',
      growth: ['conflict', 'free text'],
    });
    const prefs = getPlanPrefs(PLAN);
    expect(prefs.season).toBeUndefined();
    expect(prefs.emphasis).toEqual(['closeness']);
    expect(prefs.role).toBe(DEFAULT_ROLE);
    expect(prefs.growth).toEqual(['conflict']);
    // Nothing free-text ever reaches storage.
    expect(localStorage.getItem('pfm_plan_prefs')).not.toMatch(/Alex|free text|my ex/);
  });

  it('survives corrupt storage without throwing', () => {
    localStorage.setItem('pfm_plan_prefs', 'not json');
    expect(() => getPlanPrefs(PLAN)).not.toThrow();
    expect(getPlanPrefs(PLAN).role).toBe(DEFAULT_ROLE);
  });

  it('every option id in the UI lists is unique', () => {
    for (const list of [SEASONS, EMPHASES, ROLES, GROWTH_AREAS]) {
      const ids = list.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('growthTopics', () => {
  it('maps chosen growth areas onto resource topics', () => {
    expect(growthTopics({ growth: ['conflict'] }).sort()).toEqual(['conflict', 'forgiveness']);
  });

  it('is empty when nothing was chosen', () => {
    expect(growthTopics({ growth: [] })).toEqual([]);
    expect(growthTopics(null)).toEqual([]);
  });

  it('de-duplicates overlapping areas', () => {
    const topics = growthTopics({ growth: ['responsibility', 'leadership'] });
    expect(new Set(topics).size).toBe(topics.length);
  });

  it('uses couple include choices only as resource-ranking topics', () => {
    expect(growthTopics({ includes: ['spiritual', 'children'] })).toEqual(expect.arrayContaining([
      'spiritual-rhythms', 'prayer-together', 'children', 'parenting', 'family-discipleship',
    ]));
  });
});

describe('resource fallback languages', () => {
  it('is empty by default, so nothing is ever shown in an unasked-for language', () => {
    expect(getResourceFallbackLanguages()).toEqual([]);
  });

  it('round-trips and de-duplicates', () => {
    setResourceFallbackLanguages(['en', 'en', 'de']);
    expect(getResourceFallbackLanguages()).toEqual(['en', 'de']);
  });

  it('survives corrupt storage', () => {
    localStorage.setItem('pfm_resource_langs', '{oops');
    expect(getResourceFallbackLanguages()).toEqual([]);
  });
});
