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
// transparent default inactivity auto-lock is disabled; protected devices
// always lock after five minutes without activity. See docs/ENCRYPTION.md.

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
// mid-session without adding protection. Protected devices always use the
// five-minute limit; this setting only controls transparent account keys.
const DEFAULT_AUTO_LOCK_MS = 0;
const PROTECTED_AUTO_LOCK_MS = 5 * 60 * 1000;

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

export interface LifecycleToken {
  readonly accountId: string | null;
  readonly generation: number;
}

export interface CandidateKeyOptions {
  token?: LifecycleToken;
  verifyCandidate?: (key: CryptoKey) => Promise<boolean> | boolean;
}

let accountId: string | null = null;
let accountContextConfigured = false;
let lifecycleGeneration = 0;
const recordSlot = (): string | null => accountId
  ? `${STORAGE_KEY}:${accountId}` : accountContextConfigured ? null : STORAGE_KEY;
const sessionSlot = (): string | null => accountId
  ? `${SESSION_KEY}:${accountId}` : accountContextConfigured ? null : SESSION_KEY;
const protectionSlot = (userId: string): string => `pfm_device_protected_${userId}`;

// ─── In-memory state (never persisted) ───────────────────────────────────────
let masterKey: CryptoKey | null = null;
let autoLockMs = DEFAULT_AUTO_LOCK_MS;
let autoLockTimer: ReturnType<typeof setTimeout> | null = null;
let autoLockDeadline: number | null = null;
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
let vaultMetadataUnavailable = false;

