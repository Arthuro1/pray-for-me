import { get as idbGet, update as idbUpdate } from 'idb-keyval';
import { addItem, removeItem, bumpTries, isPermanentError, isAuthError, MAX_TRIES } from './queueCore';
import { getLifecycleToken, isLifecycleCurrent, isAccountContextConfigured, isUnlocked, onLockChange } from './crypto/keyManager';
import { devError } from './logger';

// Entries remain durable across sign-out. New items carry their account;
// unowned older entries are retained for verified migration, never replayed
// under whichever account happens to sign in next.
const STORAGE_KEY = 'pfm_mutation_queue';
const hasIDB = typeof indexedDB !== 'undefined';
let queue = [];
let flushing = false;
let initialized = false;
let initialization = null;
let readUnavailable = false;
let persistence = Promise.resolve();
let lastScheduledSnapshot = new Map();
const executors = {};
const listeners = new Set();
let onDrop = null;

const isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false;
const notify = () => listeners.forEach((fn) => fn(queue.length));
const ownedByCurrentAccount = (item) => !isAccountContextConfigured()
  || (!!getLifecycleToken().accountId && item.accountId === getLifecycleToken().accountId);
const carriesCiphertext = (item) => [item.args?.row, item.args?.payload]
  .some((row) => row?.encrypted_payload != null || row?.encryption_version != null);

function validateStoredQueue(stored) {
  if (stored != null && (!Array.isArray(stored) || stored.some((item) => !item || typeof item.id !== 'string'
    || typeof item.kind !== 'string' || !item.args || typeof item.args !== 'object' || Array.isArray(item.args))
    || new Set(stored.map((item) => item.id)).size !== stored.length)) {
    throw new Error('Invalid mutation metadata');
  }
  return stored || [];
}

const snapshotOf = (items) => new Map(items.map((item) => [item.id, JSON.stringify(item)]));

function persist() {
  if (!hasIDB || !initialized || readUnavailable) return;
  const next = snapshotOf(queue);
  const removed = [...lastScheduledSnapshot.keys()].filter((id) => !next.has(id));
  const added = queue.filter((item) => !lastScheduledSnapshot.has(item.id)).map((item) => structuredClone(item));
  const changed = queue.filter((item) => lastScheduledSnapshot.has(item.id)
    && lastScheduledSnapshot.get(item.id) !== next.get(item.id)).map((item) => structuredClone(item));
  lastScheduledSnapshot = next;
  if (!removed.length && !added.length && !changed.length) return;
  // Each IndexedDB read/write transaction applies only this tab's delta.
  // A stale whole-array snapshot must never erase another tab's sole copy.
  persistence = persistence.then(() => idbUpdate(STORAGE_KEY, (stored) => {
    const merged = new Map(validateStoredQueue(stored).map((item) => [item.id, item]));
    for (const id of removed) merged.delete(id);
    for (const item of changed) {
      const current = merged.get(item.id);
      // A completed/deleted durable ID stays absent even if another tab was
      // still retrying it. Paused terminal failures cannot be unpaused by a
      // stale retry, and retry counters never move backwards.
      if (current) merged.set(item.id, { ...item, tries: Math.max(current.tries || 0, item.tries || 0),
        ...(current.paused || item.paused ? { paused: true } : {}) });
    }
    for (const item of added) if (!merged.has(item.id)) merged.set(item.id, item);
    return [...merged.values()];
  })).catch((error) => {
    readUnavailable = true;
    notify();
    throw error;
  });
  persistence.catch(() => {});
}

