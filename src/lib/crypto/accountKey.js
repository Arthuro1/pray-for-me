// Account content key (ACK) provisioning — the entry point that makes personal
// prayer encryption the DEFAULT, with no manual "Prayer Vault" setup.
//
// Model:
//   • On first authenticated use we auto-generate a random AES-256-GCM ACK and
//     persist its raw bytes in IndexedDB, scoped to the user. Encryption then
//     works immediately and invisibly (keyManager.isUnlocked() is true).
//   • The per-user slot SURVIVES sign-out (so re-login on the same device stays
//     transparent) but never bleeds across accounts (it is keyed by user id).
//     Only account deletion clears it (forgetAccountKey).
//   • Recovery / cross-device access is layered on later via keyManager
//     .setUpRecovery(): that wraps the SAME key under a passphrase + recovery
//     code and syncs the wrapped record. A brand-new device therefore cannot
//     read encrypted rows until recovery is used — honest, per the privacy copy.
//
// Trade-off: the raw key lives at rest in IndexedDB (same threat model as the
// existing tab-scoped sessionStorage mirror). This is the deliberate cost of
// "encryption is automatic and invisible" — anything that can run JS in the page
// could already read the in-memory key.
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import * as km from './keyManager';
import { supabase } from '../supabase';
import { VAULT_SYNC } from '../vaultSync';
import { regenerateIdentityKey } from './userKeys';
import { clearGroupKeyDistributionCache } from './groupKeys';

const hasIDB = () => typeof indexedDB !== 'undefined';
const slot = (userId) => `pfm_ak_${userId}`;
const lockSlot = (userId) => `pfm_ak_locked_${userId}`;
const contextMatches = (userId, token = km.getLifecycleToken()) => km.isLifecycleCurrent(token)
  && (token.accountId === userId || (!km.isAccountContextConfigured() && token.accountId === null));
const persistenceOperations = new Map();

async function drainAccountPersistence(userId) {
  const pending = persistenceOperations.get(userId);
  if (pending?.size) await Promise.allSettled([...pending]);
}

function localStorageRef() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

function explicitLockToken(userId) {
  return userId ? localStorageRef()?.getItem(lockSlot(userId)) : null;
}

function setExplicitlyLocked(userId, locked) {
  if (!userId) return null;
  try {
    if (locked) {
      const token = `${Date.now()}:${crypto.randomUUID?.() ?? Math.random()}`;
      localStorageRef()?.setItem(lockSlot(userId), token);
      return token;
    }
    localStorageRef()?.removeItem(lockSlot(userId));
  } catch { /* best-effort; the in-memory lock still takes effect */ }
  return null;
}

function clearExplicitLock(userId, expectedToken) {
  if (expectedToken && explicitLockToken(userId) !== expectedToken) return false;
  setExplicitlyLocked(userId, false);
  return true;
}

// Outcomes of ensureAccountCryptoReady, so the app can render the right gate.
export const CRYPTO_STATUS = {
  READY: 'ready',       // a key is in memory (restored or freshly provisioned)
  LOCKED: 'locked',     // a recovery record exists but isn't unlocked (VaultLockScreen)
  ORPHANED: 'orphaned', // server has encrypted data but this device has no key and no recovery
  UNAVAILABLE: 'unavailable', // server state could not be verified; retry without changing keys
};

const SERVER_STATE = {
  PRESENT: 'present',
  ABSENT: 'absent',
  UNKNOWN: 'unknown',
};

function containsEncryptedHistory(value, depth = 0) {
  if (value == null || typeof value !== 'object') return false;
  if (depth > 20) throw new Error('History metadata exceeds supported depth');
  if (value.encrypted_payload != null || value.encryption_version != null
    || (value.key != null && value.iv != null && value.path != null)) return true;
  return Object.values(value).some((child) => containsEncryptedHistory(child, depth + 1));
}