// Both historical versions used standard Base64, 16-byte salts, 12-byte GCM
// IVs and a 32-byte account key plus the 16-byte authentication tag. Preserve
// padded and unpadded encodings without accepting arbitrary nonempty strings.
function hasBase64Length(value: unknown, expectedBytes: number): boolean {
  if (typeof value !== 'string' || value.length > Math.ceil(expectedBytes * 4 / 3) + 2
    || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return false;
  try {
    const decoded = fromB64(value);
    return decoded.length === expectedBytes
      && toB64(decoded).replace(/=+$/, '') === value.replace(/=+$/, '');
  } catch { return false; }
}

function parseVaultRecord(value: unknown): VaultRecord | null {
  try {
    if (typeof value === 'string' && value.length > 16_384) return null;
    const record = typeof value === 'string' ? JSON.parse(value) : value;
    if (!record || typeof record !== 'object' || Array.isArray(record)
      || JSON.stringify(record).length > 16_384) return null;
    const candidate = record as Partial<VaultRecord>;
    const wrappedIsValid = (wrapped: WrappedKey | undefined) => !!wrapped
      && !Array.isArray(wrapped) && hasBase64Length(wrapped.iv, IV_BYTES)
      && hasBase64Length(wrapped.data, 48);
    if (!Number.isInteger(candidate.v) || (candidate.v !== 1 && candidate.v !== VAULT_VERSION)) return null;
    if (!hasBase64Length(candidate.passSalt, SALT_BYTES)) return null;
    if (!hasBase64Length(candidate.recoverySalt, SALT_BYTES)) return null;
    if (!wrappedIsValid(candidate.passWrapped) || !wrappedIsValid(candidate.recoveryWrapped)) return null;
    if (candidate.revision !== undefined
      && (!Number.isSafeInteger(candidate.revision) || candidate.revision < 0)) return null;
    if (candidate.updatedAt !== undefined
      && (typeof candidate.updatedAt !== 'string' || !Number.isFinite(Date.parse(candidate.updatedAt)))) return null;
    return candidate as VaultRecord;
  } catch {
    return null;
  }
}

function recordMetadata(previous?: VaultRecord | null): Pick<VaultRecord, 'revision' | 'updatedAt'> {
  const revision = (previous?.revision ?? 0) + 1;
  if (!Number.isSafeInteger(revision)) throw new Error('Vault revision exhausted');
  return {
    revision,
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
  const token = getLifecycleToken();
  const target = sessionSlot();
  if (!target || getDeviceProtectionPolicy() !== 'transparent') return;
  try {
    const raw = await crypto.subtle.exportKey('raw', mk);
    if (!isLifecycleCurrent(token) || masterKey !== mk
      || getDeviceProtectionPolicy() !== 'transparent') return;
    sessionStorageRef()?.setItem(target, toB64(new Uint8Array(raw)));
  } catch {
    /* best-effort */
  }
}

function clearSessionKey(): void {
  clearRawSessionKey();
}

async function restoreSessionKey(): Promise<void> {
  if (masterKey) return;
  const token = getLifecycleToken();
  const target = sessionSlot();
  if (!target || getDeviceProtectionPolicy() !== 'transparent') {
    clearRawSessionKey();
    return;
  }
  const b64 = sessionStorageRef()?.getItem(target);
  if (!b64) return;
  try {
    const mk = await crypto.subtle.importKey('raw', fromB64(b64), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
    if (isLifecycleCurrent(token) && !masterKey && getDeviceProtectionPolicy() === 'transparent') setMasterKey(mk);
  } catch {
    clearSessionKey();
  }
}

async function doHydrate(): Promise<void> {
  const token = getLifecycleToken();
  const target = recordSlot();
  if (!target) return;
  // One-time migration: if a record still sits in localStorage (older clients),
  // move it into IndexedDB and drop the localStorage copy so the wrapped key no
  // longer persists there.
  const ls = legacyStorage();
  // Unscoped older backups are retained, never assigned to an arbitrary login.
  // Bound accounts recover their authoritative wrapper through vaultSync. The
  // unbound compatibility path is retained for existing direct key-manager use.
  const legacy = !accountContextConfigured ? ls?.getItem(STORAGE_KEY) : null;
  let migrated = false;
  if (legacy) {
    const parsed = parseVaultRecord(legacy);
    try {
      if (!isLifecycleCurrent(token)) return;
      cachedRecord = parsed;
      vaultMetadataUnavailable = !parsed;
      // A corrupt legacy value must not permanently masquerade as a vault and
      // trap the user at an unlock screen that can never succeed.
      if (!parsed) throw new Error('Invalid legacy vault record');
      if (hasIDB()) await idbSet(target, cachedRecord);
      if (!isLifecycleCurrent(token)) return;
      ls?.removeItem(STORAGE_KEY);
      migrated = true;
    } catch {
      if (isLifecycleCurrent(token)) { cachedRecord = null; vaultMetadataUnavailable = true; }
    }
  }
  if (!migrated && hasIDB()) {
    try {
      const persisted = await idbGet(target);
      if (!isLifecycleCurrent(token)) return;
      cachedRecord = persisted == null ? null : parseVaultRecord(persisted);
      vaultMetadataUnavailable = persisted != null && !cachedRecord;
      // Retain corrupt recovery material for diagnosis rather than destroying
      // the only remaining copy during a transient/unsupported read.
    } catch {
      if (isLifecycleCurrent(token)) { cachedRecord = null; vaultMetadataUnavailable = true; }
    }
  }
  if (isLifecycleCurrent(token)) await restoreSessionKey();
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
async function saveRecord(record: VaultRecord, token = getLifecycleToken()): Promise<boolean> {
  if (!isLifecycleCurrent(token)) return false;
  const target = recordSlot();
  if (!target) return false;
  cachedRecord = record;
  vaultMetadataUnavailable = false;
  if (hasIDB()) {
    try { await idbSet(target, record); } catch { /* server sync can still preserve it */ }
  }
  return isLifecycleCurrent(token);
}

// The cache is per tab while IndexedDB is shared. Re-read it before any
// credential operation so a passphrase changed in another tab invalidates the
// old passphrase here too instead of surviving until a full reload.
async function refreshPersistedRecord(): Promise<void> {
  const token = getLifecycleToken();
  const target = recordSlot();
  await hydrate();
  if (!isLifecycleCurrent(token) || !target || !hasIDB()) return;
  try {
    const persisted = parseVaultRecord(await idbGet(target));
    if (isLifecycleCurrent(token) && persisted && recordIsNewer(persisted, cachedRecord)) cachedRecord = persisted;
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
  // A newly verified unlock starts its own countdown, rather than inheriting
  // the previous unlock's expired deadline.
  clearAutoLock();
  masterKey = mk;
  if (mk) { resetAutoLock(); persistSessionKey(mk); }
  else { clearAutoLock(); clearSessionKey(); }
  for (const l of listeners) l(mk !== null);
}

function clearAutoLock(): void {
  if (autoLockTimer !== null) {
    clearTimeout(autoLockTimer);
    autoLockTimer = null;
  }
  autoLockDeadline = null;
}

// Timer callbacks can be throttled while a tab is hidden or a device sleeps.
// Activity must enforce the old wall-clock deadline before extending it.
function enforceAutoLockDeadline(): void {
  if (masterKey && autoLockDeadline !== null && Date.now() >= autoLockDeadline) lock();
}

export function resetAutoLock(): void {
  enforceAutoLockDeadline();
  if (!masterKey) return;
  clearAutoLock();
  const effectiveMs = getDeviceProtectionPolicy() === 'transparent' ? autoLockMs : PROTECTED_AUTO_LOCK_MS;
  if (effectiveMs > 0) {
    autoLockDeadline = Date.now() + effectiveMs;
    autoLockTimer = setTimeout(lock, effectiveMs);
  }
}

export function setAutoLockMs(ms: number): void {
  autoLockMs = Number.isFinite(ms) && ms >= 0 ? ms : DEFAULT_AUTO_LOCK_MS;
  resetAutoLock();
}

// ─── Public API ──────────────────────────────────────────────────────────────
export function isVaultInitialized(): boolean {
  return loadRecord() !== null;
}

export function isVaultMetadataUnavailable(): boolean {
  return vaultMetadataUnavailable;
}

export function isUnlocked(): boolean {
  enforceAutoLockDeadline();
  return masterKey !== null;
}

// The in-memory master key for encrypt/decrypt. Throws if the vault is locked —
// callers must unlock first (or check isUnlocked()).
export function getMasterKey(): CryptoKey {
  enforceAutoLockDeadline();
  if (!masterKey) throw new Error('Vault is locked');
  return masterKey;
}

// First-time setup. Returns the recovery code to show the user ONCE; it is not
// stored anywhere in retrievable form.
export async function createVault(passphrase: string): Promise<string> {
  const token = getLifecycleToken();
  if (cachedRecord && !masterKey) throw new Error('Unlock existing recovery before changing it');
  const generated = masterKey ?? await generateMasterKey();
  const mk = masterKey ?? generated;
  const previous = cachedRecord;
  const recoveryCode = generateRecoveryCode();
  const passSalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const recoverySalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));

  const passKey = await deriveWrappingKey(passphrase, passSalt);
  const recoveryKey = await deriveWrappingKey(normalizeRecoveryCode(recoveryCode)!, recoverySalt);

  const passWrapped = await wrapMasterKey(mk, passKey);
  const recoveryWrapped = await wrapMasterKey(mk, recoveryKey);
  if (!isLifecycleCurrent(token) || cachedRecord !== previous || (masterKey && masterKey !== mk)) {
    throw new Error('Account changed during recovery setup');
  }
  const saved = await saveRecord({
    v: VAULT_VERSION,
    passSalt: toB64(passSalt),
    recoverySalt: toB64(recoverySalt),
    passWrapped,
    recoveryWrapped,
    ...recordMetadata(previous),
  }, token);
  if (!saved) throw new Error('Account changed during recovery setup');
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
  const token = getLifecycleToken();
  if (accountContextConfigured && !accountId) return;
  if (getDeviceProtectionPolicy() !== 'transparent') return;
  const mk = await generateMasterKey();
  if (isLifecycleCurrent(token) && !masterKey && getDeviceProtectionPolicy() === 'transparent') setMasterKey(mk);
}

// Turn on recovery / cross-device access for the key ALREADY in memory: wrap it
// under a passphrase + a fresh recovery code and persist the wrapped record
// (which vaultSync uploads). Unlike createVault it never generates a new key, so
// all existing ciphertext stays readable. Returns the one-time recovery code, or
// null if no key is loaded.
export async function setUpRecovery(passphrase: string): Promise<string | null> {
  const mk = masterKey;
  const token = getLifecycleToken();
  const previous = cachedRecord;
  if (!mk) return null;
  const recoveryCode = generateRecoveryCode();
  const passSalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const recoverySalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const passKey = await deriveWrappingKey(passphrase, passSalt);
  const recoveryKey = await deriveWrappingKey(normalizeRecoveryCode(recoveryCode)!, recoverySalt);
  const passWrapped = await wrapMasterKey(mk, passKey);
  const recoveryWrapped = await wrapMasterKey(mk, recoveryKey);
  if (!isLifecycleCurrent(token) || masterKey !== mk || cachedRecord !== previous) return null;
  if (!await saveRecord({
    v: VAULT_VERSION,
    passSalt: toB64(passSalt),
    recoverySalt: toB64(recoverySalt),
    passWrapped,
    recoveryWrapped,
    ...recordMetadata(previous),
  }, token)) return null;
  return recoveryCode;
}

// New recovery methods unwrap into a candidate, prove it against existing
// account-bound ciphertext, then commit through this common lifecycle fence.
export async function installCandidateMasterKey(candidate: CryptoKey, options: CandidateKeyOptions = {}): Promise<boolean> {
  const token = options.token ?? getLifecycleToken();
  if ((accountContextConfigured && !accountId) || !isLifecycleCurrent(token) || candidate?.algorithm?.name !== 'AES-GCM'
    || (candidate.algorithm as AesKeyAlgorithm).length !== 256
    || getDeviceProtectionPolicy() === 'unknown') return false;
  try {
    if (options.verifyCandidate && !await options.verifyCandidate(candidate)) return false;
    if (!isLifecycleCurrent(token) || getDeviceProtectionPolicy() === 'unknown') return false;
    setMasterKey(candidate);
    return true;
  } catch { return false; }
}

// Load a raw (base64) account key into memory — restores the transparent
// per-user key on boot (see accountKey.ensureAccountCryptoReady). Returns false
// if the bytes aren't a valid AES-GCM key.
export async function importRawMasterKey(b64: string, options: CandidateKeyOptions = {}): Promise<boolean> {
  const token = options.token ?? getLifecycleToken();
  if (!isLifecycleCurrent(token) || getDeviceProtectionPolicy() !== 'transparent') return false;
  try {
    const mk = await crypto.subtle.importKey('raw', fromB64(b64), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
    if (getDeviceProtectionPolicy() !== 'transparent') return false;
    return await installCandidateMasterKey(mk, { ...options, token });
  } catch {
    return false;
  }
}

// Export the in-memory account key as base64 so the accountKey layer can persist
// it for transparent access on this device. Null when locked.
export async function exportRawMasterKey(): Promise<string | null> {
  const mk = masterKey;
  const token = getLifecycleToken();
  if (!mk) return null;
  try {
    const raw = await crypto.subtle.exportKey('raw', mk);
    return isLifecycleCurrent(token) && masterKey === mk ? toB64(new Uint8Array(raw)) : null;
  } catch {
    return null;
  }
}

// Unlock with the passphrase. Returns false on a wrong passphrase (no throw).
export async function unlock(passphrase: string, options: CandidateKeyOptions = {}): Promise<boolean> {
  const token = options.token ?? getLifecycleToken();
  await refreshPersistedRecord();
  const record = loadRecord();
  if (!record || !isLifecycleCurrent(token)) return false;
  try {
    const passKey = await deriveWrappingKey(passphrase, fromB64(record.passSalt));
    const mk = await unwrapMasterKey(record.passWrapped, passKey);
    if (!isLifecycleCurrent(token) || cachedRecord !== record) return false;
    return await installCandidateMasterKey(mk, { ...options, token });
  } catch {
    return false;
  }
}

export function getLifecycleToken(): LifecycleToken {
  enforceAutoLockDeadline();
  return Object.freeze({ accountId, generation: lifecycleGeneration });
}

export function isAccountContextConfigured(): boolean {
  return accountContextConfigured;
}

export function isLifecycleCurrent(token: LifecycleToken): boolean {
  enforceAutoLockDeadline();
  return token.accountId === accountId && token.generation === lifecycleGeneration;
}

// This durable policy is enforced independently of feature flags. An unreadable
// or unknown marker never authorizes a return to transparent raw-key storage.
export function getDeviceProtectionPolicy(userId: string | null = accountId): 'transparent' | 'protected' | 'unknown' {
  if (!userId) return 'transparent';
  try {
    const storage = legacyStorage();
    if (!storage) return 'unknown';
    const value = storage.getItem(protectionSlot(userId));
    return value === null ? 'transparent' : value === 'v1' ? 'protected' : 'unknown';
  } catch { return 'unknown'; }
}

export function clearRawSessionKey(userId: string | null = accountId): boolean {
  try {
    // Read directly so a denied getter is an unverified cleanup, rather than
    // confusing it with an environment that has no session storage at all.
    const storage = globalThis.sessionStorage;
    storage?.removeItem(SESSION_KEY); // never restore an unowned legacy session
    if (userId) storage?.removeItem(`${SESSION_KEY}:${userId}`);
    return !storage || (storage.getItem(SESSION_KEY) === null
      && (!userId || storage.getItem(`${SESSION_KEY}:${userId}`) === null));
  } catch { return false; }
}

export function setDeviceProtectionPolicy(userId: string, enabled: boolean): boolean {
  if (!userId) return false;
  try {
    const storage = legacyStorage();
    if (!storage) return false;
    if (enabled) storage.setItem(protectionSlot(userId), 'v1');
    else storage.removeItem(protectionSlot(userId));
    clearRawSessionKey(userId);
    if (userId === accountId) resetAutoLock();
    return getDeviceProtectionPolicy(userId) === (enabled ? 'protected' : 'transparent');
  } catch { return false; }
}

// Auth handlers call this synchronously before exposing another account. No
// pending hydration, unwrap or session export may resurrect the previous key.
export function configureAccountContext(userId: string | null): void {
  const next = userId || null;
  if (accountContextConfigured && accountId === next) return;
  const previous = accountId;
  lifecycleGeneration += 1;
  clearRawSessionKey(previous);
  accountId = next;
  accountContextConfigured = true;
  masterKey = null;
  cachedRecord = null;
  vaultMetadataUnavailable = false;
  hydration = null;
  clearAutoLock();
  for (const listener of listeners) listener(false);
}

// Prove that a recovery record opens THIS running device's content key without
// replacing it. Origin migration uses the server's wrapped record so a stale
// local wrapper cannot silently overwrite newer recovery settings. The random
// challenge stays in memory; neither raw keys nor the passphrase leave here.
export async function verifyRecoveryPassphrase(passphrase: string, recordJson?: unknown): Promise<boolean> {
  const token = getLifecycleToken();
  const currentKey = masterKey;
  const record = recordJson === undefined ? loadRecord() : parseVaultRecord(recordJson);
  if (!currentKey || !record) return false;
  try {
    const passKey = await deriveWrappingKey(passphrase, fromB64(record.passSalt));
    const recoveredKey = await unwrapMasterKey(record.passWrapped, passKey);
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, currentKey, challenge);
    const plaintext = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, recoveredKey, ciphertext));
    return isLifecycleCurrent(token) && masterKey === currentKey && plaintext.length === challenge.length
      && plaintext.every((byte, index) => byte === challenge[index]);
  } catch {
    return false;
  }
}

// Test an emergency credential without resetting a passphrase, changing a
// wrapper, or replacing the running content key.
export async function verifyRecoveryCode(code: string, recordJson?: unknown): Promise<boolean> {
  const token = getLifecycleToken();
  const currentKey = masterKey;
  const record = recordJson === undefined ? loadRecord() : parseVaultRecord(recordJson);
  if (!currentKey || !record) return false;
  const normalized = normalizeRecoveryCode(code, record.v);
  if (!normalized) return false;
  try {
    const wrappingKey = await deriveWrappingKey(normalized, fromB64(record.recoverySalt));
    const recoveredKey = await unwrapMasterKey(record.recoveryWrapped, wrappingKey);
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, currentKey, challenge);
    const plaintext = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, recoveredKey, ciphertext));
    return isLifecycleCurrent(token) && masterKey === currentKey && plaintext.length === challenge.length
      && plaintext.every((byte, index) => byte === challenge[index]);
  } catch { return false; }
}

