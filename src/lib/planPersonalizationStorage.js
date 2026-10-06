// Private personalization extends plan preferences; it is not a shared family
// record. Reuse the note-draft storage contract: AES-GCM + a non-extractable
// device key in IndexedDB, never plaintext localStorage or a server schedule.
import { get, set, del, keys } from 'idb-keyval';
import { encryptJson, decryptJson } from './crypto/e2ee';
import { sanitizePlanPersonalization } from './planPersonalization';

const PREFIX = 'pfm_plan_personalization:';
const memory = new Map();
const epochs = new Map();
const hasIDB = () => typeof indexedDB !== 'undefined';
const ownerPrefix = (ownerId) => `${PREFIX}${encodeURIComponent(ownerId)}:`;
const slot = (ownerId, prayerId) => `${ownerPrefix(ownerId)}${encodeURIComponent(prayerId)}`;
const context = (ownerId, prayerId) => ({
  entityType: 'plan-personalization', ownerOrGroupId: ownerId,
  recordId: prayerId, keyVersion: 1, field: 'preferences',
});

export async function savePlanPersonalization(ownerId, prayerId, prefs) {
  if (!ownerId || !prayerId) throw new Error('An owner and prayer are required');
  const epoch = epochs.get(ownerId) || 0;
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const payload = await encryptJson(key, sanitizePlanPersonalization(prefs), context(ownerId, prayerId));
  if ((epochs.get(ownerId) || 0) !== epoch) throw new Error('Account changed');
  const record = { v: 1, key, payload };
  const storageKey = slot(ownerId, prayerId);
  if (hasIDB()) {
    try {
      await set(storageKey, record);
      if ((epochs.get(ownerId) || 0) !== epoch) {
        await del(storageKey);
        throw new Error('Account changed');
      }
      memory.delete(storageKey);
      return;
    } catch (error) {
      if ((epochs.get(ownerId) || 0) !== epoch) throw error;
      // Unsupported CryptoKey structured-clone: encrypted memory-only fallback.
      try { await del(storageKey); } catch { /* storage unavailable */ }
    }
  }
  memory.set(storageKey, record);
}

export async function loadPlanPersonalization(ownerId, prayerId) {
  if (!ownerId || !prayerId) return null;
  const epoch = epochs.get(ownerId) || 0;
  const storageKey = slot(ownerId, prayerId);

  // READING can fail for reasons that say nothing about the record: private
  // browsing, a quota error, a blocked database upgrade. Those must not destroy
  // a partner's and children's names — the run simply stays generic this time.
  let record;
  try {
    record = memory.get(storageKey) || (hasIDB() ? await get(storageKey) : null);
  } catch {
    return null;
  }
  if (!record) return null;

  // A record that is the wrong shape, or whose ciphertext fails GCM
  // authentication, cannot be trusted — that one IS deleted rather than kept.
  try {
    if (record.v !== 1 || !record.key || record.key.extractable !== false) throw new Error('Invalid private preferences');
    const prefs = await decryptJson(record.key, record.payload, context(ownerId, prayerId));
    return (epochs.get(ownerId) || 0) === epoch ? sanitizePlanPersonalization(prefs) : null;
  } catch {
    await clearPlanPersonalization(ownerId, prayerId);
    return null;
  }
}

export async function clearPlanPersonalization(ownerId, prayerId) {
  if (!ownerId || !prayerId) return;
  const storageKey = slot(ownerId, prayerId);
  memory.delete(storageKey);
  if (hasIDB()) { try { await del(storageKey); } catch { /* best-effort erasure */ } }
}

// Sign-out / account erasure clears only that account's private names and
// selections. Each run has its own key, so restarting never rewrites history.
export async function clearPlanPersonalizations(ownerId) {
  if (!ownerId) return;
  epochs.set(ownerId, (epochs.get(ownerId) || 0) + 1);
  const prefix = ownerPrefix(ownerId);
  for (const storageKey of memory.keys()) if (storageKey.startsWith(prefix)) memory.delete(storageKey);
  if (hasIDB()) {
    try {
      const owned = (await keys()).filter((key) => typeof key === 'string' && key.startsWith(prefix));
      await Promise.all(owned.map((key) => del(key)));
    } catch { /* best-effort erasure */ }
  }
}

export function __resetPlanPersonalizationMemoryForTests() { memory.clear(); }
