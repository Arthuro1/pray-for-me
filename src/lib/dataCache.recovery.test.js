import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  destroyVault: vi.fn(), del: vi.fn(), clearPlanPersonalizations: vi.fn(), clearAllFormDrafts: vi.fn(), clearAccountMutations: vi.fn(),
}));
vi.mock('idb-keyval', () => ({ get: vi.fn(), set: vi.fn(), del: mocks.del }));
vi.mock('./crypto/keyManager', () => ({
  isVaultInitialized: () => false, isUnlocked: () => false, hydrate: vi.fn(), destroyVault: mocks.destroyVault,
  isAccountContextConfigured: () => true, getLifecycleToken: () => ({ accountId: 'account-a', generation: 1 }),
}));
vi.mock('./crypto/prayerCrypto', () => ({ encryptPrayersForCache: vi.fn(), decryptPrayers: vi.fn() }));
vi.mock('./planPersonalizationStorage', () => ({ clearPlanPersonalizations: mocks.clearPlanPersonalizations }));
vi.mock('./prayerFormDrafts', () => ({ clearAllFormDrafts: mocks.clearAllFormDrafts }));
vi.mock('./mutationQueue', () => ({ clearAccountMutations: mocks.clearAccountMutations }));
globalThis.indexedDB = {};
const { clearLocalData } = await import('./dataCache');

beforeEach(() => vi.clearAllMocks());

describe('sign-out recovery preservation', () => {
  it('clears prayer caches and drafts while retaining an interrupted wrapped recovery backup', async () => {
    await clearLocalData('account-a', { preserveRecovery: true });
    expect(mocks.destroyVault).not.toHaveBeenCalled();
    expect(mocks.del).toHaveBeenCalledWith('pfm_data_account-a');
    expect(mocks.clearAccountMutations).not.toHaveBeenCalled();
    expect(mocks.del).not.toHaveBeenCalledWith('pfm_mutation_queue');
    expect(mocks.clearAllFormDrafts).toHaveBeenCalled();
    expect(mocks.clearPlanPersonalizations).toHaveBeenCalledWith('account-a');
  });

  it('retains explicit recovery destruction for account-erasure cleanup', async () => {
    await clearLocalData('account-a');
    expect(mocks.destroyVault).toHaveBeenCalledTimes(1);
    expect(mocks.clearAccountMutations).toHaveBeenCalledWith('account-a');
  });
});
