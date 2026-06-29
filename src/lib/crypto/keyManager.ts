// Prayer Vault key manager — zero-knowledge, passphrase-derived, with a
// recovery code. The server never sees the key or the passphrase.
//
// Design (wrapped-master-key):
//   • A random 256-bit master key (MK) actually encrypts prayer content.
//   • MK is itself encrypted ("wrapped") twice: once by a key derived from the
//     user's passphrase, once by a key derived from a one-time recovery code.
//   • Only the two wrapped blobs + their salts are persisted (localStorage).
//     They are useless without the passphrase or the recovery code, so they are
//     safe to store and could even be backed up — but MK in the clear never is.
//   • unlock() re-derives a wrapping key and unwraps MK into memory. lock()
//     drops MK. Auto-lock drops it after a period of inactivity.
//
// Forgetting the passphrase is recoverable via the recovery code (which re-wraps
// MK under a fresh passphrase). Losing BOTH means the data is unrecoverable by
// design — that is the cost of true zero-knowledge encryption.

import { toB64, fromB64 } from './e2ee';

const VAULT_VERSION = 1;
const PBKDF2_ITERATIONS = 310_000; // OWASP-recommended floor for PBKDF2-SHA256
const SALT_BYTES = 16;
const IV_BYTES = 12;
const RECOVERY_BYTES = 16; // 128 bits of entropy
const STORAGE_KEY = 'pfm_vault';
const DEFAULT_AUTO_LOCK_MS = 5 * 60 * 1000;

// Crockford base32 (no I/L/O/U) — unambiguous to read off a recovery sheet.
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

interface WrappedKey {
  iv: string;
  data: string;
}

interface VaultRecord {
  v: number;
  passSalt: string;
  recoverySalt: string;
  passWrapped: WrappedKey;
  recoveryWrapped: WrappedKey;
}

// ─── In-memory state (never persisted) ───────────────────────────────────────
let masterKey: CryptoKey | null = null;
let autoLockMs = DEFAULT_AUTO_LOCK_MS;
let autoLockTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(unlocked: boolean) => void>();

const enc = new TextEncoder();

// ─── Storage (browser localStorage; absent in the Node test env) ─────────────
function storage(): Storage | null {
  try {
    return typeof globalThis !== 'undefined' && globalThis.localStorage ? globalThis.localStorage : null;
  } catch {
    return null;
  }
}

function loadRecord(): VaultRecord | null {
  const raw = storage()?.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VaultRecord;
  } catch {
    return null;
  }
}

function saveRecord(record: VaultRecord): void {
  storage()?.setItem(STORAGE_KEY, JSON.stringify(record));
}

// ─── Key derivation & (un)wrapping ───────────────────────────────────────────
async function deriveWrappingKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  );
}

async function generateMasterKey(): Promise<CryptoKey> {
  // Extractable so it can be (re)wrapped under new credentials; it is only ever
  // exported in wrapped (encrypted) form, never as cleartext.
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

async function wrapMasterKey(mk: CryptoKey, wrappingKey: CryptoKey): Promise<WrappedKey> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const data = await crypto.subtle.wrapKey('raw', mk, wrappingKey, { name: 'AES-GCM', iv });
  return { iv: toB64(iv), data: toB64(new Uint8Array(data)) };
}

async function unwrapMasterKey(wrapped: WrappedKey, wrappingKey: CryptoKey): Promise<CryptoKey> {
  // Throws (GCM auth failure) if the wrapping key is wrong — i.e. bad passphrase.
  return crypto.subtle.unwrapKey(
    'raw',
    fromB64(wrapped.data),
    wrappingKey,
    { name: 'AES-GCM', iv: fromB64(wrapped.iv) },
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

// ─── Recovery codes ──────────────────────────────────────────────────────────
// 26 readable chars grouped XXXXX-XXXXX-... — entropy comes from RECOVERY_BYTES.
export function generateRecoveryCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(RECOVERY_BYTES));
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += CODE_ALPHABET[bytes[i] & 31];
  return out.replace(/(.{5})/g, '$1-').replace(/-$/, '');
}

function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^0-9A-Z]/g, '');
}

// ─── Auto-lock ───────────────────────────────────────────────────────────────
function setMasterKey(mk: CryptoKey | null): void {
  masterKey = mk;
  if (mk) resetAutoLock();
  else clearAutoLock();
  for (const l of listeners) l(mk !== null);
}

function clearAutoLock(): void {
  if (autoLockTimer) {
    clearTimeout(autoLockTimer);
    autoLockTimer = null;
  }
}

// Call on user activity to keep the vault open; restarts the idle countdown.
export function resetAutoLock(): void {
  if (!masterKey) return;
  clearAutoLock();
  if (autoLockMs > 0) autoLockTimer = setTimeout(lock, autoLockMs);
}

export function setAutoLockMs(ms: number): void {
  autoLockMs = ms;
  resetAutoLock();
}

// ─── Public API ──────────────────────────────────────────────────────────────
export function isVaultInitialized(): boolean {
  return loadRecord() !== null;
}

export function isUnlocked(): boolean {
  return masterKey !== null;
}

