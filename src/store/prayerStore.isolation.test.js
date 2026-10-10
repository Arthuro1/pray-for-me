import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const values = new Map();
  globalThis.localStorage = { getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key), clear: () => values.clear() };
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: true, language: 'en' }, configurable: true });
  return { snapshot: vi.fn(), save: vi.fn(), enqueue: vi.fn(), decrypt: vi.fn(), encrypt: vi.fn(), child: vi.fn(), rows: new Map() };
});
vi.mock('../lib/dataCache', () => ({ loadSnapshot: mocks.snapshot, saveSnapshot: mocks.save }));
vi.mock('../lib/mutationQueue', () => ({ enqueue: mocks.enqueue, pendingPrayerIds: () => new Set(),
  initQueue: async () => {}, queueReadiness: () => 'ready', getPendingMutations: () => [] }));
vi.mock('../lib/settingsSync', () => ({ fetchUserSettings: async () => null, saveUserSettings: async () => {}, touchesSyncedSettings: () => false }));
vi.mock('../lib/notificationPrefs', () => ({ isEventPushEnabled: async () => false }));
vi.mock('../push', () => ({ ensurePushSubscription: async () => {} }));
vi.mock('../lib/crypto/groupKeys', () => ({ groupKeyResolver: () => async () => null }));
vi.mock('../lib/crypto/communityCrypto', () => ({ decryptCommunityRow: async (_key, row) => row }));
vi.mock('../lib/crypto/prayerCrypto', async (original) => ({
  ...(await original()), decryptPrayers: mocks.decrypt, encryptPrayerForStorage: mocks.encrypt, encryptChildForStorage: mocks.child,
}));
vi.mock('../lib/supabase', () => ({ supabase: {
  auth: { getSession: async () => ({ data: { session: { user: { id: 'account-a' } } } }) },
  from: (table) => {
    let owner;
    const query = { select: () => query, eq: (column, value) => { if (column === 'user_id') owner = value; return query; },
      order: () => query, gte: () => query, not: () => query, in: () => query,
      then: (resolve) => resolve({ data: table === 'prayers' ? (mocks.rows.get(owner) || []) : [], error: null }) };
    return query;
  },
} }));

import { autoInitAccountKey, configureAccountContext, lock } from '../lib/crypto/keyManager';
import usePrayerStore from './prayerStore';

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
const prayer = (account, extra = {}) => ({ id: `prayer-${account}`, user_id: account,
  title: `Private ${account}`, encryption_version: 2, prayer_updates: [], prayer_points: [], prayer_testimonies: [], ...extra });

beforeEach(async () => {
  vi.clearAllMocks();
  mocks.rows.clear(); mocks.snapshot.mockResolvedValue(null); mocks.decrypt.mockImplementation(async (rows) => rows);
  mocks.encrypt.mockResolvedValue({ encrypted_payload: { data: 'ciphertext' }, encryption_version: 2 });
  mocks.child.mockResolvedValue({ encrypted_payload: { data: 'ciphertext' }, encryption_version: 2 });
  configureAccountContext('account-a'); await autoInitAccountKey();
  usePrayerStore.setState({ userId: 'account-a', prayers: [], categories: [], completions: {}, loading: false });
});
afterEach(() => { lock(); vi.useRealTimers(); });

