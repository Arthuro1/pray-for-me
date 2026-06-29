import { describe, it, expect, beforeEach } from 'vitest';
import { createVault, lock } from './keyManager.ts';
import {
  canEncrypt,
  isPrayerEncrypted,
  encryptPrayerForStorage,
  encryptChildForStorage,
  decryptPrayerFromStorage,
  decryptPrayers,
  encryptPrayersForCache,
  SENSITIVE_FIELDS,
  UPDATE_SENSITIVE_FIELDS,
  POINT_SENSITIVE_FIELDS,
} from './prayerCrypto.js';

function installStorage() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

const samplePrayer = () => ({
  id: 'p1',
  user_id: 'u1',
  title: 'For my brother John',
  description: 'Struggling with his health',
  person_name: 'John Doe',
  phone: '+33 6 12 34 56 78',
  status: 'active',
  prayer_updates: [{ id: 'u', text: 'plaintext update' }],
});

beforeEach(() => {
  installStorage();
  lock();
});

describe('canEncrypt', () => {
  it('is false while locked', () => {
    expect(canEncrypt(samplePrayer())).toBe(false);
  });

  it('is true for an owned prayer once unlocked', async () => {
    await createVault('pass-phrase');
    expect(canEncrypt(samplePrayer())).toBe(true);
  });

  it('is false for saved-from-community copies', async () => {
    await createVault('pass-phrase');
    expect(canEncrypt({ ...samplePrayer(), community_origin_id: 'c1' })).toBe(false);
  });
});

describe('encrypt → decrypt round trip', () => {
  beforeEach(async () => { await createVault('pass-phrase'); });

  it('redacts plaintext and stores ciphertext', async () => {
    const enc = await encryptPrayerForStorage(samplePrayer());
    expect(isPrayerEncrypted(enc)).toBe(true);
    for (const f of SENSITIVE_FIELDS) expect(enc[f]).toBe('');
    const serialized = JSON.stringify(enc);
    expect(serialized).not.toContain('John Doe');
    expect(serialized).not.toContain('+33 6 12 34 56 78');
    // Non-sensitive fields are untouched.
    expect(enc.status).toBe('active');
    expect(enc.prayer_updates).toHaveLength(1);
  });

  it('restores the sensitive fields on decrypt', async () => {
    const enc = await encryptPrayerForStorage(samplePrayer());
    const dec = await decryptPrayerFromStorage(enc);
    expect(dec.title).toBe('For my brother John');
    expect(dec.person_name).toBe('John Doe');
    expect(dec.phone).toBe('+33 6 12 34 56 78');
    expect(dec._locked).toBe(false);
  });

  it('flags rows as _locked when the vault is locked', async () => {
    const enc = await encryptPrayerForStorage(samplePrayer());
    lock();
    const dec = await decryptPrayerFromStorage(enc);
    expect(dec._locked).toBe(true);
    expect(dec.title).toBe(''); // still redacted — no leak
  });
});

describe('nested cache encryption (Phase 3b)', () => {
  beforeEach(async () => { await createVault('pass-phrase'); });

  const nestedPrayer = () => ({
    ...samplePrayer(),
    prayer_updates: [{ id: 'u1', text: 'Surgery went well', created_at: '2026-01-01' }],
    prayer_points: [{ id: 'pt1', title: 'Healing', verses: [{ ref: 'Ps 23', text: 'The Lord is my shepherd' }] }],
    testimonies: [{ id: 't1', content: 'Fully recovered, praise God', created_at: '2026-02-01' }],
    testimony: 'legacy testimony text',
  });

  it('default (server) path leaves nested collections in plaintext', async () => {
    const enc = await encryptPrayerForStorage(nestedPrayer());
    // Server rows keep nested data — those live in their own tables / fan out.
    expect(enc.prayer_updates).toHaveLength(1);
    expect(enc.prayer_updates[0].text).toBe('Surgery went well');
  });

  it('cache path redacts nested collections and bundles them as ciphertext', async () => {
    const [enc] = await encryptPrayersForCache([nestedPrayer()]);
    expect(isPrayerEncrypted(enc)).toBe(true);
    expect(enc.prayer_updates).toEqual([]);
    expect(enc.prayer_points).toEqual([]);
    expect(enc.testimonies).toEqual([]);
    expect(enc.testimony).toBe('');
    const serialized = JSON.stringify(enc);
    expect(serialized).not.toContain('Surgery went well');
    expect(serialized).not.toContain('Healing');
    expect(serialized).not.toContain('Fully recovered');
    expect(serialized).not.toContain('legacy testimony text');
  });

  it('restores nested collections on decrypt', async () => {
    const [enc] = await encryptPrayersForCache([nestedPrayer()]);
    const dec = await decryptPrayerFromStorage(enc);
    expect(dec.prayer_updates[0].text).toBe('Surgery went well');
    expect(dec.prayer_points[0].title).toBe('Healing');
    expect(dec.prayer_points[0].verses[0].ref).toBe('Ps 23');
    expect(dec.testimonies[0].content).toBe('Fully recovered, praise God');
    expect(dec.testimony).toBe('legacy testimony text');
    expect(dec._locked).toBe(false);
  });

  it('keeps nested collections redacted when the vault is locked', async () => {
    const [enc] = await encryptPrayersForCache([nestedPrayer()]);
    lock();
    const dec = await decryptPrayerFromStorage(enc);
    expect(dec._locked).toBe(true);
    expect(dec.prayer_updates).toEqual([]);
    expect(dec.testimonies).toEqual([]);
  });

  it('leaves saved-from-community copies untouched', async () => {
    const saved = { ...nestedPrayer(), community_origin_id: 'c1' };
    const [out] = await encryptPrayersForCache([saved]);
    expect(isPrayerEncrypted(out)).toBe(false);
    expect(out.prayer_updates).toHaveLength(1);
  });
});

