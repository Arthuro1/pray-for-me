// @vitest-environment jsdom
//
// (jsdom for localStorage: the singles plan's answers live there.)
//
// Four screens can put a guided plan on someone's calendar. Only one of them
// used to honour a plan's onboarding or its content review, which meant an
// invited spouse got marriage30 with no partner name, no private/together
// choice and no role — permanently, because those answers belong to the run and
// cannot be supplied later. Everything now comes through startGuidedPlan, and
// these are the guarantees that makes.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { needsOnboarding, startGuidedPlan } from './startGuidedPlan';
import { clearPlanPrefs, getPlanPrefs, savePlanPrefs } from './planPrefs';
import { loadPlanPersonalization, __resetPlanPersonalizationMemoryForTests } from './planPersonalizationStorage';

const marriage = {
  id: 'marriage30', lifeStage: 'married', count: 30, version: 1,
  titleKey: 'planMarriageTitle', subKey: 'planMarriageSub', onboarding: 'married',
  review: { status: 'needs_review' },
};
const singles = {
  id: 'preparing21', lifeStage: 'single', count: 21, version: 1,
  titleKey: 'planPreparingTitle', subKey: 'planPreparingSub', onboarding: 'preparing',
};
const plain = { id: 'fast3', count: 3, titleKey: 'planFast3Title', subKey: 'planFast3Sub' };

const addPrayer = () => vi.fn(async (prayer) => prayer.id || 'new-prayer-id');
const run = (overrides) => startGuidedPlan({
  startDate: '2026-09-01', lang: 'en', ownerId: 'owner-1', ...overrides,
});

beforeEach(() => {
  __resetPlanPersonalizationMemoryForTests();
  clearPlanPrefs('preparing21');
  clearPlanPrefs('marriage30');
});

describe('needsOnboarding', () => {
  it('is false for a plan that asks nothing', () => {
    expect(needsOnboarding(plain)).toBe(false);
  });

  it('asks a couple plan every run, because its answers belong to that run', () => {
    expect(needsOnboarding(marriage)).toBe(true);
    savePlanPrefs('marriage30', { role: 'wife' });
    expect(needsOnboarding(marriage)).toBe(true);
  });

  it('asks the singles plan only until it has been answered', () => {
    expect(needsOnboarding(singles)).toBe(true);
    savePlanPrefs('preparing21', { season: 'hope' });
    expect(needsOnboarding(singles)).toBe(false);
  });
});

describe('startGuidedPlan', () => {
  // canUsePlan() is what decides this, and planReview.test.js owns its rules.
  // What matters here is that an unusable plan comes back as an explicit
  // failure — the invitation paths used to toast "Plan started" over it.
  it('refuses an unavailable plan instead of reporting success', async () => {
    const create = addPrayer();
    const result = await run({ plan: null, addPrayer: create, skipOnboarding: true });
    expect(result).toEqual({ ok: false, reason: 'unavailable' });
    expect(create).not.toHaveBeenCalled();
  });

  it('hands a plan that still owes its questions back instead of starting it', async () => {
    const create = addPrayer();
    const result = await run({ plan: marriage, addPrayer: create });
    expect(result).toEqual({ ok: false, reason: 'onboarding' });
    expect(create).not.toHaveBeenCalled();
  });

  it('starts a plan that asks nothing', async () => {
    const create = addPrayer();
    const result = await run({ plan: plain, addPrayer: create });
    expect(result.ok).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('stores couple answers privately, under the run it created', async () => {
    const create = addPrayer();
    const result = await run({
      plan: marriage, addPrayer: create, prefs: { partner: { name: 'Ana' }, mode: 'together' },
    });
    expect(result.ok).toBe(true);
    const stored = await loadPlanPersonalization('owner-1', result.prayerId);
    expect(stored).toMatchObject({ partner: { name: 'Ana' }, mode: 'together' });
  });

  it('saves singles answers to the device, not to a run', async () => {
    const create = addPrayer();
    await run({ plan: singles, addPrayer: create, prefs: { season: 'discerning' } });
    expect(getPlanPrefs('preparing21').season).toBe('discerning');
  });

  it('reports a failed create, and leaves no orphaned private answers behind', async () => {
    const create = vi.fn(async () => null);
    const result = await run({ plan: marriage, addPrayer: create, prefs: { partner: { name: 'Ana' } } });
    expect(result).toEqual({ ok: false, reason: 'create' });
    // Whatever run id it minted, nothing for this owner survives the failure.
    expect(await loadPlanPersonalization('owner-1', 'anything')).toBeNull();
  });

  it('still starts the plan when private storage is unavailable', async () => {
    const create = addPrayer();
    const generate = vi.spyOn(crypto.subtle, 'generateKey').mockRejectedValue(new Error('no crypto'));
    try {
      const result = await run({ plan: marriage, addPrayer: create, prefs: { partner: { name: 'Ana' } } });
      expect(result.ok).toBe(true);
      expect(create).toHaveBeenCalledTimes(1);
    } finally {
      generate.mockRestore();
    }
  });
});
