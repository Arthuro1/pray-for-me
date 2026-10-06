// Account content-key and optional recovery manager.
//
// Automatic encryption persists the user's raw account key in user-scoped
// IndexedDB (accountKey.js) and mirrors an unlocked key in tab-scoped
// sessionStorage. That is deliberate device convenience, not a zero-knowledge
// claim: malicious JavaScript or an unlocked browser profile can read the key.
//
// Optional recovery wraps the same 256-bit key under a passphrase and under a
// 128-bit recovery code. Only those wrapped blobs and salts are synced through
// `vault_keys`; neither the passphrase nor raw key is sent to Supabase. The
// default inactivity auto-lock is disabled. See docs/ENCRYPTION.md.

import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { toB64, fromB64 } from './e2ee';

const VAULT_VERSION = 2;
const PBKDF2_ITERATIONS = 310_000; // OWASP-recommended floor for PBKDF2-SHA256
const SALT_BYTES = 16;
const IV_BYTES = 12;
const RECOVERY_BYTES = 16; // 128 bits of entropy
const STORAGE_KEY = 'pfm_vault'; // IndexedDB key (and legacy localStorage key)
const SESSION_KEY = 'pfm_vault_session'; // sessionStorage: raw master key, tab-scoped
// Idle auto-lock is disabled by default: under the "encryption by default"
// model the account key is transparent (persisted device-local by the
// accountKey layer), so locking it on idle would only break encrypt/decrypt
// mid-session without adding protection. The machinery is kept for a future
// opt-in app-lock; setAutoLockMs(>0) re-enables it.
const DEFAULT_AUTO_LOCK_MS = 0;

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
  // Monotonic generation + wall-clock tie-breaker let vaultSync distinguish a
  // passphrase/recovery change from a stale wrapper cached on another device.
  // Older records omit both fields and are treated as generation zero.
  revision?: number;
  updatedAt?: string;
}

// ─── In-memory state (never persisted) ───────────────────────────────────────
let masterKey: CryptoKey | null = null;
let autoLockMs = DEFAULT_AUTO_LOCK_MS;
let autoLockTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(unlocked: boolean) => void>();

const enc = new TextEncoder();

// ─── Storage (IndexedDB; in-memory cache mirrors it for synchronous reads) ────
// The wrapped record lives in IndexedDB rather than localStorage: it's the same
// durable store the rest of the app uses, and it keeps the (wrapped) key out of
// the synchronous, string-only localStorage bucket. A module-level cache mirrors
// it so isVaultInitialized()/exportVaultRecord() can stay synchronous — callers
// must await hydrate() once at boot before trusting them (App does this via
// pullVaultRecord).
const hasIDB = (): boolean => typeof indexedDB !== 'undefined';

let cachedRecord: VaultRecord | null = null;
let hydration: Promise<void> | null = null;

function parseVaultRecord(value: unknown): VaultRecord | null {
  try {
    const record = typeof value === 'string' ? JSON.parse(value) : value;
    if (!record || typeof record !== 'object') return null;
    const candidate = record as Partial<VaultRecord>;
    const wrappedIsValid = (wrapped: WrappedKey | undefined) => !!wrapped
      && typeof wrapped.iv === 'string' && wrapped.iv.length > 0
      && typeof wrapped.data === 'string' && wrapped.data.length > 0;
    if (!Number.isInteger(candidate.v) || (candidate.v !== 1 && candidate.v !== VAULT_VERSION)) return null;
    if (typeof candidate.passSalt !== 'string' || !candidate.passSalt) return null;
    if (typeof candidate.recoverySalt !== 'string' || !candidate.recoverySalt) return null;
    if (!wrappedIsValid(candidate.passWrapped) || !wrappedIsValid(candidate.recoveryWrapped)) return null;
    if (candidate.revision !== undefined
      && (!Number.isInteger(candidate.revision) || candidate.revision < 0)) return null;
    if (candidate.updatedAt !== undefined
      && (typeof candidate.updatedAt !== 'string' || !Number.isFinite(Date.parse(candidate.updatedAt)))) return null;
    return candidate as VaultRecord;
  } catch {
    return null;
  }
}

