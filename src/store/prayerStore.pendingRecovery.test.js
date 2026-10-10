import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => {
  const storage = new Map();
  globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) };
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: false, language: 'en' }, configurable: true });
  return { queue: [], rows: [], snapshot: null, readiness: 'ready', initialization: null, initializing: false, beforeRead: null, readFailure: null };
});
vi.mock('../lib/mutationQueue', () => ({
  enqueue: (kind, args) => { state.queue.push({ id: crypto.randomUUID(), kind, args, accountId: args.accountId }); return true; },
  pendingPrayerIds: () => new Set(state.queue.filter((item) => item.kind === 'createPrayer').map((item) => item.args.row.id)),
  initQueue: async () => { state.initializing = true; if (state.initialization) await state.initialization; },
  queueReadiness: () => state.readiness,
  getPendingMutations: () => structuredClone(state.queue),
}));
vi.mock('../lib/dataCache', () => ({ loadSnapshot: async () => state.snapshot, saveSnapshot: vi.fn() }));
vi.mock('../lib/settingsSync', () => ({ fetchUserSettings: async () => null, saveUserSettings: async () => {}, touchesSyncedSettings: () => false }));
vi.mock('../lib/notificationPrefs', () => ({ isEventPushEnabled: async () => false }));
vi.mock('../push', () => ({ ensurePushSubscription: async () => {} }));
vi.mock('../lib/crypto/groupKeys', () => ({ groupKeyResolver: () => async () => null }));
vi.mock('../lib/crypto/communityCrypto', () => ({ decryptCommunityRow: async (_key, row) => row }));
vi.mock('../lib/supabase', () => ({ supabase: {
  auth: { getUser: async () => ({ data: { user: { id: 'account-a' } } }) },
  from: (table) => {
    const query = { select: () => query, eq: () => query, order: () => query, gte: () => query,
      not: () => query, in: () => query,
      maybeSingle: async () => ({ data: null, error: null }),
      then: async (resolve) => {
        if (state.readFailure === table) return resolve({ data: null, error: new Error('Offline') });
        const rows = table === 'prayers' ? structuredClone(state.rows) : [];
        if (table === 'prayers') await state.beforeRead?.();
        return resolve({ data: rows, error: null });
      } };
    return query;
  },
} }));

import { autoInitAccountKey, configureAccountContext, exportRawMasterKey, importRawMasterKey, lock } from '../lib/crypto/keyManager';
import { decryptPrayerFromStorage, encryptChildForStorage, encryptPrayerForStorage, POINT_SENSITIVE_FIELDS } from '../lib/crypto/prayerCrypto';
import usePrayerStore from './prayerStore';

const original = () => ({ id: 'prayer-a', user_id: 'account-a', title: 'Original title', description: 'Original description',
  person_name: '', phone: '', prayer_updates: [], prayer_testimonies: [], prayer_categories: [],
  prayer_points: [{ id: 'point-a', prayer_id: 'prayer-a', title: 'Original point', verses: [{ ref: 'Psalm 1:1' }] }] });

async function reloadAfterLock() {
  const raw = await exportRawMasterKey();
  lock();
  expect(usePrayerStore.getState().prayers).toEqual([]);
  await importRawMasterKey(raw);
  await usePrayerStore.getState().loadData('account-a');
}

beforeEach(async () => {
  state.queue = []; state.rows = []; state.snapshot = null; state.readiness = 'ready';
  state.initialization = null; state.initializing = false; state.beforeRead = null; state.readFailure = null;
  configureAccountContext('account-a'); lock(); await autoInitAccountKey();
  const plain = original();
  const stored = await encryptPrayerForStorage(plain);
  stored.prayer_points = [await encryptChildForStorage(plain.prayer_points[0], POINT_SENSITIVE_FIELDS, 'account-a')];
  state.rows = [stored];
  usePrayerStore.setState({ userId: 'account-a', prayers: [plain], categories: [], completions: {}, loading: false });
});
afterEach(() => { vi.restoreAllMocks(); lock(); });

