// End-to-end encryption primitives — AES-256-GCM over JSON payloads.
//
// Everything here runs client-side only. The CryptoKey passed in never leaves
// the device (see keyManager.ts); Supabase only ever receives the opaque
// `EncryptedPayload` produced below, so the server stores ciphertext it cannot
// read. GCM is authenticated: a tampered ciphertext fails to decrypt rather
// than yielding garbage.

export const ENCRYPTION_VERSION = 2;
const IV_BYTES = 12; // 96-bit nonce, the standard size for AES-GCM

// Opaque blob persisted in place of the plaintext field(s). `v` lets us evolve
// the scheme later (matches the `encryption_version` column).
export interface EncryptedPayload {
  v: number;
  iv: string; // base64 nonce — unique per encryption
  ct: string; // base64 ciphertext (includes the GCM auth tag)
}

export interface EncryptionContext {
  schemaVersion?: number;
  entityType: string;
  ownerOrGroupId?: string | null;
  recordId: string;
  parentId?: string | null;
  keyVersion?: number | null;
  field?: string | null;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

export function canonicalEncryptionContext(context: EncryptionContext): string {
  if (!context || typeof context.entityType !== 'string' || !context.entityType) {
    throw new Error('Encryption context requires an entity type');
  }
  if (typeof context.recordId !== 'string' || !context.recordId) {
    throw new Error('Encryption context requires a client-generated record id');
  }
  return JSON.stringify([
    context.schemaVersion ?? ENCRYPTION_VERSION,
    context.entityType,
    context.ownerOrGroupId ?? '',
    context.recordId,
    context.parentId ?? '',
    context.keyVersion ?? 1,
    context.field ?? 'payload',
  ]);
}

export function encryptionAdditionalData(context: EncryptionContext): Uint8Array<ArrayBuffer> {
  return enc.encode(canonicalEncryptionContext(context));
}

// base64 helpers that work in both the browser and the Node test runner
// (btoa/atob are globals in both). We avoid Buffer to stay environment-agnostic.
export function toB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
}

export function fromB64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Encrypt any JSON-serialisable value. A fresh random IV is generated per call,
// which is mandatory for GCM security (never reuse an IV with the same key).
export async function encryptJson(
  key: CryptoKey,
  data: unknown,
  context: EncryptionContext,
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const plaintext = enc.encode(JSON.stringify(data));
  const additionalData = encryptionAdditionalData(context);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData }, key, plaintext);
  return { v: ENCRYPTION_VERSION, iv: toB64(iv), ct: toB64(new Uint8Array(ct)) };
}

// Migration/test helper for ciphertext written before context binding. New
// application writes must use encryptJson with a complete context.
export async function encryptJsonLegacy(key: CryptoKey, data: unknown): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const plaintext = enc.encode(JSON.stringify(data));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return { v: 1, iv: toB64(iv), ct: toB64(new Uint8Array(ct)) };
}

// Decrypt a payload produced by encryptJson. Throws if the key is wrong or the
// ciphertext was tampered with (GCM authentication failure) — callers treat a
// throw as "cannot decrypt" rather than trusting partial output.
export async function decryptJson<T = unknown>(
  key: CryptoKey,
  payload: EncryptedPayload,
  context?: EncryptionContext,
): Promise<T> {
  const iv = fromB64(payload.iv);
  const ct = fromB64(payload.ct);
  const params: AesGcmParams = payload.v >= ENCRYPTION_VERSION
    ? { name: 'AES-GCM', iv, additionalData: encryptionAdditionalData(context!) }
    : { name: 'AES-GCM', iv };
  const plaintext = await crypto.subtle.decrypt(params, key, ct);
  return JSON.parse(dec.decode(plaintext)) as T;
}

// Type guard so store/cache code can tell an encrypted blob from legacy
// plaintext during the migration window.
export function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as EncryptedPayload).v === 'number' &&
    typeof (value as EncryptedPayload).iv === 'string' &&
    typeof (value as EncryptedPayload).ct === 'string'
  );
}
