import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ records: new Map(), accountId: 'account-a', generation: 0, readError: false, unlocked: true }));
vi.mock('idb-keyval', () => ({
  get: async (key) => { if (state.readError) throw new Error('Storage unavailable'); return state.records.get(key); },
  set: async (key, value) => { state.records.set(key, value); },
  update: async (key, updater) => {
    if (state.readError) throw new Error('Storage unavailable');
    state.records.set(key, structuredClone(updater(structuredClone(state.records.get(key)))));
  },
}));
vi.mock('./crypto/keyManager', () => ({
  getLifecycleToken: () => ({ accountId: state.accountId, generation: state.generation }),
  isLifecycleCurrent: (token) => token.accountId === state.accountId && token.generation === state.generation,
  isAccountContextConfigured: () => true, isUnlocked: () => state.unlocked, onLockChange: () => () => {},
}));

const item = (id, accountId) => ({ id, kind: 'write', args: { row: { encrypted_payload: { data: id } } }, tries: 0,
  ...(accountId ? { accountId } : {}) });
const switchAccount = (accountId) => { state.accountId = accountId; state.generation += 1; };
const setOnline = (value) => Object.defineProperty(globalThis, 'navigator', { value: { onLine: value }, configurable: true });

beforeEach(() => {
  vi.resetModules(); state.records.clear(); state.accountId = 'account-a'; state.generation = 0; state.readError = false; state.unlocked = true;
  globalThis.indexedDB = {}; setOnline(false);
});

