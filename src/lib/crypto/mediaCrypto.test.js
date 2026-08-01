// Round-trip proof for per-file media encryption: bytes go out as ciphertext
// and only come back with the exact key + IV from the attachment metadata.
import { describe, it, expect } from 'vitest';
import { encryptBlob, decryptToBlob } from './mediaCrypto';

const CONTENT = 'not-really-a-photo-but-bytes-are-bytes';

describe('mediaCrypto', () => {
  const context = { ownerOrGroupId: 'user-1', recordId: 'attachment-1' };
  const metadata = (encrypted, overrides = {}) => ({
    key: encrypted.key,
    iv: encrypted.iv,
    encryptionVersion: encrypted.encryptionVersion,
    id: context.recordId,
    path: `${context.ownerOrGroupId}/${context.recordId}`,
    ...overrides,
  });

  it('encrypts a blob and decrypts it back with the returned key/iv', async () => {
    const source = new Blob([CONTENT], { type: 'image/jpeg' });
    const encrypted = await encryptBlob(source, context);
    const { bytes } = encrypted;

    // The ciphertext must not contain the plaintext.
    const asText = new TextDecoder().decode(new Uint8Array(bytes));
    expect(asText).not.toContain(CONTENT);

    const restored = await decryptToBlob(bytes, metadata(encrypted, { mime: 'image/jpeg' }));
    expect(await restored.text()).toBe(CONTENT);
    expect(restored.type).toBe('image/jpeg');
  });

  it('every encryption uses a fresh key — one file leaking never opens another', async () => {
    const a = await encryptBlob(new Blob(['same content']), context);
    const b = await encryptBlob(new Blob(['same content']), context);
    expect(a.key).not.toBe(b.key);
    expect(a.iv).not.toBe(b.iv);
  });

  it('rejects a tampered ciphertext instead of returning garbage', async () => {
    const encrypted = await encryptBlob(new Blob(['authentic']), context);
    const { bytes } = encrypted;
    const tampered = new Uint8Array(bytes);
    tampered[0] ^= 0xff;
    await expect(decryptToBlob(tampered.buffer, metadata(encrypted))).rejects.toThrow();
  });

  it('rejects the wrong key', async () => {
    const encrypted = await encryptBlob(new Blob(['secret']), context);
    const other = await encryptBlob(new Blob(['x']), context);
    await expect(decryptToBlob(encrypted.bytes, metadata(encrypted, { key: other.key }))).rejects.toThrow();
  });

  it('rejects media copied to another attachment or owner context', async () => {
    const encrypted = await encryptBlob(new Blob(['secret']), context);
    await expect(decryptToBlob(encrypted.bytes, metadata(encrypted, { id: 'attachment-2' }))).rejects.toThrow();
    await expect(decryptToBlob(encrypted.bytes, metadata(encrypted, { path: 'user-2/attachment-1' }))).rejects.toThrow();
  });
});