export function registerMutation(kind, executor) { executors[kind] = executor; }
export function onMutationDropped(fn) { onDrop = fn; }
export function pendingCount() { return queue.length; }
export function queueReadiness() { return readUnavailable ? 'unavailable' : initialized ? 'ready' : 'loading'; }
// Call initQueue first and fail closed when queueReadiness is unavailable.
// Reconciliation needs paused ciphertext too: it may be the only saved edit.
export function getPendingMutations() { return structuredClone(queue.filter(ownedByCurrentAccount)); }
export function pendingPrayerIds() {
  return new Set(queue.filter((item) => ownedByCurrentAccount(item) && item.kind === 'createPrayer')
    .map((item) => item.args?.row?.id).filter(Boolean));
}
export function subscribeQueue(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function initQueue() {
  if (initialized) return Promise.resolve();
  if (initialization) return initialization;
  initialization = (async () => {
    try {
      const stored = hasIDB ? await idbGet(STORAGE_KEY) : null;
      const durable = validateStoredQueue(stored);
      lastScheduledSnapshot = snapshotOf(durable);
      const ids = new Set(queue.map((item) => item.id));
      queue = [...durable.filter((item) => !ids.has(item.id)), ...queue];
      initialized = true;
      readUnavailable = false;
      persist();
    } catch { readUnavailable = true; }
    notify();
    if (initialized) void flushQueue();
  })().finally(() => { initialization = null; });
  return initialization;
}

export function enqueue(kind, args) {
  const token = getLifecycleToken();
  const owner = args?.accountId || args?.row?.user_id || token.accountId;
  if (isAccountContextConfigured() && (!token.accountId || owner !== token.accountId || !isUnlocked())) return false;
  const next = addItem(queue, kind, args);
  next[next.length - 1] = { ...next[next.length - 1], ...(owner ? { accountId: owner } : {}) };
  queue = next;
  persist();
  notify();
  if (!initialized) void initQueue();
  else void flushQueue();
  return true;
}

// Deletion removes only proven-owned entries. Unassigned legacy work may
// belong to another account and is preserved rather than guessed away.
export async function clearAccountMutations(userId) {
  if (!userId) return false;
  await initQueue();
  if (readUnavailable) return false;
  await persistence.catch(() => {});
  if (readUnavailable) return false;
  try {
    // Account erasure includes proven-owned work another tab added after this
    // tab initialized. The transaction retains foreign and unassigned entries.
    if (hasIDB) await idbUpdate(STORAGE_KEY, (stored) => validateStoredQueue(stored)
      .filter((item) => item.accountId !== userId));
    queue = queue.filter((item) => item.accountId !== userId);
    // Remove erased IDs from the scheduled baseline as well; they must never
    // become additions again merely because another local delta is scheduled.
    for (const [id, serialized] of lastScheduledSnapshot) {
      if (JSON.parse(serialized).accountId === userId) lastScheduledSnapshot.delete(id);
    }
  } catch { readUnavailable = true; }
  notify();
  return !readUnavailable;
}

export async function flushQueue() {
  if (!initialized) { await initQueue(); if (!initialized) return; }
  await persistence.catch(() => {});
  if (flushing || !isOnline() || readUnavailable) return;
  flushing = true;
  const start = getLifecycleToken();
  try {
    while (isOnline() && isLifecycleCurrent(start)) {
      await persistence.catch(() => {});
      if (readUnavailable || !isLifecycleCurrent(start)) break;
      // FIFO within an account. Other accounts, unassigned legacy items and
      // future mutation types remain intact and cannot run here.
      let item = queue.find((entry) => !entry.paused && ownedByCurrentAccount(entry) && executors[entry.kind]);
      if (!item) break;
      if (hasIDB) {
        try {
          const durable = validateStoredQueue(await idbGet(STORAGE_KEY)).find((entry) => entry.id === item.id);
          if (!isLifecycleCurrent(start)) break;
          if (!durable || durable.paused || !ownedByCurrentAccount(durable)) {
            // A disconnected tab must not replay an item another tab already
            // completed, removed or paused. Other pending local deltas remain.
            queue = durable ? queue.map((entry) => entry.id === item.id ? structuredClone(durable) : entry)
              : removeItem(queue, item.id);
            persist(); notify();
            continue;
          }
          if (!queue.some((entry) => entry.id === item.id)) continue;
          item = durable;
        } catch { readUnavailable = true; notify(); break; }
      }
      try {
        await executors[item.kind](item.args);
        if (!isLifecycleCurrent(start) || !ownedByCurrentAccount(item)) break;
        queue = removeItem(queue, item.id);
        persist();
        notify();
      } catch (error) {
        if (!isLifecycleCurrent(start) || !ownedByCurrentAccount(item)) break;
        devError(`[mutationQueue] ${item.kind} failed (status ${error?.status ?? '?'})`);
        if (isAuthError(error)) break;
        if (isPermanentError(error) || item.tries + 1 >= MAX_TRIES) {
          // A rejected encrypted write may be the only copy of years of
          // private history. Retain it durably for explicit repair/export;
          // never keep retrying a terminal failure or discard its ciphertext.
          queue = carriesCiphertext(item)
            ? queue.map((entry) => entry.id === item.id ? { ...entry, paused: true, tries: item.tries + 1 } : entry)
            : removeItem(queue, item.id);
          persist(); notify(); onDrop?.(item, error);
          continue;
        }
        queue = bumpTries(queue, item.id);
        persist();
        break;
      }
    }
  } finally {
    flushing = false;
    if (!isLifecycleCurrent(start)) void flushQueue();
  }
}

onLockChange((unlocked) => { if (unlocked) void flushQueue(); });
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { void flushQueue(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void flushQueue(); });
}
