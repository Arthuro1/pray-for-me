import { get as idbGet, set as idbSet } from 'idb-keyval';
import { addItem, removeItem, bumpTries, isPermanentError, isAuthError } from './queueCore';

// Durable, FIFO offline write queue. Store actions enqueue a mutation (after
// applying their optimistic local change); this module persists it to
// IndexedDB and replays it against the server when online. Executors hold the
// actual Supabase calls and are registered by the stores so server logic isn't
// duplicated here.

const STORAGE_KEY = 'pfm_mutation_queue';
const hasIDB = typeof indexedDB !== 'undefined';

let queue = [];
let flushing = false;
let loaded = false;
const executors = {};        // { [kind]: async (args) => void }
const listeners = new Set(); // notified with the pending count
let onDrop = null;           // optional callback when a mutation is dropped (permanent error)

const persist = () => { if (hasIDB) idbSet(STORAGE_KEY, queue).catch(() => {}); };
const notify = () => listeners.forEach((fn) => fn(queue.length));

export function registerMutation(kind, executor) { executors[kind] = executor; }
export function onMutationDropped(fn) { onDrop = fn; }
export function pendingCount() { return queue.length; }
// Ids of prayers whose creation is still queued — used by loadData to decide
// which local-only prayers are genuine pending creates (vs. dropped ghosts).
export function pendingPrayerIds() {
  return new Set(queue.filter((i) => i.kind === 'createPrayer').map((i) => i.args?.row?.id).filter(Boolean));
}
export function subscribeQueue(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// Load any queue persisted from a previous session, wire reconnect triggers.
export async function initQueue() {
  if (loaded) return;
  loaded = true;
  if (hasIDB) { try { queue = (await idbGet(STORAGE_KEY)) || []; } catch { queue = []; } }
  notify();
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => flushQueue());
    document.addEventListener('visibilitychange', () => { if (!document.hidden) flushQueue(); });
  }
  flushQueue();
}

export function enqueue(kind, args) {
  queue = addItem(queue, kind, args);
  persist();
  notify();
  flushQueue();
}

const isOnline = () => (typeof navigator === 'undefined' ? true : navigator.onLine);

// Drain the queue one item at a time (preserving order). Stops on the first
// transient failure (offline/network/auth) and resumes on the next trigger.
export async function flushQueue() {
  if (flushing || !isOnline() || queue.length === 0) return;
  flushing = true;
  try {
    while (queue.length > 0 && isOnline()) {
      const item = queue[0];
      const executor = executors[item.kind];
      if (!executor) { queue = removeItem(queue, item.id); persist(); continue; } // unknown kind → drop
      try {
        await executor(item.args);
        queue = removeItem(queue, item.id);
        persist();
        notify();
      } catch (err) {
        if (isAuthError(err)) break;            // pause until session restored
        if (isPermanentError(err)) {            // won't recover → drop + surface
          queue = removeItem(queue, item.id);
          persist();
          notify();
          onDrop?.(item, err);
          continue;
        }
        queue = bumpTries(queue, item.id);      // transient → stop, retry later
        persist();
        break;
      }
    }
  } finally {
    flushing = false;
  }
}
