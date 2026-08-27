// Four screens can put a guided plan on someone's calendar: the Plan tab, the
// two "pray together" invitation paths, and joining a plan a group is praying.
// Only one of them used to honour the content review, so the invitation paths
// reported success while creating nothing. Everything comes through
// startGuidedPlan, and these are the guarantees that makes.
import { describe, expect, it, vi } from 'vitest';
import { startGuidedPlan } from './startGuidedPlan';

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

  // Regression: a plan that can be TAILORED used to be handed back unstarted
  // (`reason: 'onboarding'`) so the caller could put a sheet of questions in
  // front of it. Three of the four screens had no sheet, so they recorded an
  // intent and bounced the reader to the Plan tab to finish. Nothing is owed
  // before a start any more — the sheet lives on the plan's own day.
  it.each([['a couple plan', marriage], ['the singles plan', singles]])(
    'starts %s without asking anything first',
    async (_label, plan) => {
      const create = addPrayer();
      const result = await run({ plan, addPrayer: create });
      expect(result.ok).toBe(true);
      expect(result.prayerId).toBeTruthy();
      expect(create).toHaveBeenCalledTimes(1);
    },
  );

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
