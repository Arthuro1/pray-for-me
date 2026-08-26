import { beforeEach, describe, expect, it } from 'vitest';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import {
  savePlanPersonalization, loadPlanPersonalization, clearPlanPersonalization,
  __resetPlanPersonalizationMemoryForTests,
} from './planPersonalizationStorage';

const OWNER = 'browser-owner';
const RUN = 'browser-run';
const SLOT = 'pfm_plan_personalization:browser-owner:browser-run';
const SECRET = 'Anna_PRIVATE_SPOUSE_NAME';

beforeEach(async () => {
  await clearPlanPersonalization(OWNER, RUN);
  await idbDel(SLOT);
  __resetPlanPersonalizationMemoryForTests();
});

describe('plan personalization in a real browser', () => {
  it('persists names as authenticated ciphertext under a non-extractable key', async () => {
    await savePlanPersonalization(OWNER, RUN, { partner: { name: SECRET }, mode: 'together' });
    const stored = await idbGet(SLOT);
    expect(stored.key).toBeInstanceOf(CryptoKey);
    expect(stored.key.extractable).toBe(false);
    await expect(crypto.subtle.exportKey('raw', stored.key)).rejects.toThrow();
    expect(JSON.stringify(stored)).not.toContain(SECRET);

    __resetPlanPersonalizationMemoryForTests();
    expect((await loadPlanPersonalization(OWNER, RUN)).partner.name).toBe(SECRET);
  });

  it('fails closed and deletes a tampered record', async () => {
    await savePlanPersonalization(OWNER, RUN, { partner: { name: SECRET } });
    const stored = await idbGet(SLOT);
    await idbSet(SLOT, { ...stored, payload: { ...stored.payload, ct: `A${stored.payload.ct.slice(1)}` } });
    __resetPlanPersonalizationMemoryForTests();
    expect(await loadPlanPersonalization(OWNER, RUN)).toBeNull();
    expect(await idbGet(SLOT)).toBeUndefined();
  });
});