// Recover access with the recovery code and set a new passphrase (re-wrapping
// the same master key, so existing ciphertext stays readable).
export async function resetPassphrase(recoveryCode: string, newPassphrase: string, options: CandidateKeyOptions = {}): Promise<boolean> {
  const token = options.token ?? getLifecycleToken();
  await refreshPersistedRecord();
  const record = loadRecord();
  if (!record || !isLifecycleCurrent(token)) return false;
  const normalized = normalizeRecoveryCode(recoveryCode, record.v ?? 1);
  if (!normalized) return false;
  let mk: CryptoKey;
  try {
    const recoveryKey = await deriveWrappingKey(normalized, fromB64(record.recoverySalt));
    mk = await unwrapMasterKey(record.recoveryWrapped, recoveryKey);
    if (options.verifyCandidate && !await options.verifyCandidate(mk)) return false;
  } catch {
    return false;
  }
  const passSalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const passKey = await deriveWrappingKey(newPassphrase, passSalt);
  const passWrapped = await wrapMasterKey(mk, passKey);
  if (!isLifecycleCurrent(token) || cachedRecord !== record) return false;
  if (!await saveRecord({
    ...record,
    passSalt: toB64(passSalt),
    passWrapped,
    ...recordMetadata(record),
  }, token)) return false;
  return await installCandidateMasterKey(mk, { token });
}

