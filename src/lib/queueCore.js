// Pure transforms for the offline mutation queue — no I/O, so they can be
// unit-tested in isolation. The stateful wrapper (mutationQueue.js) persists
// the result to IndexedDB and runs the executors.

// Appends a mutation to the queue. `id` is injectable for deterministic tests.
export function addItem(queue, kind, args, id = crypto.randomUUID(), now = Date.now()) {
  return [...queue, { id, kind, args, createdAt: now, tries: 0 }];
}

// Removes a processed/dropped item by id (immutably).
export function removeItem(queue, id) {
  return queue.filter((item) => item.id !== id);
}

// Increments the retry counter for an item (after a transient failure).
export function bumpTries(queue, id) {
  return queue.map((item) => (item.id === id ? { ...item, tries: item.tries + 1 } : item));
}

// A "permanent" failure is a 4xx that won't fix itself on retry (validation,
// not-found, conflict) — EXCEPT 401/408/429 which are worth retrying. Network
// errors have no status and are treated as transient.
export function isPermanentError(error) {
  const status = error?.status ?? error?.statusCode ?? error?.code;
  const n = typeof status === 'string' ? parseInt(status, 10) : status;
  if (!Number.isFinite(n)) return false;          // network / unknown → transient
  if (n === 401 || n === 408 || n === 429) return false; // auth/timeout/rate-limit → transient
  return n >= 400 && n < 500;
}

// An auth failure pauses the queue until the session is restored.
export function isAuthError(error) {
  const status = error?.status ?? error?.statusCode;
  return status === 401;
}
