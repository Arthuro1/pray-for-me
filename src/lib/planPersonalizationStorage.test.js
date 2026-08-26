import { beforeEach, describe, expect, it } from 'vitest';
import {
  savePlanPersonalization, loadPlanPersonalization, clearPlanPersonalization,
  clearPlanPersonalizations, __resetPlanPersonalizationMemoryForTests,
} from './planPersonalizationStorage';

beforeEach(() => __resetPlanPersonalizationMemoryForTests());

describe('private plan personalization storage', () => {
  it('round-trips only for the owning account and run', async () => {
    await savePlanPersonalization('owner-a', 'run-a', { partner: { name: 'Anna' }, mode: 'together' });
    expect(await loadPlanPersonalization('owner-a', 'run-a')).toMatchObject({ partner: { name: 'Anna' }, mode: 'together' });
    expect(await loadPlanPersonalization('owner-b', 'run-a')).toBeNull();
    expect(await loadPlanPersonalization('owner-a', 'run-b')).toBeNull();
  });

  it('erases one run or all runs for one account without touching another', async () => {
    await savePlanPersonalization('owner-a', 'run-a', { partner: { name: 'Anna' } });
    await savePlanPersonalization('owner-a', 'run-b', { partner: { name: 'Beth' } });
    await savePlanPersonalization('owner-b', 'run-c', { partner: { name: 'Chris' } });
    await clearPlanPersonalization('owner-a', 'run-a');
    expect(await loadPlanPersonalization('owner-a', 'run-a')).toBeNull();
    expect((await loadPlanPersonalization('owner-a', 'run-b')).partner.name).toBe('Beth');
    await clearPlanPersonalizations('owner-a');
    expect(await loadPlanPersonalization('owner-a', 'run-b')).toBeNull();
    expect((await loadPlanPersonalization('owner-b', 'run-c')).partner.name).toBe('Chris');
  });
});
