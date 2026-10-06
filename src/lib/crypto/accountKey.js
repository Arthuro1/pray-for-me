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

// Whether the server already holds encryption for this user — an identity
// keypair (groups / cross-device) or any personal prayer stored as ciphertext.
// If so, minting a fresh account key here would ORPHAN that data, so we must not
// do it silently. A query failure is deliberately UNKNOWN rather than ABSENT:
// availability problems must never be allowed to rotate a user's key material.
async function hasServerEncryptionState(userId) {
  if (!userId) return SERVER_STATE.UNKNOWN;
  try {
    const { data: keyRow, error: keyError } = await supabase
      .from('user_crypto_keys').select('user_id').eq('user_id', userId).maybeSingle();
    if (keyError) return SERVER_STATE.UNKNOWN;
    if (keyRow) return SERVER_STATE.PRESENT;
    const { data: enc, error: prayerError } = await supabase
      .from('prayers').select('id').eq('user_id', userId)
      .not('encrypted_payload', 'is', null).limit(1).maybeSingle();
    if (prayerError) return SERVER_STATE.UNKNOWN;
    return enc ? SERVER_STATE.PRESENT : SERVER_STATE.ABSENT;
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
export async function ensureAccountCryptoReady(userId, recoverySync) {
  await km.hydrate();
  // An explicit Lock action must survive refresh and sign-in. Without this
  // marker, step 2 below immediately re-imported the raw device key, making the
  // Lock button look broken. Lock first in case a tab-scoped session key was
  // restored during hydration.
  if (explicitLockToken(userId)) {
    km.lock();
    if (km.isVaultInitialized()) return CRYPTO_STATUS.LOCKED;
    // The wrapped record may have been cleared during sign-out and still need
    // to be pulled. Never mint a replacement key while that lookup is unknown.
    if (recoverySync === VAULT_SYNC.UNKNOWN) return CRYPTO_STATUS.UNAVAILABLE;
    // A definitive absence means the marker is stale (the Lock control is only
    // offered for recovery-enabled vaults). Continue through orphan checks.
    setExplicitlyLocked(userId, false);
  }
  if (km.isUnlocked()) { await rememberAccountKey(userId); return CRYPTO_STATUS.READY; }

  if (userId && hasIDB()) {
    try {
      const b64 = await idbGet(slot(userId));
      if (b64 && (await km.importRawMasterKey(b64))) return CRYPTO_STATUS.READY;
    } catch { /* fall through to init / lock */ }
  }

  if (km.isVaultInitialized()) return CRYPTO_STATUS.LOCKED; // recovery-protected key elsewhere
  if (recoverySync === VAULT_SYNC.UNKNOWN) return CRYPTO_STATUS.UNAVAILABLE;

  const serverState = await hasServerEncryptionState(userId);
  if (serverState === SERVER_STATE.PRESENT) return CRYPTO_STATUS.ORPHANED;
  if (serverState === SERVER_STATE.UNKNOWN) return CRYPTO_STATUS.UNAVAILABLE;

  await km.autoInitAccountKey();
  await rememberAccountKey(userId);
  return CRYPTO_STATUS.READY;
}

// Explicit, user-confirmed reset for the ORPHANED case: accept that the previous
// encrypted prayers can't be recovered on this device, mint a fresh account key,
// and re-publish a new identity keypair under it (the old one was wrapped by the
// lost key and can't be unwrapped). New content encrypts cleanly from here;
// old ciphertext stays locked. Returns true on success.
export async function startFreshEncryption(userId) {
  await km.autoInitAccountKey();
  await rememberAccountKey(userId);
  try {
    const identity = await regenerateIdentityKey(userId); // overwrite the orphaned identity key under the new ACK
    if (identity) {
      // Keep valid group keys already held by this running device, but force them
      // to be wrapped to the replacement identity on the next group touch. The
      // server only replaces envelopes older than that identity.
      clearGroupKeyDistributionCache();
    }
  } catch { /* group content will re-provision lazily; personal encryption already works */ }
  return km.isUnlocked();
}

// Persist the current (unlocked) account key for transparent access on this
// device, scoped to the user. Called after auto-init and after a successful
// recovery unlock so the device stays transparent from then on.
export async function rememberAccountKey(userId, { clearLock = false } = {}) {
  if (!userId || !km.isUnlocked()) return false;
  const lockAtStart = explicitLockToken(userId);
  if (lockAtStart && !clearLock) return false;
  if (!hasIDB()) {
    if (clearLock) clearExplicitLock(userId, lockAtStart);
    return true;
  }
  try {
    const b64 = await km.exportRawMasterKey();
    if (!b64) return false;
    await idbSet(slot(userId), b64);
    const lockAfterWrite = explicitLockToken(userId);
    // A Lock click may have raced this best-effort persistence. Its newer token
    // wins: remove the just-written raw key and never clear the new lock.
    if (lockAfterWrite && (!clearLock || lockAfterWrite !== lockAtStart)) {
      try { await idbDel(slot(userId)); } catch { /* marker still blocks restore */ }
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

// Persist an intentional app lock for this account and remove the convenient
// raw device copy before dropping the in-memory/session key. The wrapped vault
// record remains, so the passphrase or recovery code can always reopen it.
export async function lockAccountKey(userId) {
  if (!userId) {
    km.lock();
    return true;
  }
  setExplicitlyLocked(userId, true);
  if (hasIDB()) {
    try { await idbDel(slot(userId)); } catch { /* marker still prevents auto-restore */ }
  }
  km.lock();
  return true;
}

// Remove the transparent per-user key. Used on ACCOUNT DELETION only — not on
// sign-out, which must preserve it to avoid locking a transparent user out of
// their own encrypted prayers.
export async function forgetAccountKey(userId) {
  if (!userId) return;
  setExplicitlyLocked(userId, false);
  if (!hasIDB()) return;
  try { await idbDel(slot(userId)); } catch { /* best-effort */ }
}
