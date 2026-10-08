import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  lockChange: null,
  clearTranslationCache: vi.fn(),
  clearAllAiResultCaches: vi.fn(),
  resetAiRequestState: vi.fn(),
}));

vi.mock('../lib/crypto/keyManager', () => ({
  isVaultInitialized: () => true,
  isUnlocked: () => true,
  onLockChange: (callback) => { mocks.lockChange = callback; },
  lock: () => mocks.lockChange(false),
}));
vi.mock('../lib/crypto/accountKey', () => ({ lockAccountKey: vi.fn(), rememberAccountKey: vi.fn() }));
vi.mock('../lib/vaultSync', () => ({ pushVaultRecord: vi.fn() }));
vi.mock('../lib/analytics', () => ({ track: vi.fn(), EVENTS: {} }));
vi.mock('./translationStore', () => ({ clearTranslationCache: mocks.clearTranslationCache }));
vi.mock('../lib/aiResultCache', () => ({ clearAllAiResultCaches: mocks.clearAllAiResultCaches }));
vi.mock('../lib/aiCore', () => ({ resetAiRequestState: mocks.resetAiRequestState }));

import useVaultStore from './vaultStore';

beforeEach(() => {
  vi.clearAllMocks();
  useVaultStore.setState({ initialized: true, unlocked: true });
});

describe('vault lock AI privacy boundary', () => {
  it('clears captured translation work when the key manager locks externally', () => {
    // Automatic/external locks bypass useVaultStore.getState().lock().
    mocks.lockChange(false);
    expect(mocks.clearTranslationCache).toHaveBeenCalledTimes(1);
    expect(mocks.clearAllAiResultCaches).toHaveBeenCalledTimes(1);
    expect(mocks.resetAiRequestState).toHaveBeenCalledTimes(1);
    expect(useVaultStore.getState().unlocked).toBe(false);
  });

  it('clears AI work through the normal lock action too', async () => {
    await useVaultStore.getState().lock();
    expect(mocks.clearTranslationCache).toHaveBeenCalledTimes(1);
    expect(mocks.resetAiRequestState).toHaveBeenCalledTimes(1);
  });

  it('does not clear new work when the vault unlocks', () => {
    useVaultStore.setState({ unlocked: false });
    mocks.lockChange(true);
    expect(mocks.clearTranslationCache).not.toHaveBeenCalled();
    expect(mocks.clearAllAiResultCaches).not.toHaveBeenCalled();
    expect(mocks.resetAiRequestState).not.toHaveBeenCalled();
    expect(useVaultStore.getState().unlocked).toBe(true);
  });

  it('cancels work before notifying subscribers that the vault is locked', () => {
    let sawLock = false;
    const unsubscribe = useVaultStore.subscribe((state) => {
      if (state.unlocked) return;
      sawLock = true;
      expect(mocks.clearTranslationCache).toHaveBeenCalledTimes(1);
    });
    mocks.lockChange(false);
    unsubscribe();
    expect(sawLock).toBe(true);
  });
});