describe('durable mutation account isolation', () => {
  it('executes only the current account and retains unassigned and foreign ciphertext', async () => {
    state.records.set('pfm_mutation_queue', [item('legacy'), item('a', 'account-a'), item('b', 'account-b')]);
    const queue = await import('./mutationQueue'); const execute = vi.fn(async () => {});
    queue.registerMutation('write', execute); await queue.initQueue();
    setOnline(true); await queue.flushQueue();
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls[0][0].row.encrypted_payload.data).toBe('a');
    expect(queue.pendingCount()).toBe(2);
    switchAccount('account-b'); await queue.flushQueue();
    expect(execute).toHaveBeenCalledTimes(2); expect(queue.pendingCount()).toBe(1);
    await queue.clearAccountMutations('account-b');
    expect(state.records.get('pfm_mutation_queue').map((entry) => entry.id)).toEqual(['legacy']);
  });

  it('exposes cloned owned pending ciphertext in FIFO order, including paused edits', async () => {
    state.records.set('pfm_mutation_queue', [item('legacy'), item('a', 'account-a'),
      { ...item('paused', 'account-a'), paused: true }, item('b', 'account-b')]);
    const queue = await import('./mutationQueue'); await queue.initQueue();
    const pending = queue.getPendingMutations();
    expect(pending.map((entry) => entry.id)).toEqual(['a', 'paused']);
    pending[0].args.row.encrypted_payload.data = 'mutated outside queue'; pending.pop();
    expect(queue.getPendingMutations().map((entry) => entry.args.row.encrypted_payload.data)).toEqual(['a', 'paused']);
  });

  it('stamps newly queued writes and rejects explicit foreign ownership', async () => {
    const queue = await import('./mutationQueue'); await queue.initQueue();
    expect(queue.enqueue('write', { row: { encrypted_payload: { data: 'a' } } })).toBe(true);
    expect(queue.enqueue('write', { row: { user_id: 'account-b', encrypted_payload: { data: 'b' } } })).toBe(false);
    await queue.clearAccountMutations('no-account');
    expect(state.records.get('pfm_mutation_queue')).toHaveLength(1);
    expect(state.records.get('pfm_mutation_queue')[0].accountId).toBe('account-a');
    state.unlocked = false;
    expect(queue.enqueue('write', { row: {} })).toBe(false);
    switchAccount(null);
    expect(queue.enqueue('write', { row: {} })).toBe(false);
  });

  it('does not acknowledge or retry an old account item after an async executor crosses login', async () => {
    let resolve;
    const pending = new Promise((done) => { resolve = done; });
    state.records.set('pfm_mutation_queue', [item('a', 'account-a')]);
    const queue = await import('./mutationQueue'); const execute = vi.fn(() => pending);
    queue.registerMutation('write', execute); await queue.initQueue();
    setOnline(true); const flushing = queue.flushQueue();
    await vi.waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
    switchAccount('account-b'); setOnline(false); resolve(); await flushing;
    expect(queue.pendingCount()).toBe(1);
    await queue.clearAccountMutations('no-account');
    expect(state.records.get('pfm_mutation_queue')[0]).toMatchObject({ id: 'a', accountId: 'account-a', tries: 0 });
  });

  it('retains unreadable legacy storage and pauses until its inventory can be verified', async () => {
    const malformed = { unrecognized: 'original ciphertext metadata' }; state.records.set('pfm_mutation_queue', malformed);
    const queue = await import('./mutationQueue'); await queue.initQueue();
    expect(queue.queueReadiness()).toBe('unavailable');
    queue.enqueue('write', { row: { encrypted_payload: { data: 'unsaved' } } });
    expect(await queue.clearAccountMutations('account-a')).toBe(false);
    expect(state.records.get('pfm_mutation_queue')).toBe(malformed);
    expect(queue.pendingCount()).toBe(1);
  });

  it('account erasure deletes only proven owned pending writes', async () => {
    state.records.set('pfm_mutation_queue', [item('legacy'), item('a', 'account-a'), item('b', 'account-b')]);
    const queue = await import('./mutationQueue'); await queue.initQueue();
    expect(await queue.clearAccountMutations('account-a')).toBe(true);
    expect(state.records.get('pfm_mutation_queue').map((entry) => entry.id)).toEqual(['legacy', 'b']);
  });

  it('durably pauses terminal encrypted failures without losing their only ciphertext or retrying', async () => {
    state.records.set('pfm_mutation_queue', [item('only-copy', 'account-a')]);
    const queue = await import('./mutationQueue');
    const execute = vi.fn(async () => { throw Object.assign(new Error('Private server detail'), { status: 400 }); });
    const notifyFailure = vi.fn(); queue.onMutationDropped(notifyFailure);
    queue.registerMutation('write', execute); await queue.initQueue();
    setOnline(true); await queue.flushQueue(); await queue.flushQueue();
    expect(execute).toHaveBeenCalledTimes(1); expect(notifyFailure).toHaveBeenCalledTimes(1);
    expect(queue.pendingCount()).toBe(1);
    await queue.clearAccountMutations('no-account');
    const retained = state.records.get('pfm_mutation_queue')[0];
    expect(retained).toMatchObject({ paused: true, tries: 1, args: { row: { encrypted_payload: { data: 'only-copy' } } } });
    expect(JSON.stringify(retained)).not.toContain('Private server detail');
    vi.resetModules(); const restored = await import('./mutationQueue'); restored.registerMutation('write', execute);
    await restored.initQueue(); await restored.flushQueue();
    expect(execute).toHaveBeenCalledTimes(1); expect(restored.pendingCount()).toBe(1);
  });

  it('atomically preserves new ciphertext added concurrently by two isolated tabs', async () => {
    const tabA = await import('./mutationQueue'); await tabA.initQueue();
    vi.resetModules(); const tabB = await import('./mutationQueue'); await tabB.initQueue();
    expect(tabA.enqueue('write', { row: { encrypted_payload: { data: 'from a' } } })).toBe(true);
    expect(tabB.enqueue('write', { row: { encrypted_payload: { data: 'from b' } } })).toBe(true);
    await Promise.all([tabA.clearAccountMutations('no-account'), tabB.clearAccountMutations('no-account')]);
    expect(state.records.get('pfm_mutation_queue').map((entry) => entry.args.row.encrypted_payload.data).sort()).toEqual(['from a', 'from b']);
  });

  it('never resurrects a completed durable item when another tab persists a stale retry', async () => {
    state.records.set('pfm_mutation_queue', [item('completed', 'account-a')]);
    const tabA = await import('./mutationQueue'); await tabA.initQueue();
    vi.resetModules(); const tabB = await import('./mutationQueue'); await tabB.initQueue();
    tabA.registerMutation('write', async () => {});
    const staleExecute = vi.fn(async () => { throw new Error('Transient offline failure'); });
    tabB.registerMutation('write', staleExecute);
    setOnline(true); await tabA.flushQueue(); await tabA.clearAccountMutations('no-account');
    expect(state.records.get('pfm_mutation_queue')).toEqual([]);
    await tabB.flushQueue(); await tabB.clearAccountMutations('no-account');
    expect(state.records.get('pfm_mutation_queue')).toEqual([]);
    expect(staleExecute).not.toHaveBeenCalled();
  });

  it('retains a terminal pause when another tab persists an older retry state', async () => {
    state.records.set('pfm_mutation_queue', [item('paused', 'account-a')]);
    const tabA = await import('./mutationQueue'); await tabA.initQueue();
    vi.resetModules(); const tabB = await import('./mutationQueue'); await tabB.initQueue();
    tabA.registerMutation('write', async () => { throw Object.assign(new Error('Rejected'), { status: 400 }); });
    tabB.registerMutation('write', async () => { throw new Error('Offline'); });
    setOnline(true); await tabA.flushQueue(); await tabA.clearAccountMutations('no-account');
    await tabB.flushQueue(); await tabB.clearAccountMutations('no-account');
    expect(state.records.get('pfm_mutation_queue')[0]).toMatchObject({ id: 'paused', paused: true, tries: 1 });
  });

  it('erases proven-owned durable work another tab added after local initialization', async () => {
    state.records.set('pfm_mutation_queue', [item('legacy'), item('foreign', 'account-b')]);
    const tabA = await import('./mutationQueue'); await tabA.initQueue();
    vi.resetModules(); const tabB = await import('./mutationQueue'); await tabB.initQueue();
    tabB.enqueue('write', { row: { encrypted_payload: { data: 'new owned sole copy' } } });
    await tabB.clearAccountMutations('no-account');
    expect(state.records.get('pfm_mutation_queue')).toHaveLength(3);
    expect(await tabA.clearAccountMutations('account-a')).toBe(true);
    expect(state.records.get('pfm_mutation_queue').map((entry) => entry.id)).toEqual(['legacy', 'foreign']);
    const execute = vi.fn(); tabB.registerMutation('write', execute); setOnline(true); await tabB.flushQueue();
    expect(execute).not.toHaveBeenCalled();
    expect(state.records.get('pfm_mutation_queue').map((entry) => entry.id)).toEqual(['legacy', 'foreign']);
  });

  it('does not overwrite durable data or execute unsaved work after an atomic read fails', async () => {
    const original = [item('original', 'account-b')]; state.records.set('pfm_mutation_queue', original);
    const queue = await import('./mutationQueue'); const execute = vi.fn();
    queue.registerMutation('write', execute); await queue.initQueue(); state.readError = true;
    queue.enqueue('write', { row: { encrypted_payload: { data: 'new' } } });
    setOnline(true); await queue.flushQueue();
    expect(queue.queueReadiness()).toBe('unavailable'); expect(execute).not.toHaveBeenCalled();
    expect(state.records.get('pfm_mutation_queue')).toBe(original);
  });
});
