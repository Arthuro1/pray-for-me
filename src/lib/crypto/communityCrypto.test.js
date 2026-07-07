import { describe, it, expect } from 'vitest';
import {
  encryptCommunityPrayer,
  encryptCommunityUpdate,
  encryptCommunityTestimony,
  decryptCommunityRow,
  decryptCommunityRows,
  isCommunityEncrypted,
  COMMUNITY_ENCRYPTION_VERSION,
} from './communityCrypto';

// A group content key is just an AES-256-GCM key + its version — no server/key
// distribution needed to exercise the envelope itself.
async function makeGroupKey(version = 1) {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  return { key, version };
}
const resolverFor = (gk) => async (version) => (version === gk.version ? gk : null);

describe('community prayer envelope', () => {
  const SECRETS = { title: 'SECRET_pray_for_marie', description: 'SECRET_she_is_ill' };

  it('moves title/description/prayer_points into encrypted_payload and redacts the columns', async () => {
    const gk = await makeGroupKey(1);
    const row = {
      id: 'cp-1',
      group_id: 'g-1',
      title: SECRETS.title,
      description: SECRETS.description,
      prayer_points: [{ id: 'p1', title: 'SECRET_point', verses: [] }],
      is_anonymous: false,
    };
    const enc = await encryptCommunityPrayer(gk, row);

    const json = JSON.stringify(enc);
    expect(json).not.toContain(SECRETS.title);
    expect(json).not.toContain(SECRETS.description);
    expect(json).not.toContain('SECRET_point');
    expect(enc.title).toBe('');
    expect(enc.description).toBe('');
    expect(enc.prayer_points).toEqual([]);
    expect(enc.encryption_version).toBe(COMMUNITY_ENCRYPTION_VERSION);
    expect(enc.key_version).toBe(1);
    expect(isCommunityEncrypted(enc)).toBe(true);
    // Non-sensitive columns are preserved.
    expect(enc.group_id).toBe('g-1');
    expect(enc.is_anonymous).toBe(false);
  });

  it('round-trips back to the original plaintext under the resolved group key', async () => {
    const gk = await makeGroupKey(1);
    const row = { id: 'cp-2', title: SECRETS.title, description: SECRETS.description, prayer_points: [{ id: 'p', title: 't', verses: [{ ref: 'Ps 23', text: 'x' }] }] };
    const enc = await encryptCommunityPrayer(gk, row);

    const dec = await decryptCommunityRow(resolverFor(gk), enc);
    expect(dec.title).toBe(SECRETS.title);
    expect(dec.description).toBe(SECRETS.description);
    expect(dec.prayer_points).toEqual(row.prayer_points);
    expect(dec._locked).toBe(false);
    expect(dec.encrypted_payload).toBeUndefined();
    expect(dec.encryption_version).toBeUndefined();
  });

  it('decrypts each row with the GCK matching its own key_version (survives rotation)', async () => {
    const v1 = await makeGroupKey(1);
    const v2 = await makeGroupKey(2);
    const encV1 = await encryptCommunityPrayer(v1, { id: 'old', title: 'OLD_content' });
    const encV2 = await encryptCommunityPrayer(v2, { id: 'new', title: 'NEW_content' });

    // A resolver holding BOTH versions restores each with the right key.
    const resolve = async (version) => (version === 1 ? v1 : version === 2 ? v2 : null);
    const [a, b] = await decryptCommunityRows(resolve, [encV1, encV2]);
    expect(a.title).toBe('OLD_content');
    expect(b.title).toBe('NEW_content');
  });

  it('flags _locked when the key version cannot be resolved (no wrapped key)', async () => {
    const gk = await makeGroupKey(1);
    const enc = await encryptCommunityPrayer(gk, { id: 'cp', title: SECRETS.title });
    const dec = await decryptCommunityRow(async () => null, enc);
    expect(dec._locked).toBe(true);
    expect(dec.title).toBe(''); // stays redacted, no plaintext leaks
  });

  it('flags _locked when the wrong key is resolved (GCM auth failure)', async () => {
    const gk = await makeGroupKey(1);
    const wrong = await makeGroupKey(1);
    const enc = await encryptCommunityPrayer(gk, { id: 'cp', title: SECRETS.title });
    const dec = await decryptCommunityRow(async () => wrong, enc);
    expect(dec._locked).toBe(true);
  });

  it('passes legacy plaintext rows (no encrypted_payload) straight through', async () => {
    const legacy = { id: 'legacy', title: 'plain title', description: 'plain', prayer_points: [] };
    expect(isCommunityEncrypted(legacy)).toBe(false);
    const dec = await decryptCommunityRow(async () => null, legacy);
    expect(dec).toEqual(legacy);
    expect(dec._locked).toBeUndefined();
  });

  it('preserves joined aggregates (counts) on decrypted rows', async () => {
    const gk = await makeGroupKey(1);
    const enc = await encryptCommunityPrayer(gk, { id: 'cp', title: 't', community_updates: [{ count: 3 }], prayer_reactions: [{ count: 5 }] });
    const dec = await decryptCommunityRow(resolverFor(gk), enc);
    expect(dec.community_updates).toEqual([{ count: 3 }]);
    expect(dec.prayer_reactions).toEqual([{ count: 5 }]);
  });
});

describe('community update + testimony envelopes', () => {
  it('encrypts an update text and round-trips it', async () => {
    const gk = await makeGroupKey(1);
    const enc = await encryptCommunityUpdate(gk, { id: 'u', community_prayer_id: 'cp', text: 'SECRET_update_text', author_name: 'Ann' });
    expect(JSON.stringify(enc)).not.toContain('SECRET_update_text');
    expect(enc.text).toBe('');
    expect(enc.author_name).toBe('Ann'); // non-sensitive column kept
    const dec = await decryptCommunityRow(resolverFor(gk), enc);
    expect(dec.text).toBe('SECRET_update_text');
  });

  it('encrypts a testimony content and round-trips it', async () => {
    const gk = await makeGroupKey(1);
    const enc = await encryptCommunityTestimony(gk, { id: 't', group_id: 'g', content: 'SECRET_testimony', is_anonymous: true });
    expect(JSON.stringify(enc)).not.toContain('SECRET_testimony');
    expect(enc.content).toBe('');
    expect(enc.is_anonymous).toBe(true);
    const dec = await decryptCommunityRow(resolverFor(gk), enc);
    expect(dec.content).toBe('SECRET_testimony');
  });
});
