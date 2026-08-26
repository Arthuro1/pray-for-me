import { beforeEach, describe, expect, it, vi } from 'vitest';

// A fake IndexedDB (via idb-keyval) plus a truthy `indexedDB` global so the
// module takes its PERSISTENT path — the one real devices use, and the one
// whose failures used to erase the record.
const idbStore = vi.hoisted(() => new Map());
const idbFail = vi.hoisted(() => ({ read: false }));
vi.hoisted(() => { globalThis.indexedDB = {}; });
vi.mock('idb-keyval', () => ({
  get: async (k) => { if (idbFail.read) throw new Error('quota'); return idbStore.get(k); },
  set: async (k, v) => { idbStore.set(k, v); },
  del: async (k) => { idbStore.delete(k); },
  keys: async () => [...idbStore.keys()],
}));

import {
  savePlanPersonalization, loadPlanPersonalization, clearPlanPersonalization,
  clearPlanPersonalizations, __resetPlanPersonalizationMemoryForTests,
} from './planPersonalizationStorage';

beforeEach(() => {
  idbStore.clear();
  idbFail.read = false;
  __resetPlanPersonalizationMemoryForTests();
});

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

  // Reading can fail for reasons that say nothing about the record — private
  // browsing, a quota error, a blocked database upgrade. Deleting a partner's
  // and children's names over that would be data loss, so the run just stays
  // generic until the next read succeeds.
  it('keeps the record when the READ fails rather than erasing it', async () => {
    await savePlanPersonalization('owner-a', 'run-a', { partner: { name: 'Anna' } });
    idbFail.read = true;
    expect(await loadPlanPersonalization('owner-a', 'run-a')).toBeNull();
    idbFail.read = false;
    expect((await loadPlanPersonalization('owner-a', 'run-a')).partner.name).toBe('Anna');
  });

  // A record whose ciphertext cannot be authenticated is a different matter:
  // it cannot be trusted, so it IS deleted.
  it('erases a record it cannot decrypt', async () => {
    await savePlanPersonalization('owner-a', 'run-a', { partner: { name: 'Anna' } });
    const decrypt = vi.spyOn(crypto.subtle, 'decrypt').mockRejectedValue(new Error('bad tag'));
    try {
      expect(await loadPlanPersonalization('owner-a', 'run-a')).toBeNull();
    } finally {
      decrypt.mockRestore();
    }
    expect(await loadPlanPersonalization('owner-a', 'run-a')).toBeNull();
  });
});