// Change the passphrase while unlocked (or by supplying the current one).
export async function changePassphrase(currentPassphrase: string, newPassphrase: string, options: CandidateKeyOptions = {}): Promise<boolean> {
  const token = options.token ?? getLifecycleToken();
  await refreshPersistedRecord();
  const record = loadRecord();
  if (!record || !isLifecycleCurrent(token)) return false;
  let mk: CryptoKey;
  try {
    const currentKey = await deriveWrappingKey(currentPassphrase, fromB64(record.passSalt));
    mk = await unwrapMasterKey(record.passWrapped, currentKey);
    if (options.verifyCandidate && !await options.verifyCandidate(mk)) return false;
  } catch {
    return false;
  }
  const passSalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const passKey = await deriveWrappingKey(newPassphrase, passSalt);
  const passWrapped = await wrapMasterKey(mk, passKey);
  if (!isLifecycleCurrent(token) || cachedRecord !== record) return false;
  if (!await saveRecord({
    ...record,
    passSalt: toB64(passSalt),
    passWrapped,
    ...recordMetadata(record),
  }, token)) return false;
  return await installCandidateMasterKey(mk, { token });
}

// Rotate the recovery code while the vault is unlocked. Generates a fresh code,
// re-wraps the SAME master key under it (so existing ciphertext stays readable),
// and invalidates the previous code. Returns the new code to show the user once,
// or null if the vault is locked (no master key in memory to re-wrap). The
// passphrase wrapping is untouched.
export async function rotateRecoveryCode(): Promise<string | null> {
  const token = getLifecycleToken();
  await refreshPersistedRecord();
  const record = loadRecord();
  const mk = masterKey;
  if (!record || !mk || !isLifecycleCurrent(token)) return null;
  const recoveryCode = generateRecoveryCode();
  const recoverySalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const recoveryKey = await deriveWrappingKey(normalizeRecoveryCode(recoveryCode)!, recoverySalt);
  const recoveryWrapped = await wrapMasterKey(mk, recoveryKey);
  if (!isLifecycleCurrent(token) || cachedRecord !== record || masterKey !== mk) return null;
  if (!await saveRecord({
    ...record,
    v: VAULT_VERSION,
    recoverySalt: toB64(recoverySalt),
    recoveryWrapped,
    ...recordMetadata(record),
  }, token)) return null;
  return recoveryCode;
}

