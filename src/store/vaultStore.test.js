import { describe, it, expect, beforeEach, vi } from 'vitest';

// vaultStore → vaultSync imports the real Supabase client, which builds its
// realtime/WebSocket layer at construct time and throws on Node < 22 in CI.
// This suite only exercises local crypto; the vault's sync calls are
// fire-and-forget, so stub the client to a no-op (mirrors noPlaintextLeak.test).
vi.mock('../lib/supabase', () => {
  const chain = {
    upsert: () => Promise.resolve({ data: null, error: null }),
    select: () => chain,
    eq: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };
  return {
    supabase: {
      auth: { getUser: async () => ({ data: { user: null } }) },
      from: () => chain,
    },
  };
});

// localStorage shim must exist before the store/keyManager import touches it.
function installStorage() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}
installStorage();

const { default: useVaultStore } = await import('./vaultStore.js');

beforeEach(() => {
  installStorage();
  useVaultStore.getState().lock();
  useVaultStore.setState({ initialized: false, unlocked: false });
});

describe('vaultStore', () => {
  it('reflects create → lock → unlock in reactive state', async () => {
    const s = useVaultStore.getState();
    expect(s.initialized).toBe(false);

    const code = await s.createVault('passphrase-1');
    expect(typeof code).toBe('string');
    expect(useVaultStore.getState().initialized).toBe(true);
    expect(useVaultStore.getState().unlocked).toBe(true);

    useVaultStore.getState().lock();
    expect(useVaultStore.getState().unlocked).toBe(false);

    expect(await useVaultStore.getState().unlock('passphrase-1')).toBe(true);
    expect(useVaultStore.getState().unlocked).toBe(true);
  });

  it('does not flip unlocked on a wrong passphrase', async () => {
    await useVaultStore.getState().createVault('right-one');
    useVaultStore.getState().lock();
    expect(await useVaultStore.getState().unlock('wrong-one')).toBe(false);
    expect(useVaultStore.getState().unlocked).toBe(false);
  });

  it('destroy clears initialized + unlocked', async () => {
    await useVaultStore.getState().createVault('passphrase-1');
    await useVaultStore.getState().destroy();
    expect(useVaultStore.getState().initialized).toBe(false);
    expect(useVaultStore.getState().unlocked).toBe(false);
  });
});