async function localEncryptionState(userId) {
  if (!hasIDB()) return SERVER_STATE.ABSENT;
  try {
    const [snapshot, pending, protectedDevice] = await Promise.all([
      idbGet(`pfm_data_${userId}`), idbGet('pfm_mutation_queue'), idbGet(`pfm_protected_device_v1:${userId}`),
    ]);
    // A surviving protected wrapper without a policy is still recovery evidence.
    if (protectedDevice != null) return SERVER_STATE.UNKNOWN;
    if (snapshot != null && (typeof snapshot !== 'object' || !Array.isArray(snapshot.prayers))) return SERVER_STATE.UNKNOWN;
    if (containsEncryptedHistory(snapshot)) return SERVER_STATE.PRESENT;
    if (pending != null && !Array.isArray(pending)) return SERVER_STATE.UNKNOWN;
    for (const item of pending || []) {
      if (!item || typeof item !== 'object' || !item.args || typeof item.args !== 'object') return SERVER_STATE.UNKNOWN;
      const owner = item.accountId || item.args.accountId || item.args.row?.user_id;
      if (owner && owner !== userId) continue;
      // An older unowned encrypted mutation may be the only remaining copy.
      if (containsEncryptedHistory(item.args)) return SERVER_STATE.PRESENT;
    }
    return SERVER_STATE.ABSENT;
  } catch { return SERVER_STATE.UNKNOWN; }
}

// Check the entire owned history, including encrypted children of plaintext
// parents, attachment keys and pending local writes. Any incomplete inventory
// fails closed: an outage is never permission to mint a replacement ACK.
async function hasServerEncryptionState(userId) {
  if (!userId) return SERVER_STATE.UNKNOWN;
  try {
    const localState = await localEncryptionState(userId);
    if (localState !== SERVER_STATE.ABSENT) return localState;
    const { data: keyRow, error: keyError } = await supabase
      .from('user_crypto_keys').select('user_id').eq('user_id', userId).maybeSingle();
    if (keyError) return SERVER_STATE.UNKNOWN;
    if (keyRow) return SERVER_STATE.PRESENT;
    // Filter child rows on the server before limiting, so a plaintext parent's
    // thousandth child cannot hide the only ciphertext in a truncated embed.
    for (const table of ['prayer_updates', 'prayer_points', 'prayer_testimonies']) {
      const { data, error } = await supabase.from(table).select('id, prayers!inner(user_id)')
        .eq('prayers.user_id', userId)
        .or('encrypted_payload.not.is.null,encryption_version.not.is.null').limit(1).maybeSingle();
      if (error) return SERVER_STATE.UNKNOWN;
      if (data) return SERVER_STATE.PRESENT;
    }
    for (const table of ['prayer_updates', 'prayer_testimonies']) {
      const { data, error } = await supabase.from(table).select('id, prayers!inner(user_id)')
        .eq('prayers.user_id', userId).not('attachments', 'is', null).neq('attachments', '[]').limit(1).maybeSingle();
      if (error) return SERVER_STATE.UNKNOWN;
      if (data) return SERVER_STATE.PRESENT;
    }
    const pageSize = 500;
    for (let offset = 0; offset < 100000; offset += pageSize) {
      const { data, error } = await supabase.from('prayers')
        .select(`id, encrypted_payload, encryption_version,
          prayer_updates(encrypted_payload, encryption_version, attachments),
          prayer_points(encrypted_payload, encryption_version),
          prayer_testimonies(encrypted_payload, encryption_version, attachments)`)
        .eq('user_id', userId).order('id').range(offset, offset + pageSize - 1);
      if (error || !Array.isArray(data)) return SERVER_STATE.UNKNOWN;
      if (containsEncryptedHistory(data)) return SERVER_STATE.PRESENT;
      if (data.length < pageSize) return SERVER_STATE.ABSENT;
    }
    return SERVER_STATE.UNKNOWN;
  } catch {
    return SERVER_STATE.UNKNOWN;
  }
}

