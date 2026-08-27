// @vitest-environment jsdom
// Four screens can put a guided plan on someone's calendar: the Plan tab, the
// two "pray together" invitation paths, and joining a plan a group is praying.
// Only one of them used to honour the content review, so the invitation paths
// reported success while creating nothing. Everything comes through
// startGuidedPlan, and these are the guarantees that makes.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startGuidedPlan } from './startGuidedPlan';
import { getPlanPrefs } from './planPrefs';

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
const run = (overrides) => startGuidedPlan({ startDate: '2026-09-01', lang: 'en', ...overrides });
afterEach(() => localStorage.clear());

describe('startGuidedPlan', () => {
  // canUsePlan() is what decides this, and planReview.test.js owns its rules.
  // What matters here is that an unusable plan comes back as an explicit
  // failure — the invitation paths used to toast "Plan started" over it.
  it('refuses an unavailable plan instead of reporting success', async () => {
    const create = addPrayer();
    const result = await run({ plan: null, addPrayer: create });
    expect(result).toEqual({ ok: false, reason: 'unavailable' });
    expect(create).not.toHaveBeenCalled();
  });

  it('starts a plan that asks nothing', async () => {
    const create = addPrayer();
    const result = await run({ plan: plain, addPrayer: create });
    expect(result.ok).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('starts a couple plan immediately so it can be personalized in context', async () => {
    const create = addPrayer();
    const result = await run({ plan: marriage, addPrayer: create });
    expect(result.ok).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('hands the singles plan back for its slim pre-start choices', async () => {
    const create = addPrayer();
    const result = await run({ plan: singles, addPrayer: create });
    expect(result).toEqual({ ok: false, reason: 'personalize' });
    expect(create).not.toHaveBeenCalled();
  });

  it('starts the singles plan once its meaningful choices are supplied', async () => {
    const create = addPrayer();
    const result = await run({ plan: singles, prefs: { role: 'general', growth: [] }, addPrayer: create });
    expect(result.ok).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
    expect(getPlanPrefs(singles.id)).toMatchObject({ role: 'general', growth: [] });
  });

  it('does not keep singles choices when creating the plan fails', async () => {
    const result = await run({
      plan: singles,
      prefs: { role: 'wife', growth: ['communication'] },
      addPrayer: vi.fn(async () => null),
    });
    expect(result).toEqual({ ok: false, reason: 'create' });
    expect(getPlanPrefs(singles.id)).toEqual({ growth: [] });
  });

  it('builds the plan run from the plan itself, carrying no answers', async () => {
    const create = addPrayer();
    await run({ plan: marriage, addPrayer: create });
    const [prayer] = create.mock.calls[0];
    expect(prayer.schedule.plan).toMatchObject({ id: 'marriage30', startDate: '2026-09-01' });
    expect(prayer.schedule.end).toEqual({ kind: 'count', count: 30 });
  });

  it('reports a failed create rather than claiming the plan began', async () => {
    const create = vi.fn(async () => null);
    const result = await run({ plan: marriage, addPrayer: create });
    expect(result).toEqual({ ok: false, reason: 'create' });
  });
});