function recordMetadata(previous?: VaultRecord | null): Pick<VaultRecord, 'revision' | 'updatedAt'> {
  return {
    revision: (previous?.revision ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  };
}

function recordIsNewer(candidate: VaultRecord, current: VaultRecord | null): boolean {
  if (!current) return true;
  const candidateRevision = candidate.revision ?? 0;
  const currentRevision = current.revision ?? 0;
  if (candidateRevision !== currentRevision) return candidateRevision > currentRevision;
  const candidateTime = candidate.updatedAt ? Date.parse(candidate.updatedAt) : 0;
  const currentTime = current.updatedAt ? Date.parse(current.updatedAt) : 0;
  // When both are legacy records, IndexedDB is the shared same-browser source
  // of truth and may have been updated by another tab since this module cached it.
  return candidateTime > currentTime
    || (candidateTime === currentTime && JSON.stringify(candidate) !== JSON.stringify(current));
}

// Legacy localStorage access (only to migrate an existing record out of it).
function legacyStorage(): Storage | null {
  try {
    return typeof globalThis !== 'undefined' && globalThis.localStorage ? globalThis.localStorage : null;
  } catch {
    return null;
  }
}

function sessionStorageRef(): Storage | null {
  try {
    return typeof globalThis !== 'undefined' && globalThis.sessionStorage ? globalThis.sessionStorage : null;
  } catch {
    return null;
  }
}

// Keep the vault unlocked across a page refresh (but not a fresh browser tab):
// the raw master key is mirrored into sessionStorage, which is tab-scoped and
// cleared when the tab closes. This doesn't meaningfully change the exposure —
// anything that can read the in-memory key (e.g. injected JS) could read this
// too — it just avoids forcing a passphrase re-entry on every reload.
async function persistSessionKey(mk: CryptoKey): Promise<void> {
  try {
    const raw = await crypto.subtle.exportKey('raw', mk);
    sessionStorageRef()?.setItem(SESSION_KEY, toB64(new Uint8Array(raw)));
  } catch {
    /* best-effort */
  }
}

function clearSessionKey(): void {
  sessionStorageRef()?.removeItem(SESSION_KEY);
}

async function restoreSessionKey(): Promise<void> {
  if (masterKey) return;
  const b64 = sessionStorageRef()?.getItem(SESSION_KEY);
  if (!b64) return;
  try {
    const mk = await crypto.subtle.importKey('raw', fromB64(b64), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
    setMasterKey(mk);
  } catch {
    clearSessionKey();
  }
}

async function doHydrate(): Promise<void> {
  // One-time migration: if a record still sits in localStorage (older clients),
  // move it into IndexedDB and drop the localStorage copy so the wrapped key no
  // longer persists there.
  const ls = legacyStorage();
  const legacy = ls?.getItem(STORAGE_KEY);
  let migrated = false;
  if (legacy) {
    const parsed = parseVaultRecord(legacy);
    try {
      cachedRecord = parsed;
      // A corrupt legacy value must not permanently masquerade as a vault and
      // trap the user at an unlock screen that can never succeed.
      ls?.removeItem(STORAGE_KEY);
      if (!parsed) throw new Error('Invalid legacy vault record');
      if (hasIDB()) await idbSet(STORAGE_KEY, cachedRecord);
      migrated = true;
    } catch {
      cachedRecord = null;
    }
  }
  if (!migrated && hasIDB()) {
    try {
      const persisted = await idbGet(STORAGE_KEY);
      cachedRecord = persisted == null ? null : parseVaultRecord(persisted);
      if (persisted != null && !cachedRecord) await idbDel(STORAGE_KEY);
    } catch {
      cachedRecord = null;
    }
  }
  await restoreSessionKey();
}

// Load the persisted record into the in-memory cache. Idempotent — safe to call
// from multiple boot paths; the work runs at most once.
export function hydrate(): Promise<void> {
  if (!hydration) hydration = doHydrate();
  return hydration;
}

function loadRecord(): VaultRecord | null {
  return cachedRecord;
}

// Update the cache immediately and await the IndexedDB write where callers are
// already async. Awaiting closes a page-close race that could make a successful
// passphrase change revert on the next launch.
async function saveRecord(record: VaultRecord): Promise<void> {
  cachedRecord = record;
  if (hasIDB()) {
    try { await idbSet(STORAGE_KEY, record); } catch { /* server sync can still preserve it */ }
  }
}

// The cache is per tab while IndexedDB is shared. Re-read it before any
// credential operation so a passphrase changed in another tab invalidates the
// old passphrase here too instead of surviving until a full reload.
async function refreshPersistedRecord(): Promise<void> {
  await hydrate();
  if (!hasIDB()) return;
  try {
    const persisted = parseVaultRecord(await idbGet(STORAGE_KEY));
    if (persisted && recordIsNewer(persisted, cachedRecord)) cachedRecord = persisted;
  } catch { /* retain the last validated in-memory record */ }
}

// ─── Key derivation & (un)wrapping ───────────────────────────────────────────
async function deriveWrappingKey(secret: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
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
  return formatRecoveryCode(encodeRecoveryBytes(bytes));
}

export const RECOVERY_CODE_NORMALIZED_LENGTH = 26;
export const LEGACY_RECOVERY_CODE_NORMALIZED_LENGTH = 16;

export function encodeRecoveryBytes(bytes: Uint8Array): string {
  if (bytes.length !== RECOVERY_BYTES) {
    throw new Error(`Recovery entropy must be exactly ${RECOVERY_BYTES} bytes`);
  }
  let out = '';
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += CODE_ALPHABET[(buffer >>> bits) & 31];
      buffer &= bits === 0 ? 0 : (1 << bits) - 1;
    }
  }
  if (bits > 0) out += CODE_ALPHABET[(buffer << (5 - bits)) & 31];
  return out;
}