// Ensure an account key is ready for the signed-in user. Idempotent; safe to
// call on every boot. Returns a CRYPTO_STATUS so the caller can gate the UI.
// `recoverySync` is the VAULT_SYNC result of the caller's pullVaultRecord() —
// what the SERVER holds — which is the only way to tell "this user never set up
// recovery" apart from "we could not read their recovery record".
// Order:
//   1. If a key is already in memory (session mirror / earlier call) → reuse it.
//   2. Restore the transparent per-user key from IndexedDB.
//   3. If a recovery record exists but no local key → a new/other device; stay
//      LOCKED so the recovery unlock UI (VaultLockScreen) can handle it.
//   4. If the recovery lookup itself failed → UNAVAILABLE. A record may well
//      exist; treating the blip as "none" would offer to discard recoverable
//      prayers on the very screen that says no recovery was set up.
//   5. If the server shows this user already has encrypted data but we reach
//      here with no local key and no recovery record → ORPHANED. Do NOT mint a
//      new key (that would silently orphan the existing ciphertext); surface the
//      recovery screen so the user makes an explicit choice.
//   6. Otherwise this is genuine first use → auto-provision the key transparently.
export async function ensureAccountCryptoReady(userId, recoverySync, { verifyCandidate } = {}) {
  let token = km.getLifecycleToken();
  if (!userId || !contextMatches(userId, token)) return CRYPTO_STATUS.UNAVAILABLE;
  await km.hydrate();
  if (!contextMatches(userId, token)) return CRYPTO_STATUS.UNAVAILABLE;
  const protection = km.getDeviceProtectionPolicy(userId);
  if (protection === 'unknown') { km.lock(); return CRYPTO_STATUS.UNAVAILABLE; }
  // A protected device may only regain its original key through an authorized
  // unwrap. Missing/corrupt protected metadata must never create a new key.
  if (protection === 'protected') {
    return km.isUnlocked() ? CRYPTO_STATUS.READY : CRYPTO_STATUS.LOCKED;
  }
  // An explicit Lock action must survive refresh and sign-in. Without this
  // marker, step 2 below immediately re-imported the raw device key, making the
  // Lock button look broken. Lock first in case a tab-scoped session key was
  // restored during hydration.
  if (explicitLockToken(userId)) {
    km.lock();
    token = km.getLifecycleToken();
    if (km.isVaultInitialized()) return CRYPTO_STATUS.LOCKED;
    // The wrapped record may have been cleared during sign-out and still need
    // to be pulled. Never mint a replacement key while that lookup is unknown.
    if (recoverySync === VAULT_SYNC.UNKNOWN) return CRYPTO_STATUS.UNAVAILABLE;
    // A definitive absence means the marker is stale (the Lock control is only
    // offered for recovery-enabled vaults). Continue through orphan checks.
    setExplicitlyLocked(userId, false);
  }
  if (km.isUnlocked()) {
    if (verifyCandidate) {
      let verified = false;
      try { verified = await verifyCandidate(km.getMasterKey()); } catch { /* preserve raw backup; fail closed */ }
      if (!contextMatches(userId, token)) return CRYPTO_STATUS.UNAVAILABLE;
      if (!verified) { km.lock(); return CRYPTO_STATUS.UNAVAILABLE; }
    }
    await rememberAccountKey(userId);
    return contextMatches(userId, token) && km.isUnlocked() ? CRYPTO_STATUS.READY : CRYPTO_STATUS.UNAVAILABLE;
  }

  if (userId && hasIDB()) {
    try {
      const b64 = await idbGet(slot(userId));
      if (!contextMatches(userId, token)) return CRYPTO_STATUS.UNAVAILABLE;
      if (b64) {
        if (km.getDeviceProtectionPolicy(userId) === 'transparent'
          && (await km.importRawMasterKey(b64, { token, verifyCandidate }))) return CRYPTO_STATUS.READY;
        // Preserve the device's existing bytes for investigation/recovery.
        // Failed verification/import is never permission to mint a replacement.
        return CRYPTO_STATUS.UNAVAILABLE;
      }
    } catch { return CRYPTO_STATUS.UNAVAILABLE; }
  }

  if (km.isVaultInitialized()) return CRYPTO_STATUS.LOCKED; // recovery-protected key elsewhere
  if (km.isVaultMetadataUnavailable()) return CRYPTO_STATUS.UNAVAILABLE;
  if (recoverySync === VAULT_SYNC.UNKNOWN) return CRYPTO_STATUS.UNAVAILABLE;

  // Older unowned local backups may still be the only copy after a failed
  // upload. Offer a verified adoption path, never discard or republish them as
  // though they already belonged to this login.
  try {
    if (await km.readUnassignedLegacyVaultRecord({ strict: true })) {
      return contextMatches(userId, token) ? CRYPTO_STATUS.LOCKED : CRYPTO_STATUS.UNAVAILABLE;
    }
  } catch { return CRYPTO_STATUS.UNAVAILABLE; }
  if (!contextMatches(userId, token)) return CRYPTO_STATUS.UNAVAILABLE;

  const serverState = await hasServerEncryptionState(userId);
  if (!contextMatches(userId, token)) return CRYPTO_STATUS.UNAVAILABLE;
  if (serverState === SERVER_STATE.PRESENT) return CRYPTO_STATUS.ORPHANED;
  if (serverState === SERVER_STATE.UNKNOWN) return CRYPTO_STATUS.UNAVAILABLE;

  await km.autoInitAccountKey();
  if (!contextMatches(userId, token) || !km.isUnlocked()) return CRYPTO_STATUS.UNAVAILABLE;
  await rememberAccountKey(userId);
  return contextMatches(userId, token) && km.isUnlocked() ? CRYPTO_STATUS.READY : CRYPTO_STATUS.UNAVAILABLE;
}