// Drop the master key from memory. Encrypted data on disk stays encrypted.
export function lock(): void {
  lifecycleGeneration += 1;
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
  const target = recordSlot();
  const unboundCompatibility = !accountContextConfigured;
  cachedRecord = null;
  vaultMetadataUnavailable = false;
  lock();
  const token = getLifecycleToken();
  if (unboundCompatibility) legacyStorage()?.removeItem(STORAGE_KEY);
  if (target && hasIDB()) {
    try {
      await idbDel(target);
    } catch {
      /* best-effort */
    }
  }
  // A later account in the same SPA session must hydrate its own newly pulled
  // record instead of reusing this already-resolved hydration promise.
  if (isLifecycleCurrent(token)) hydration = null;
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
export async function importVaultRecord(recordJson: string | object, overwrite = false, token = getLifecycleToken()): Promise<boolean> {
  if (!isLifecycleCurrent(token)) return false;
  if (!overwrite && cachedRecord) return false;
  const record = parseVaultRecord(recordJson);
  if (!record) return false;
  return await saveRecord(record, token);
}

// Unscoped pre-migration material may be the only surviving backup. Expose it
// explicitly for a verified migration; never publish it for a different login.
export async function readUnassignedLegacyVaultRecord({ strict = false }: { strict?: boolean } = {}): Promise<string | null> {
  try {
    const persisted = hasIDB() ? await idbGet(STORAGE_KEY) : null;
    const legacy = legacyStorage()?.getItem(STORAGE_KEY);
    const parsed = parseVaultRecord(persisted) ?? parseVaultRecord(legacy);
    if (strict && !parsed && (persisted != null || legacy != null)) throw new Error('Invalid local recovery metadata');
    return parsed ? JSON.stringify(parsed) : null;
  } catch (error) { if (strict) throw error; return null; }
}

export async function recoverUnassignedLegacyVault(secret: string, options: CandidateKeyOptions & {
  method?: 'passphrase' | 'code' | 'recoveryCode';
  verifyCandidate: (key: CryptoKey) => Promise<boolean> | boolean;
}): Promise<boolean> {
  const token = options?.token ?? getLifecycleToken();
  if (!accountId || !isLifecycleCurrent(token) || cachedRecord || typeof options?.verifyCandidate !== 'function') return false;
  const record = parseVaultRecord(await readUnassignedLegacyVaultRecord());
  if (!record || !isLifecycleCurrent(token)) return false;
  try {
    const usingCode = options.method === 'code' || options.method === 'recoveryCode';
    const normalized = usingCode ? normalizeRecoveryCode(secret, record.v) : secret;
    if (!normalized) return false;
    const wrappingKey = await deriveWrappingKey(normalized, fromB64(usingCode ? record.recoverySalt : record.passSalt));
    const candidate = await unwrapMasterKey(usingCode ? record.recoveryWrapped : record.passWrapped, wrappingKey);
    if (!await options.verifyCandidate(candidate) || !isLifecycleCurrent(token) || cachedRecord) return false;
    if (!await saveRecord(record, token)) return false;
    return await installCandidateMasterKey(candidate, { token });
  } catch { return false; }
}

// IndexedDB is shared but sessionStorage and running keys are tab-local. The
// durable localStorage policy/lock event closes those raw paths in other tabs
// before a pending export or unwrap can commit. The enabling tab keeps its
// already-authorized running key until its own selected lock boundary.
export function handleAccountSecurityStorageChange(key: string | null): void {
  if (!accountId) return;
  if (key === protectionSlot(accountId)) {
    if (getDeviceProtectionPolicy() !== 'transparent') lock();
    else resetAutoLock();
  } else if (key === `pfm_ak_locked_${accountId}`) {
    try { if (legacyStorage()?.getItem(key)) lock(); } catch { lock(); }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event: StorageEvent) => handleAccountSecurityStorageChange(event.key));
}