export function formatRecoveryCode(normalized: string): string {
  return normalized.match(/.{1,5}/g)?.join('-') ?? '';
}

export function normalizeRecoveryCode(code: string, version = VAULT_VERSION): string | null {
  if (typeof code !== 'string' || !/^[0-9A-Za-z\s-]+$/.test(code)) return null;
  const normalized = code.toUpperCase().replace(/[\s-]/g, '');
  const validLength = version >= 2
    ? normalized.length === RECOVERY_CODE_NORMALIZED_LENGTH
    : normalized.length === LEGACY_RECOVERY_CODE_NORMALIZED_LENGTH
      || normalized.length === RECOVERY_CODE_NORMALIZED_LENGTH;
  if (!validLength) return null;
  if ([...normalized].some((char) => !CODE_ALPHABET.includes(char))) return null;
  return normalized;
}

// ─── Auto-lock ───────────────────────────────────────────────────────────────
function setMasterKey(mk: CryptoKey | null): void {
  masterKey = mk;
  if (mk) { resetAutoLock(); persistSessionKey(mk); }
  else { clearAutoLock(); clearSessionKey(); }
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
  const recoveryKey = await deriveWrappingKey(normalizeRecoveryCode(recoveryCode)!, recoverySalt);

  await saveRecord({
    v: VAULT_VERSION,
    passSalt: toB64(passSalt),
    recoverySalt: toB64(recoverySalt),
    passWrapped: await wrapMasterKey(mk, passKey),
    recoveryWrapped: await wrapMasterKey(mk, recoveryKey),
    ...recordMetadata(),
  });
  setMasterKey(mk);
  return recoveryCode;
}

// Provision the account content key automatically on first authenticated use —
// no passphrase, no recovery record. Encryption "just works" and stays
// transparent: the raw key is persisted device-local (per user) by the
// accountKey layer, and recovery / cross-device is layered on later via
// setUpRecovery(). No-op if a key is already loaded.
export async function autoInitAccountKey(): Promise<void> {
  if (masterKey) return;
  const mk = await generateMasterKey();
  setMasterKey(mk);
}

// Turn on recovery / cross-device access for the key ALREADY in memory: wrap it
// under a passphrase + a fresh recovery code and persist the wrapped record
// (which vaultSync uploads). Unlike createVault it never generates a new key, so
// all existing ciphertext stays readable. Returns the one-time recovery code, or
// null if no key is loaded.
export async function setUpRecovery(passphrase: string): Promise<string | null> {
  if (!masterKey) return null;
  const recoveryCode = generateRecoveryCode();
  const passSalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const recoverySalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const passKey = await deriveWrappingKey(passphrase, passSalt);
  const recoveryKey = await deriveWrappingKey(normalizeRecoveryCode(recoveryCode)!, recoverySalt);
  await saveRecord({
    v: VAULT_VERSION,
    passSalt: toB64(passSalt),
    recoverySalt: toB64(recoverySalt),
    passWrapped: await wrapMasterKey(masterKey, passKey),
    recoveryWrapped: await wrapMasterKey(masterKey, recoveryKey),
    ...recordMetadata(),
  });
  return recoveryCode;
}

