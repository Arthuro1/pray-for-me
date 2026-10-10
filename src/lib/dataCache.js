import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { isVaultInitialized, isUnlocked, destroyVault, hydrate, getLifecycleToken, isLifecycleCurrent, isAccountContextConfigured } from './crypto/keyManager';
import { encryptPrayersForCache, decryptPrayers } from './crypto/prayerCrypto';
import { clearPlanPersonalizations } from './planPersonalizationStorage';
import { clearAllFormDrafts } from './prayerFormDrafts';
import { clearAccountMutations } from './mutationQueue';

// Persists the user's prayers + categories locally (IndexedDB) so the app can
// hydrate instantly offline — including prayers created offline that aren't on
// the server yet. Keyed per user to avoid cross-account bleed on shared devices.
//
// Sensitive prayer fields are encrypted at rest exactly as they are on the
// server: when the vault is unlocked the snapshot stores ciphertext, and a load
// decrypts it. Legacy users without a vault keep storing plaintext (unchanged).
const hasIDB = typeof indexedDB !== 'undefined';
const key = (userId) => `pfm_data_${userId}`;

export async function loadSnapshot(userId) {
  if (!hasIDB || !userId) return null;
  const token = getLifecycleToken();
  const current = () => isLifecycleCurrent(token) && (!isAccountContextConfigured()
    || (token.accountId === userId && isUnlocked()));
  if (!current()) return null;
  try {
    const snap = await idbGet(key(userId));
    if (!snap || !current()) return null;
    const prayers = await decryptPrayers(snap.prayers);
    return current() ? { ...snap, prayers } : null;
  } catch {
    return null;
  }
}

export async function saveSnapshot(userId, data) {
  if (!hasIDB || !userId) return;
  const token = getLifecycleToken();
  const current = () => isLifecycleCurrent(token) && (!isAccountContextConfigured()
    || (token.accountId === userId && isUnlocked()));
  if (!current()) return;
  await hydrate(); // so isVaultInitialized() reflects IndexedDB, not a cold cache
  // Don't overwrite the at-rest ciphertext while the vault is locked — we have no
  // key to re-encrypt, and the in-memory state may still hold plaintext.
  if (!current() || (isVaultInitialized() && !isUnlocked())) return;
  try {
    const prayers = await encryptPrayersForCache(data.prayers);
    if (!current()) return;
    idbSet(key(userId), { ...data, prayers }).catch(() => {});
  } catch {
    /* encryption unavailable — skip the write rather than persist plaintext */
  }
}

// Wipe every local trace of the user after an account deletion or sign-out on a
// shared device: the cached prayer snapshot, the offline mutation queue, any
// unfinished prayer draft, and the vault record (the wrapped key) in localStorage.
export async function clearLocalData(userId, { preserveRecovery = false } = {}) {
  await clearPlanPersonalizations(userId);
  await clearAllFormDrafts();
  // Ordinary sign-out retains account-scoped wrapped backups, including an
  // interrupted upload. Auth has already synchronously dropped session keys.
  if (!preserveRecovery && (!isAccountContextConfigured() || getLifecycleToken().accountId === userId)) await destroyVault();
  if (!hasIDB) return;
  try {
    if (userId) await idbDel(key(userId));
    if (!preserveRecovery && userId) await clearAccountMutations(userId);
  } catch {
    /* best-effort cleanup */
  }
}