describe('account and key isolation in the prayer store', () => {
  it('never installs a previous account snapshot after a new login', async () => {
    const oldSnapshot = deferred();
    mocks.snapshot.mockImplementation((owner) => owner === 'account-a' ? oldSnapshot.promise : Promise.resolve(null));
    const oldLoad = usePrayerStore.getState().loadData('account-a');
    configureAccountContext('account-b'); await autoInitAccountKey();
    mocks.rows.set('account-b', [prayer('account-b')]);
    await usePrayerStore.getState().loadData('account-b');
    oldSnapshot.resolve({ prayers: [prayer('account-a')], categories: [], completions: {} }); await oldLoad;
    expect(usePrayerStore.getState().userId).toBe('account-b');
    expect(usePrayerStore.getState().prayers.map((row) => row.title)).toEqual(['Private account-b']);
    expect(mocks.save.mock.calls.every(([owner]) => owner === 'account-b')).toBe(true);
  });

  it('allows a new same-account reload while ignoring the older load', async () => {
    const older = deferred();
    mocks.snapshot.mockReturnValueOnce(older.promise).mockResolvedValue(null);
    const oldLoad = usePrayerStore.getState().loadData('account-a');
    mocks.rows.set('account-a', [prayer('account-a', { title: 'Newest server value' })]);
    await usePrayerStore.getState().loadData('account-a');
    older.resolve({ prayers: [prayer('account-a', { title: 'Stale cache' })] }); await oldLoad;
    expect(usePrayerStore.getState().prayers[0].title).toBe('Newest server value');
  });

  it('clears plaintext immediately on lock and rejects an in-flight decrypt', async () => {
    const decrypting = deferred();
    mocks.rows.set('account-a', [prayer('account-a')]); mocks.decrypt.mockReturnValue(decrypting.promise);
    usePrayerStore.setState({ prayers: [prayer('account-a')], categories: [{ id: 'private-category' }], completions: { p: ['2026-10-09'] } });
    const loading = usePrayerStore.getState().loadData('account-a');
    await vi.waitFor(() => expect(mocks.decrypt).toHaveBeenCalled());
    lock();
    expect(usePrayerStore.getState()).toMatchObject({ prayers: [], categories: [], completions: {}, loading: false });
    decrypting.resolve([prayer('account-a')]); await loading;
    expect(usePrayerStore.getState().prayers).toEqual([]);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('does not queue a ciphertext migration after the account changes during encryption', async () => {
    const encrypting = deferred(); mocks.encrypt.mockReturnValue(encrypting.promise);
    mocks.rows.set('account-a', [prayer('account-a', { _encryptionMigrationNeeded: true })]);
    const loading = usePrayerStore.getState().loadData('account-a');
    await vi.waitFor(() => expect(mocks.encrypt).toHaveBeenCalled());
    configureAccountContext('account-b'); await autoInitAccountKey();
    encrypting.resolve({ encrypted_payload: { data: 'old ciphertext' }, encryption_version: 2 }); await loading;
    expect(mocks.enqueue).not.toHaveBeenCalled();
    expect(usePrayerStore.getState().prayers).toEqual([]);
  });

  it('does not attribute an old encrypted child mutation to the next account', async () => {
    const encrypting = deferred(); mocks.child.mockReturnValue(encrypting.promise);
    usePrayerStore.setState({ prayers: [prayer('account-a')] });
    const writing = usePrayerStore.getState().addUpdate('prayer-account-a', 'Private update');
    configureAccountContext('account-b'); await autoInitAccountKey();
    encrypting.resolve({ encrypted_payload: { data: 'old ciphertext' }, encryption_version: 2 }); await writing;
    expect(mocks.enqueue).not.toHaveBeenCalled();
    expect(usePrayerStore.getState().prayers).toEqual([]);
  });

  it('continues an encrypted mutation across a legitimate same-account reload', async () => {
    const encrypting = deferred(); mocks.child.mockReturnValue(encrypting.promise);
    mocks.rows.set('account-a', [prayer('account-a')]);
    usePrayerStore.setState({ prayers: [prayer('account-a')] });
    const writing = usePrayerStore.getState().addUpdate('prayer-account-a', 'Private update');
    await usePrayerStore.getState().loadData('account-a');
    encrypting.resolve({ encrypted_payload: { data: 'ciphertext' }, encryption_version: 2 }); await writing;
    expect(mocks.enqueue).toHaveBeenCalledWith('addUpdateEncrypted', expect.objectContaining({ accountId: 'account-a' }));
  });

  it('never encrypts a former account prayer passed to a persistence helper after login changes', async () => {
    configureAccountContext('account-b'); await autoInitAccountKey(); usePrayerStore.setState({ userId: 'account-b' });
    await usePrayerStore.getState()._persistTestimony(prayer('account-a'), { id: 't', content: 'Private A' });
    await usePrayerStore.getState()._persistEncryptedPoint('prayer-account-a', 'pt', 'Private A', [], 'account-a');
    expect(mocks.child).not.toHaveBeenCalled(); expect(mocks.enqueue).not.toHaveBeenCalled();
  });

  it('discards pending delete snapshots when the journal locks', async () => {
    vi.useFakeTimers(); usePrayerStore.setState({ prayers: [prayer('account-a')] });
    usePrayerStore.getState().softDeletePrayer('prayer-account-a'); lock();
    usePrayerStore.getState().undoDelete('prayer-account-a');
    await vi.advanceTimersByTimeAsync(7000);
    expect(usePrayerStore.getState().prayers).toEqual([]);
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });
});