// Explicit, user-confirmed reset for the ORPHANED case: accept that the previous
// encrypted prayers can't be recovered on this device, mint a fresh account key,
// and re-publish a new identity keypair under it (the old one was wrapped by the
// lost key and can't be unwrapped). New content encrypts cleanly from here;
// old ciphertext stays locked. Returns true on success.
export async function startFreshEncryption(userId) {
  const token = km.getLifecycleToken();
  if (!contextMatches(userId, token) || km.getDeviceProtectionPolicy(userId) !== 'transparent') return false;
  await km.autoInitAccountKey();
  if (!contextMatches(userId, token) || !km.isUnlocked()) return false;
  await rememberAccountKey(userId);
  if (!contextMatches(userId, token)) return false;
  try {
    const identity = await regenerateIdentityKey(userId); // overwrite the orphaned identity key under the new ACK
    if (identity) {
      // Keep valid group keys already held by this running device, but force them
      // to be wrapped to the replacement identity on the next group touch. The
      // server only replaces envelopes older than that identity.
      clearGroupKeyDistributionCache();
    }
  } catch { /* group content will re-provision lazily; personal encryption already works */ }
  return contextMatches(userId, token) && km.isUnlocked();
}

// Persist the current (unlocked) account key for transparent access on this
// device, scoped to the user. Called after auto-init and after a successful
// recovery unlock so the device stays transparent from then on.
async function rememberAccountKeyOnce(userId, { clearLock = false } = {}, token = km.getLifecycleToken()) {
  if (!userId || !contextMatches(userId, token) || !km.isUnlocked()
    || km.getDeviceProtectionPolicy(userId) !== 'transparent') return false;
  const lockAtStart = explicitLockToken(userId);
  if (lockAtStart && !clearLock) return false;
  if (!hasIDB()) {
    if (clearLock) clearExplicitLock(userId, lockAtStart);
    return true;
  }
  try {
    const b64 = await km.exportRawMasterKey();
    if (!b64 || !contextMatches(userId, token) || km.getDeviceProtectionPolicy(userId) !== 'transparent') return false;
    await idbSet(slot(userId), b64);
    const lockAfterWrite = explicitLockToken(userId);
    const protectionAfterWrite = km.getDeviceProtectionPolicy(userId);
    const newerLock = lockAfterWrite && (!clearLock || lockAfterWrite !== lockAtStart);
    // A Lock click may have raced this best-effort persistence. Its newer token
    // wins: remove the just-written raw key and never clear the new lock.
    if (!contextMatches(userId, token) || protectionAfterWrite !== 'transparent' || newerLock) {
      // Ordinary sign-out/account switching invalidates the running operation,
      // but its user-scoped bytes may be the account's only durable ACK. Keep
      // that copy. Explicit lock/protection cleanup is destructive by intent;
      // account deletion separately drains these writes before erasing them.
      // Unknown policy is also not permission to discard a sole key.
      if (protectionAfterWrite === 'protected' || newerLock) {
        try { await idbDel(slot(userId)); } catch { /* marker still blocks restore */ }
      }
      return false;
    }
    if (clearLock) clearExplicitLock(userId, lockAtStart);
    return true;
  } catch {
    // Keep the explicit-lock marker if persistence failed; otherwise a refresh
    // could claim the device will reopen transparently when it cannot.
    return false;
  }
}

export async function rememberAccountKey(userId, options = {}) {
  const token = km.getLifecycleToken();
  let pending = persistenceOperations.get(userId);
  if (!pending) { pending = new Set(); persistenceOperations.set(userId, pending); }
  const previous = [...pending];
  const operation = (async () => {
    if (previous.length) await Promise.allSettled(previous);
    return await rememberAccountKeyOnce(userId, options, token);
  })();
  pending.add(operation);
  try { return await operation; }
  finally {
    pending.delete(operation);
    if (!pending.size && persistenceOperations.get(userId) === pending) persistenceOperations.delete(userId);
  }
}

