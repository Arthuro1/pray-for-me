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

const hasIDB = () => typeof indexedDB !== 'undefined';
const slot = (userId) => `pfm_ak_${userId}`;

// Ensure an account key is ready for the signed-in user. Idempotent; safe to
// call on every boot. Order:
//   1. If a key is already in memory (session mirror / earlier call) → reuse it.
//   2. Restore the transparent per-user key from IndexedDB.
//   3. If a recovery record exists but no local key → a new/other device; leave
//      it LOCKED so the recovery unlock UI (VaultLockScreen) can handle it.
//   4. Otherwise this is first use → auto-provision the key transparently.
export async function ensureAccountCryptoReady(userId) {
  await km.hydrate();
  if (km.isUnlocked()) { await rememberAccountKey(userId); return; }

  if (userId && hasIDB()) {
    try {
      const b64 = await idbGet(slot(userId));
      if (b64 && (await km.importRawMasterKey(b64))) return;
    } catch { /* fall through to init / lock */ }
  }

  if (km.isVaultInitialized()) return; // recovery-protected key elsewhere → stay locked

  await km.autoInitAccountKey();
  await rememberAccountKey(userId);
}

// Persist the current (unlocked) account key for transparent access on this
// device, scoped to the user. Called after auto-init and after a successful
// recovery unlock so the device stays transparent from then on.
export async function rememberAccountKey(userId) {
  if (!userId || !hasIDB() || !km.isUnlocked()) return;
  try {
    const b64 = await km.exportRawMasterKey();
    if (b64) await idbSet(slot(userId), b64);
  } catch { /* best-effort */ }
}

// Remove the transparent per-user key. Used on ACCOUNT DELETION only — not on
// sign-out, which must preserve it to avoid locking a transparent user out of
// their own encrypted prayers.
export async function forgetAccountKey(userId) {
  if (!userId || !hasIDB()) return;
  try { await idbDel(slot(userId)); } catch { /* best-effort */ }
}