describe('pending encrypted work survives recovery reconciliation', () => {
  it('applies the pending title before an offline category failure exposes an older snapshot for another edit', async () => {
    state.snapshot = { prayers: [original()], categories: [], completions: {} };
    await usePrayerStore.getState().updatePrayer('prayer-a', { title: 'Offline title' });
    state.readFailure = 'categories';
    await reloadAfterLock();
    expect(usePrayerStore.getState().prayers[0].title).toBe('Offline title');
    await usePrayerStore.getState().updatePrayer('prayer-a', { description: 'Later offline description' });
    let eventual = state.rows[0];
    for (const item of state.queue) if (item.kind === 'updatePrayer') eventual = { ...eventual, ...item.args.payload };
    expect(await decryptPrayerFromStorage(eventual)).toMatchObject({ title: 'Offline title', description: 'Later offline description' });
  });

  it('preserves a queued child edit when the authenticated cache parent contains older nested rows and prayers cannot be fetched', async () => {
    state.snapshot = { prayers: [await decryptPrayerFromStorage(await encryptPrayerForStorage(original(), { nested: true }))], categories: [], completions: {} };
    await usePrayerStore.getState().addVerseToPoint('prayer-a', 'point-a', { ref: 'Psalm 2:1' });
    state.readFailure = 'prayers';
    await reloadAfterLock();
    expect(usePrayerStore.getState().prayers[0].prayer_points[0].verses.map((verse) => verse.ref)).toEqual(['Psalm 1:1', 'Psalm 2:1']);
    await usePrayerStore.getState().addVerseToPoint('prayer-a', 'point-a', { ref: 'Psalm 3:1' });
    let point = state.rows[0].prayer_points[0];
    for (const item of state.queue) if (item.kind === 'updatePointEncrypted') point = { ...point, ...item.args.row };
    const decrypted = await decryptPrayerFromStorage({ ...state.rows[0], prayer_points: [point] });
    expect(decrypted.prayer_points[0].verses.map((verse) => verse.ref)).toEqual(['Psalm 1:1', 'Psalm 2:1', 'Psalm 3:1']);
  });

  it.each(['queue initialization', 'pending ciphertext decryption'])('keeps an older snapshot uneditable until %s finishes', async (phase) => {
    state.snapshot = { prayers: [original()], categories: [], completions: {} };
    await usePrayerStore.getState().updatePrayer('prayer-a', { title: 'Offline title' });
    const raw = await exportRawMasterKey(); lock(); await importRawMasterKey(raw);
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    let decryptStarted = false;
    if (phase === 'queue initialization') state.initialization = gate;
    else {
      const decrypt = crypto.subtle.decrypt.bind(crypto.subtle);
      vi.spyOn(crypto.subtle, 'decrypt').mockImplementationOnce(async (...args) => {
        decryptStarted = true; await gate; return decrypt(...args);
      });
    }
    const loading = usePrayerStore.getState().loadData('account-a');
    await vi.waitFor(() => expect(phase === 'queue initialization' ? state.initializing : decryptStarted).toBe(true));
    expect(usePrayerStore.getState()).toMatchObject({ loading: true, prayers: [] });
    const queued = state.queue.length;
    await usePrayerStore.getState().updatePrayer('prayer-a', { description: 'Premature edit' });
    expect(state.queue).toHaveLength(queued);
    release(); await loading;
    expect(usePrayerStore.getState().prayers[0]).toMatchObject({ title: 'Offline title', description: 'Original description' });
  });

  it('preserves an offline title edit through lock, stale fetch, description edit and FIFO persistence', async () => {
    await usePrayerStore.getState().updatePrayer('prayer-a', { title: 'Offline title' });
    await reloadAfterLock();
    expect(usePrayerStore.getState().prayers[0].title).toBe('Offline title');
    await usePrayerStore.getState().updatePrayer('prayer-a', { description: 'Later description' });
    let eventual = state.rows[0];
    for (const item of state.queue) if (item.kind === 'updatePrayer') eventual = { ...eventual, ...item.args.payload };
    const decrypted = await decryptPrayerFromStorage(eventual);
    expect(decrypted).toMatchObject({ title: 'Offline title', description: 'Later description' });
  });

  it('preserves queued point verses before a subsequent edit rewrites the child bundle', async () => {
    await usePrayerStore.getState().addVerseToPoint('prayer-a', 'point-a', { ref: 'Psalm 2:1' });
    await reloadAfterLock();
    expect(usePrayerStore.getState().prayers[0].prayer_points[0].verses).toHaveLength(2);
    await usePrayerStore.getState().addVerseToPoint('prayer-a', 'point-a', { ref: 'Psalm 3:1' });
    let point = state.rows[0].prayer_points[0];
    for (const item of state.queue) if (item.kind === 'updatePointEncrypted') point = { ...point, ...item.args.row };
    const decrypted = await decryptPrayerFromStorage({ ...state.rows[0], prayer_points: [point] });
    expect(decrypted.prayer_points[0].verses.map((verse) => verse.ref)).toEqual(['Psalm 1:1', 'Psalm 2:1', 'Psalm 3:1']);
  });

  it('retains paused ciphertext and rejects foreign-account mutations with the same row id', async () => {
    await usePrayerStore.getState().updatePrayer('prayer-a', { title: 'Repairable local title' });
    state.queue[0].paused = true;
    state.queue.push({ ...state.queue[0], id: 'foreign', accountId: 'account-b', args: {
      ...state.queue[0].args, accountId: 'account-b', payload: await encryptPrayerForStorage({ ...original(), title: 'Foreign title' }),
    } });
    await reloadAfterLock();
    expect(usePrayerStore.getState().prayers[0].title).toBe('Repairable local title');
  });

  it('preserves a pending edit flushed while an older server response is in flight', async () => {
    await usePrayerStore.getState().updatePrayer('prayer-a', { title: 'Flushed title' });
    state.beforeRead = () => { state.queue = []; };
    await reloadAfterLock();
    expect(state.queue).toEqual([]);
    expect(usePrayerStore.getState().prayers[0].title).toBe('Flushed title');
  });

  it('keeps the hydrated journal if durable queue ownership cannot be read', async () => {
    state.snapshot = { prayers: [{ ...original(), title: 'Surviving cached journal' }], categories: [], completions: {} };
    state.readiness = 'unavailable';
    await usePrayerStore.getState().loadData('account-a');
    expect(usePrayerStore.getState().prayers[0].title).toBe('Surviving cached journal');
    expect(usePrayerStore.getState().loading).toBe(false);
  });
});