// Explicit Disable Protection only: stage and verify the original raw key
// while the durable protected marker still blocks every normal restore path.
// Commit the policy synchronously after readback and the final lifecycle fence.
// Normal rememberAccountKey never uses this protected-mode exception.
export async function disableProtectedAccountKey(userId, { token = km.getLifecycleToken() } = {}) {
  if (!userId || !hasIDB() || !contextMatches(userId, token) || !km.isUnlocked()
    || km.getDeviceProtectionPolicy(userId) !== 'protected') return false;
  const original = km.getMasterKey();
  const lockAtStart = explicitLockToken(userId);
  let pending = persistenceOperations.get(userId);
  if (!pending) { pending = new Set(); persistenceOperations.set(userId, pending); }
  const previous = [...pending];
  const operation = (async () => {
    let staged = null;
    let committed = false;
    const stillAuthorized = () => contextMatches(userId, token) && km.isUnlocked()
      && km.getMasterKey() === original && km.getDeviceProtectionPolicy(userId) === 'protected'
      && explicitLockToken(userId) === lockAtStart;
    try {
      if (previous.length) await Promise.allSettled(previous);
      if (!stillAuthorized()) return false;
      staged = await km.exportRawMasterKey();
      if (!staged || !stillAuthorized()) return false;
      await idbSet(slot(userId), staged);
      if (!stillAuthorized() || await idbGet(slot(userId)) !== staged || !stillAuthorized()) return false;
      // Clearing an old explicit lock is safe while protection remains active.
      if (!clearExplicitLock(userId, lockAtStart) || explicitLockToken(userId) !== null
        || !contextMatches(userId, token) || km.getMasterKey() !== original
        || km.getDeviceProtectionPolicy(userId) !== 'protected') return false;
      if (!km.setDeviceProtectionPolicy(userId, false)) {
        km.setDeviceProtectionPolicy(userId, true);
        return false;
      }
      committed = true;
      return true;
    } catch { return false; }
    finally {
      if (staged && !committed) {
        // This may run after sign-out/deletion. Remove only our staged bytes;
        // never restore a key, wrapper or policy for an obsolete lifecycle.
        try { if (await idbGet(slot(userId)) === staged) await idbDel(slot(userId)); } catch { /* protected marker blocks restore */ }
      }
    }
  })();
  pending.add(operation);
  try { return await operation; }
  finally {
    pending.delete(operation);
    if (!pending.size && persistenceOperations.get(userId) === pending) persistenceOperations.delete(userId);
  }
}

// Persist an intentional app lock for this account and remove the convenient
// raw device copy before dropping the in-memory/session key. The wrapped vault
// record remains, so the passphrase or recovery code can always reopen it.
export async function lockAccountKey(userId) {
  if (!userId) {
    km.lock();
    return true;
  }
  setExplicitlyLocked(userId, true);
  // Invalidate long-running unwraps/exports before the asynchronous delete.
  if (contextMatches(userId)) km.lock();
  await drainAccountPersistence(userId);
  if (hasIDB()) {
    try { await idbDel(slot(userId)); } catch { /* marker still prevents auto-restore */ }
  }
  return true;
}

// Called only after the verified protected wrapper and durable policy exist.
// Failed deletion never removes the policy or permits legacy raw restoration.
export async function clearTransparentAccountKey(userId) {
  const token = km.getLifecycleToken();
  if (!userId || !contextMatches(userId, token) || km.getDeviceProtectionPolicy(userId) !== 'protected') return false;
  const sessionCleared = km.clearRawSessionKey(userId);
  if (!hasIDB()) return sessionCleared;
  try {
    // Drain writes begun before protection so cleanup cannot report completion
    // while a pending transparent write can still put a raw copy back.
    await drainAccountPersistence(userId);
    if (!contextMatches(userId, token)) return false;
    await idbDel(slot(userId));
    const persisted = await idbGet(slot(userId));
    return persisted == null && contextMatches(userId, token)
      && km.getDeviceProtectionPolicy(userId) === 'protected' && sessionCleared && km.clearRawSessionKey(userId);
  } catch { return false; }
}

// Remove the transparent per-user key. Used on ACCOUNT DELETION only — not on
// sign-out, which must preserve it to avoid locking a transparent user out of
// their own encrypted prayers.
export async function forgetAccountKey(userId) {
  if (!userId) return;
  if (contextMatches(userId)) km.lock();
  setExplicitlyLocked(userId, false);
  km.clearRawSessionKey(userId);
  km.setDeviceProtectionPolicy(userId, false);
  if (!hasIDB()) return;
  await drainAccountPersistence(userId);
  await Promise.allSettled([idbDel(slot(userId)), idbDel(`pfm_vault:${userId}`)]);
}
