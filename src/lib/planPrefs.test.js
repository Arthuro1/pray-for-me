// @vitest-environment jsdom
//
// Plan personalization answers are among the most personal things this app
// touches — whether someone is preparing to be a husband or a wife, what they
// want healed. These tests hold the three promises made about them: they stay on
// the device, only known ids ever come back out, and nothing is asked that does
// not change something the reader can see.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPlanPrefs, savePlanPrefs, markPlanCompleted, clearPlanPrefs,
  claimPlanCompletionReport,
  growthTopics, getResourceFallbackLanguages, setResourceFallbackLanguages,
  ROLES, GROWTH_AREAS, DEFAULT_ROLE, DEFAULT_RESOURCE_FALLBACK_LANGUAGES,
} from './planPrefs.js';

const PLAN = 'preparing21';

beforeEach(() => localStorage.clear());

describe('defaults', () => {
  // An UNANSWERED role stays absent rather than becoming 'general'. That is what
  // lets a plan day tell "never asked" from "asked, and chose to keep it
  // general", so the inline question is offered once and then stops.
  it('stores nothing at all before anyone has answered', () => {
    const prefs = getPlanPrefs(PLAN);
    expect(localStorage.getItem('pfm_plan_prefs')).toBeNull();
    expect(prefs.role).toBeUndefined();
    expect(prefs.growth).toEqual([]);
  });

  it('defaults the husband/wife question to keeping the plan general', () => {
    expect(DEFAULT_ROLE).toBe('general');
    expect(ROLES.map((r) => r.id)).toContain('general');
  });

  it('records "keep it general" as a real answer, not as silence', () => {
    savePlanPrefs(PLAN, { role: 'general' });
    expect(getPlanPrefs(PLAN).role).toBe('general');
  });
});

describe('saving', () => {
  it('round-trips a full set of answers', () => {
    savePlanPrefs(PLAN, { role: 'wife', growth: ['conflict'] });
    const prefs = getPlanPrefs(PLAN);
    expect(prefs).toMatchObject({ role: 'wife', growth: ['conflict'] });
    expect(prefs.startedAt).toBeTruthy();
  });

  it('keeps the original start date when answers are revised', () => {
    savePlanPrefs(PLAN, { role: 'wife' });
    const first = getPlanPrefs(PLAN).startedAt;
    savePlanPrefs(PLAN, { role: 'husband' });
    expect(getPlanPrefs(PLAN).startedAt).toBe(first);
    expect(getPlanPrefs(PLAN).role).toBe('husband');
  });

  it('records completion', () => {
    savePlanPrefs(PLAN, { role: 'wife' });
    markPlanCompleted(PLAN);
    expect(getPlanPrefs(PLAN).completedAt).toBeTruthy();
  });

  it('forgets everything when the answers are cleared', () => {
    savePlanPrefs(PLAN, { role: 'husband', growth: ['healing'] });
    clearPlanPrefs(PLAN);
    expect(localStorage.getItem('pfm_plan_prefs')).not.toContain(PLAN);
    expect(localStorage.getItem('pfm_plan_prefs')).not.toMatch(/husband/);
  });
});

// The `completed` event fires when the last day is behind the reader, not when
// they happen to tap a follow-up action — so it needs a once-per-run guard,
// because the completion card renders on every visit to that prayer.
describe('completion reporting', () => {
  it('is claimable exactly once for a run', () => {
    expect(claimPlanCompletionReport('prayer-1')).toBe(true);
    expect(claimPlanCompletionReport('prayer-1')).toBe(false);
    expect(claimPlanCompletionReport('prayer-1')).toBe(false);
  });

  it('counts a renewable plan again when it is started again', () => {
    expect(claimPlanCompletionReport('run-one')).toBe(true);
    expect(claimPlanCompletionReport('run-two')).toBe(true);
  });

  it('reports nothing rather than everything when storage refuses', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full'); });
    try {
      expect(claimPlanCompletionReport('prayer-2')).toBe(false);
    } finally {
      setItem.mockRestore();
    }
  });

  it('ignores a missing id', () => {
    expect(claimPlanCompletionReport(null)).toBe(false);
  });
});

describe('only known ids survive', () => {
  it('drops anything that is not on the fixed lists', () => {
    savePlanPrefs(PLAN, {
      role: 'in a relationship with Alex',
      growth: ['conflict', 'free text'],
    });
    const prefs = getPlanPrefs(PLAN);
    expect(prefs.role).toBeUndefined();
    expect(prefs.growth).toEqual(['conflict']);
    // Nothing free-text ever reaches storage.
    expect(localStorage.getItem('pfm_plan_prefs')).not.toMatch(/Alex|free text/);
  });

  it('survives corrupt storage without throwing', () => {
    localStorage.setItem('pfm_plan_prefs', 'not json');
    expect(() => getPlanPrefs(PLAN)).not.toThrow();
    expect(getPlanPrefs(PLAN).growth).toEqual([]);
  });

  it('every option id in the UI lists is unique', () => {
    for (const list of [ROLES, GROWTH_AREAS]) {
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

  it('uses the optional couple layers only as resource-ranking topics', () => {
    expect(growthTopics({ includes: ['children', 'home'] })).toEqual(expect.arrayContaining([
      'children', 'parenting', 'family-discipleship', 'family', 'hospitality',
    ]));
  });

  // They were pre-ticked boxes that changed nothing a day said; unticking them
  // was a control the plan could not honour, so they are no longer offered.
  it('no longer knows the four directions that were never optional', () => {
    expect(growthTopics({ includes: ['marriage', 'spouse', 'self', 'spiritual'] })).toEqual([]);
  });
});

describe('additional resource languages', () => {
  it('preselects English for a new reader', () => {
    expect(DEFAULT_RESOURCE_FALLBACK_LANGUAGES).toEqual(['en']);
    expect(getResourceFallbackLanguages()).toEqual(['en']);
  });

  it('lets the reader explicitly turn every additional language off', () => {
    setResourceFallbackLanguages([]);
    expect(getResourceFallbackLanguages()).toEqual([]);
  });

  it('round-trips and de-duplicates', () => {
    setResourceFallbackLanguages(['en', 'en', 'de']);
    expect(getResourceFallbackLanguages()).toEqual(['en', 'de']);
  });

  it('survives corrupt storage', () => {
    localStorage.setItem('pfm_resource_langs', '{oops');
    expect(getResourceFallbackLanguages()).toEqual(['en']);
  });
});
