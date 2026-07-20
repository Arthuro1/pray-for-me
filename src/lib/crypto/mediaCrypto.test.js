// Round-trip proof for per-file media encryption: bytes go out as ciphertext
// and only come back with the exact key + IV from the attachment metadata.
import { describe, it, expect } from 'vitest';
import { encryptBlob, decryptToBlob } from './mediaCrypto';

const CONTENT = 'not-really-a-photo-but-bytes-are-bytes';

describe('mediaCrypto', () => {
  it('encrypts a blob and decrypts it back with the returned key/iv', async () => {
    const source = new Blob([CONTENT], { type: 'image/jpeg' });
    const { bytes, key, iv } = await encryptBlob(source);

    // The ciphertext must not contain the plaintext.
    const asText = new TextDecoder().decode(new Uint8Array(bytes));
    expect(asText).not.toContain(CONTENT);

    const restored = await decryptToBlob(bytes, { key, iv, mime: 'image/jpeg' });
    expect(await restored.text()).toBe(CONTENT);
    expect(restored.type).toBe('image/jpeg');
  });

  it('every encryption uses a fresh key — one file leaking never opens another', async () => {
    const a = await encryptBlob(new Blob(['same content']));
    const b = await encryptBlob(new Blob(['same content']));
    expect(a.key).not.toBe(b.key);
    expect(a.iv).not.toBe(b.iv);
  });

  it('rejects a tampered ciphertext instead of returning garbage', async () => {
    const { bytes, key, iv } = await encryptBlob(new Blob(['authentic']));
    const tampered = new Uint8Array(bytes);
    tampered[0] ^= 0xff;
    await expect(decryptToBlob(tampered.buffer, { key, iv })).rejects.toThrow();
  });

  it('rejects the wrong key', async () => {
    const { bytes, iv } = await encryptBlob(new Blob(['secret']));
    const other = await encryptBlob(new Blob(['x']));
    await expect(decryptToBlob(bytes, { key: other.key, iv })).rejects.toThrow();
  });
});
