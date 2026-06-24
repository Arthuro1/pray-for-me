import { get as idbGet, set as idbSet } from 'idb-keyval';

// Persists the user's prayers + categories locally (IndexedDB) so the app can
// hydrate instantly offline — including prayers created offline that aren't on
// the server yet. Keyed per user to avoid cross-account bleed on shared devices.
const hasIDB = typeof indexedDB !== 'undefined';
const key = (userId) => `pfm_data_${userId}`;

export async function loadSnapshot(userId) {
  if (!hasIDB || !userId) return null;
  try { return (await idbGet(key(userId))) || null; } catch { return null; }
}

export function saveSnapshot(userId, data) {
  if (!hasIDB || !userId) return;
  idbSet(key(userId), data).catch(() => {});
}