// Load a raw (base64) account key into memory — restores the transparent
// per-user key on boot (see accountKey.ensureAccountCryptoReady). Returns false
// if the bytes aren't a valid AES-GCM key.
export async function importRawMasterKey(b64: string): Promise<boolean> {
  try {
    const mk = await crypto.subtle.importKey('raw', fromB64(b64), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
    setMasterKey(mk);
    return true;
  } catch {
    return false;
  }
}

// Export the in-memory account key as base64 so the accountKey layer can persist
// it for transparent access on this device. Null when locked.
export async function exportRawMasterKey(): Promise<string | null> {
  if (!masterKey) return null;
  try {
    const raw = await crypto.subtle.exportKey('raw', masterKey);
    return toB64(new Uint8Array(raw));
  } catch {
    return null;
  }
}

// Unlock with the passphrase. Returns false on a wrong passphrase (no throw).
export async function unlock(passphrase: string): Promise<boolean> {
  await refreshPersistedRecord();
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
  await refreshPersistedRecord();
  const record = loadRecord();
  if (!record) return false;
  const normalized = normalizeRecoveryCode(recoveryCode, record.v ?? 1);
  if (!normalized) return false;
  let mk: CryptoKey;
  try {
    const recoveryKey = await deriveWrappingKey(normalized, fromB64(record.recoverySalt));
    mk = await unwrapMasterKey(record.recoveryWrapped, recoveryKey);
  } catch {
    return false;
  }
  const passSalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const passKey = await deriveWrappingKey(newPassphrase, passSalt);
  await saveRecord({
    ...record,
    passSalt: toB64(passSalt),
    passWrapped: await wrapMasterKey(mk, passKey),
    ...recordMetadata(record),
  });
  setMasterKey(mk);
  return true;
}

// Change the passphrase while unlocked (or by supplying the current one).
export async function changePassphrase(currentPassphrase: string, newPassphrase: string): Promise<boolean> {
  await refreshPersistedRecord();
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
  await saveRecord({
    ...record,
    passSalt: toB64(passSalt),
    passWrapped: await wrapMasterKey(mk, passKey),
    ...recordMetadata(record),
  });
  setMasterKey(mk);
  return true;
}

// Rotate the recovery code while the vault is unlocked. Generates a fresh code,
// re-wraps the SAME master key under it (so existing ciphertext stays readable),
// and invalidates the previous code. Returns the new code to show the user once,
// or null if the vault is locked (no master key in memory to re-wrap). The
// passphrase wrapping is untouched.
export async function rotateRecoveryCode(): Promise<string | null> {
  await refreshPersistedRecord();
  const record = loadRecord();
  if (!record || !masterKey) return null;
  const recoveryCode = generateRecoveryCode();
  const recoverySalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const recoveryKey = await deriveWrappingKey(normalizeRecoveryCode(recoveryCode)!, recoverySalt);
  await saveRecord({
    ...record,
    v: VAULT_VERSION,
    recoverySalt: toB64(recoverySalt),
    recoveryWrapped: await wrapMasterKey(masterKey, recoveryKey),
    ...recordMetadata(record),
  });
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
// unrecoverable — callers must confirm with the user first. Awaitable so a
// caller wiping local data (account deletion / sign-out) can be sure the
// IndexedDB entry is gone before continuing.
export async function destroyVault(): Promise<void> {
  cachedRecord = null;
  setMasterKey(null);
  legacyStorage()?.removeItem(STORAGE_KEY); // clear any un-migrated legacy copy
  if (hasIDB()) {
    try {
      await idbDel(STORAGE_KEY);
    } catch {
      /* best-effort */
    }
  }
  // A later account in the same SPA session must hydrate its own newly pulled
  // record instead of reusing this already-resolved hydration promise.
  hydration = null;
}

// ─── Cross-device sync of the WRAPPED record (ciphertext only) ────────────────
// The record holds only the master key wrapped by the passphrase and recovery
// code, plus salts — never the key or passphrase. It is therefore safe to store
// server-side so the vault can be unlocked on another device.

// Raw record string for upload, or null if no vault exists on this device.
// Reads the in-memory cache, so callers must have awaited hydrate() first.
export function exportVaultRecord(): string | null {
  return cachedRecord ? JSON.stringify(cachedRecord) : null;
}

// Validated metadata used by vaultSync's conflict resolution. Returning a
// canonical JSON string also prevents malformed server data from being imported
// and turning into an impossible-to-unlock local vault.
export function inspectVaultRecord(record: unknown): { json: string; revision: number; updatedAt: number } | null {
  const parsed = parseVaultRecord(record);
  if (!parsed) return null;
  return {
    json: JSON.stringify(parsed),
    revision: parsed.revision ?? 0,
    updatedAt: parsed.updatedAt ? Date.parse(parsed.updatedAt) : 0,
  };
}

// Seed this device's vault from a synced record. By default it won't clobber an
// existing local record (which may be newer); pass overwrite to force.
export async function importVaultRecord(recordJson: string | object, overwrite = false): Promise<boolean> {
  if (!overwrite && cachedRecord) return false;
  const record = parseVaultRecord(recordJson);
  if (!record) return false;
  await saveRecord(record);
  return true;
}