describe('nested server-side encryption (Phase 3b: prayer_updates / prayer_points)', () => {
  beforeEach(async () => { await createVault('pass-phrase'); });

  const updateRow = () => ({ id: 'u1', prayer_id: 'p1', text: 'Surgery went well', author_name: '', created_at: '2026-01-01' });
  const pointRow = () => ({ id: 'pt1', prayer_id: 'p1', title: 'Healing', verses: [{ ref: 'Ps 23', text: 'The Lord is my shepherd' }] });

  it('encrypts + redacts an update row, leaving non-sensitive columns intact', async () => {
    const enc = await encryptChildForStorage(updateRow(), UPDATE_SENSITIVE_FIELDS);
    expect(enc.text).toBe(''); // redacted
    expect(enc.author_name).toBe(''); // non-sensitive, untouched
    expect(enc.id).toBe('u1');
    expect(enc.encrypted_payload).toBeTruthy();
    expect(JSON.stringify(enc)).not.toContain('Surgery went well');
  });

  it('encrypts + redacts a point row including its verses', async () => {
    const enc = await encryptChildForStorage(pointRow(), POINT_SENSITIVE_FIELDS);
    expect(enc.title).toBe('');
    expect(enc.verses).toEqual([]);
    const serialized = JSON.stringify(enc);
    expect(serialized).not.toContain('Healing');
    expect(serialized).not.toContain('Ps 23');
  });

  it('decrypts encrypted child rows even when the parent row is plaintext', async () => {
    const row = {
      id: 'p1', title: 'plain parent',
      prayer_updates: [await encryptChildForStorage(updateRow(), UPDATE_SENSITIVE_FIELDS)],
      prayer_points: [await encryptChildForStorage(pointRow(), POINT_SENSITIVE_FIELDS)],
    };
    const dec = await decryptPrayerFromStorage(row);
    expect(dec.prayer_updates[0].text).toBe('Surgery went well');
    expect(dec.prayer_updates[0].encrypted_payload).toBeUndefined(); // ciphertext stripped
    expect(dec.prayer_points[0].title).toBe('Healing');
    expect(dec.prayer_points[0].verses[0].ref).toBe('Ps 23');
  });

  it('passes plaintext child rows (shared prayers) through untouched', async () => {
    const row = { id: 'p1', title: 'plain', prayer_updates: [{ id: 'u', text: 'public update' }] };
    const dec = await decryptPrayerFromStorage(row);
    expect(dec.prayer_updates[0].text).toBe('public update');
  });

  it('flags encrypted child rows _locked when the vault is locked', async () => {
    const row = { id: 'p1', prayer_updates: [await encryptChildForStorage(updateRow(), UPDATE_SENSITIVE_FIELDS)] };
    lock();
    const dec = await decryptPrayerFromStorage(row);
    expect(dec.prayer_updates[0]._locked).toBe(true);
    expect(dec.prayer_updates[0].text).toBe(''); // still redacted — no leak
  });
});

describe('backward compatibility', () => {
  it('passes legacy plaintext rows through unchanged', async () => {
    await createVault('pass-phrase');
    const legacy = samplePrayer(); // no encrypted_payload
    expect(isPrayerEncrypted(legacy)).toBe(false);
    const out = await decryptPrayerFromStorage(legacy);
    expect(out).toEqual(legacy);
  });

  it('decryptPrayers preserves order and mixes legacy + encrypted', async () => {
    await createVault('pass-phrase');
    const enc = await encryptPrayerForStorage({ ...samplePrayer(), id: 'p2', title: 'Second' });
    const out = await decryptPrayers([samplePrayer(), enc]);
    expect(out[0].id).toBe('p1');
    expect(out[1].id).toBe('p2');
    expect(out[1].title).toBe('Second');
  });
});
