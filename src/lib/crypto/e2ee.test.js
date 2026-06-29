import { describe, it, expect, beforeAll } from 'vitest';
import { encryptJson, decryptJson, isEncryptedPayload, toB64, fromB64 } from './e2ee.ts';

async function aesKey() {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

describe('base64 round-trip', () => {
  it('preserves arbitrary bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 127, 128, 200, 255]);
    expect(Array.from(fromB64(toB64(bytes)))).toEqual(Array.from(bytes));
  });
});

describe('encryptJson / decryptJson', () => {
  let key;
  beforeAll(async () => { key = await aesKey(); });

  it('round-trips a JSON object', async () => {
    const data = { title: 'Pour ma famille', phone: '+33 6 12 34 56 78', n: 3, tags: ['a', 'b'] };
    const payload = await encryptJson(key, data);
    expect(isEncryptedPayload(payload)).toBe(true);
    expect(await decryptJson(key, payload)).toEqual(data);
  });

  it('produces ciphertext, not plaintext', async () => {
    const payload = await encryptJson(key, { secret: 'do-not-leak' });
    expect(JSON.stringify(payload)).not.toContain('do-not-leak');
  });

  it('uses a fresh IV each call (no nonce reuse)', async () => {
    const a = await encryptJson(key, { x: 1 });
    const b = await encryptJson(key, { x: 1 });
    expect(a.iv).not.toEqual(b.iv);
    expect(a.ct).not.toEqual(b.ct);
  });

  it('fails to decrypt with the wrong key', async () => {
    const payload = await encryptJson(key, { x: 1 });
    const other = await aesKey();
    await expect(decryptJson(other, payload)).rejects.toBeDefined();
  });

  it('rejects a tampered ciphertext (GCM authentication)', async () => {
    const payload = await encryptJson(key, { x: 1 });
    const bytes = fromB64(payload.ct);
    bytes[0] ^= 0xff;
    await expect(decryptJson(key, { ...payload, ct: toB64(bytes) })).rejects.toBeDefined();
  });
});

describe('isEncryptedPayload', () => {
  it('rejects legacy plaintext values', () => {
    expect(isEncryptedPayload('a plain title')).toBe(false);
    expect(isEncryptedPayload(null)).toBe(false);
    expect(isEncryptedPayload({ v: 1 })).toBe(false);
  });
});
