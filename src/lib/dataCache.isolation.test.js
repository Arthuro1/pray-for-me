import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  globalThis.indexedDB = {};
  return { accountId: 'account-a', generation: 0, unlocked: true, read: vi.fn(), write: vi.fn(), encrypt: vi.fn(), decrypt: vi.fn(), hydrate: vi.fn() };
});
vi.mock('idb-keyval', () => ({ get: mocks.read, set: mocks.write, del: vi.fn() }));
vi.mock('./crypto/keyManager', () => ({
  getLifecycleToken: () => ({ accountId: mocks.accountId, generation: mocks.generation }),
  isLifecycleCurrent: (token) => token.accountId === mocks.accountId && token.generation === mocks.generation,
  isAccountContextConfigured: () => true, isUnlocked: () => mocks.unlocked,
  isVaultInitialized: () => false, hydrate: mocks.hydrate, destroyVault: vi.fn(),
}));
vi.mock('./crypto/prayerCrypto', () => ({ encryptPrayersForCache: mocks.encrypt, decryptPrayers: mocks.decrypt }));
vi.mock('./mutationQueue', () => ({ clearAccountMutations: vi.fn() }));
vi.mock('./planPersonalizationStorage', () => ({ clearPlanPersonalizations: vi.fn() }));
vi.mock('./prayerFormDrafts', () => ({ clearAllFormDrafts: vi.fn() }));
import { loadSnapshot, saveSnapshot } from './dataCache';

const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
const switchAccount = () => { mocks.accountId = 'account-b'; mocks.generation += 1; };
beforeEach(() => {
  vi.clearAllMocks(); mocks.accountId = 'account-a'; mocks.generation = 0; mocks.unlocked = true;
  mocks.hydrate.mockResolvedValue(); mocks.read.mockResolvedValue({ prayers: [{ encrypted_payload: {} }] });
  mocks.encrypt.mockResolvedValue([{ encrypted_payload: { data: 'original ACK ciphertext' } }]);
  mocks.decrypt.mockResolvedValue([{ title: 'Private A' }]); mocks.write.mockResolvedValue();
});

describe('snapshot key and account lifecycle fences', () => {
  it('never encrypts an old snapshot with an incoming account key after hydration', async () => {
    const hydration = deferred(); mocks.hydrate.mockReturnValue(hydration.promise);
    const saving = saveSnapshot('account-a', { prayers: [{ title: 'Private A' }] });
    switchAccount(); hydration.resolve(); await saving;
    expect(mocks.encrypt).not.toHaveBeenCalled(); expect(mocks.write).not.toHaveBeenCalled();
  });
  it('does not persist an old snapshot when account changes during encryption', async () => {
    const encryption = deferred(); mocks.encrypt.mockReturnValue(encryption.promise);
    const saving = saveSnapshot('account-a', { prayers: [{ title: 'Private A' }] });
    await vi.waitFor(() => expect(mocks.encrypt).toHaveBeenCalled());
    switchAccount(); encryption.resolve([{ encrypted_payload: {} }]); await saving;
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it('never returns plaintext decrypted before a lock or account switch', async () => {
    const decryption = deferred(); mocks.decrypt.mockReturnValue(decryption.promise);
    const reading = loadSnapshot('account-a'); await vi.waitFor(() => expect(mocks.decrypt).toHaveBeenCalled());
    switchAccount(); decryption.resolve([{ title: 'Private A' }]);
    expect(await reading).toBeNull();
  });
  it('does not downgrade protected devices without legacy vault metadata to plaintext cache writes', async () => {
    mocks.unlocked = false;
    await saveSnapshot('account-a', { prayers: [{ title: 'Private A' }] });
    expect(await loadSnapshot('account-a')).toBeNull();
    expect(mocks.encrypt).not.toHaveBeenCalled(); expect(mocks.write).not.toHaveBeenCalled();
  });
});