// The in-memory master key for encrypt/decrypt. Throws if the vault is locked —
// callers must unlock first (or check isUnlocked()).
export function getMasterKey(): CryptoKey {
  if (!masterKey) throw new Error('Vault is locked');
  return masterKey;
}

// First-time setup. Returns the recovery code to show the user ONCE; it is not
// stored anywhere in retrievable form.
export async function createVault(passphrase: string): Promise<string> {
  const mk = await generateMasterKey();
  const recoveryCode = generateRecoveryCode();
  const passSalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const recoverySalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));

  const passKey = await deriveWrappingKey(passphrase, passSalt);
  const recoveryKey = await deriveWrappingKey(normalizeCode(recoveryCode), recoverySalt);

  saveRecord({
    v: VAULT_VERSION,
    passSalt: toB64(passSalt),
    recoverySalt: toB64(recoverySalt),
    passWrapped: await wrapMasterKey(mk, passKey),
    recoveryWrapped: await wrapMasterKey(mk, recoveryKey),
  });
  setMasterKey(mk);
  return recoveryCode;
}

// Unlock with the passphrase. Returns false on a wrong passphrase (no throw).
export async function unlock(passphrase: string): Promise<boolean> {
  const record = loadRecord();
  if (!record) return false;
  try {
    const passKey = await deriveWrappingKey(passphrase, fromB64(record.passSalt));
    const mk = await unwrapMasterKey(record.passWrapped, passKey);
    setMasterKey(mk);
    return true;
  } catch {
    return false;
  }
}

// Recover access with the recovery code and set a new passphrase (re-wrapping
// the same master key, so existing ciphertext stays readable).
export async function resetPassphrase(recoveryCode: string, newPassphrase: string): Promise<boolean> {
  const record = loadRecord();
  if (!record) return false;
  let mk: CryptoKey;
  try {
    const recoveryKey = await deriveWrappingKey(normalizeCode(recoveryCode), fromB64(record.recoverySalt));
    mk = await unwrapMasterKey(record.recoveryWrapped, recoveryKey);
  } catch {
    return false;
  }
  const passSalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const passKey = await deriveWrappingKey(newPassphrase, passSalt);
  record.passSalt = toB64(passSalt);
  record.passWrapped = await wrapMasterKey(mk, passKey);
  saveRecord(record);
  setMasterKey(mk);
  return true;
}

// Change the passphrase while unlocked (or by supplying the current one).
export async function changePassphrase(currentPassphrase: string, newPassphrase: string): Promise<boolean> {
  const record = loadRecord();
  if (!record) return false;
  let mk: CryptoKey;
  try {
    const currentKey = await deriveWrappingKey(currentPassphrase, fromB64(record.passSalt));
    mk = await unwrapMasterKey(record.passWrapped, currentKey);
  } catch {
    return false;
  }
  const passSalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const passKey = await deriveWrappingKey(newPassphrase, passSalt);
  record.passSalt = toB64(passSalt);
  record.passWrapped = await wrapMasterKey(mk, passKey);
  saveRecord(record);
  setMasterKey(mk);
  return true;
}

// Rotate the recovery code while the vault is unlocked. Generates a fresh code,
// re-wraps the SAME master key under it (so existing ciphertext stays readable),
// and invalidates the previous code. Returns the new code to show the user once,
// or null if the vault is locked (no master key in memory to re-wrap). The
// passphrase wrapping is untouched.
export async function rotateRecoveryCode(): Promise<string | null> {
  const record = loadRecord();
  if (!record || !masterKey) return null;
  const recoveryCode = generateRecoveryCode();
  const recoverySalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const recoveryKey = await deriveWrappingKey(normalizeCode(recoveryCode), recoverySalt);
  record.recoverySalt = toB64(recoverySalt);
  record.recoveryWrapped = await wrapMasterKey(masterKey, recoveryKey);
  saveRecord(record);
  return recoveryCode;
}

// Drop the master key from memory. Encrypted data on disk stays encrypted.
export function lock(): void {
  setMasterKey(null);
}

// Subscribe to lock/unlock transitions (for UI). Returns an unsubscribe fn.
export function onLockChange(listener: (unlocked: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Permanently destroy the vault record. After this the encrypted data is
// unrecoverable — callers must confirm with the user first.
export function destroyVault(): void {
  storage()?.removeItem(STORAGE_KEY);
  setMasterKey(null);
}

// ─── Cross-device sync of the WRAPPED record (ciphertext only) ────────────────
// The record holds only the master key wrapped by the passphrase and recovery
// code, plus salts — never the key or passphrase. It is therefore safe to store
// server-side so the vault can be unlocked on another device.

// Raw record string for upload, or null if no vault exists on this device.
export function exportVaultRecord(): string | null {
  return storage()?.getItem(STORAGE_KEY) ?? null;
}

// Seed this device's vault from a synced record. By default it won't clobber an
// existing local record (which may be newer); pass overwrite to force.
export function importVaultRecord(recordJson: string, overwrite = false): void {
  const store = storage();
  if (!store) return;
  if (!overwrite && store.getItem(STORAGE_KEY)) return;
  store.setItem(STORAGE_KEY, recordJson);
}
