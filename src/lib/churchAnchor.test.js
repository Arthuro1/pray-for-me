import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ key: null, unlocked: true, row: null, upserts: [] }));

vi.mock('./crypto/keyManager.ts', () => ({
  getMasterKey: () => mocks.key,
  isUnlocked: () => mocks.unlocked,
}));

vi.mock('./supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.row, error: null }) }) }),
      upsert: async (row) => { mocks.upserts.push(row); mocks.row = row; return { error: null }; },
    }),
  },
}));

const { decryptAnchor, encryptAnchor, fetchChurchAnchor, normalizeAnchor, saveChurchAnchor, CHURCH_NAME_MAX } = await import('./churchAnchor');

const USER = 'u1111111-1111-4111-8111-111111111111';
const OTHER = 'u2222222-2222-4222-8222-222222222222';

beforeAll(async () => {
  mocks.key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
});

beforeEach(() => {
  mocks.unlocked = true;
  mocks.row = null;
  mocks.upserts = [];
});

describe('church anchor', () => {
  it('trims, collapses spaces and bounds the name', () => {
    expect(normalizeAnchor({ church: '  Église   de la Grâce ', extra: 'drop' })).toEqual({ church: 'Église de la Grâce' });
    expect(normalizeAnchor({ church: 'x'.repeat(200) })).toEqual({ church: 'x'.repeat(CHURCH_NAME_MAX) });
  });

  it('forgets the small-group name an earlier version stored', async () => {
    const payload = await encryptAnchor(USER, { church: 'Grace Chapel' });
    mocks.row = { private_payload: payload };
    expect(await fetchChurchAnchor(USER)).toEqual({ church: 'Grace Chapel' });
    expect(normalizeAnchor({ church: 'Grace Chapel', smallGroup: 'Tuesday group' })).toEqual({ church: 'Grace Chapel' });
  });

  it('round-trips under the account key and is bound to its owner', async () => {
    const payload = await encryptAnchor(USER, { church: 'Grace Chapel' });
    expect(JSON.stringify(payload)).not.toContain('Grace');
    expect(await decryptAnchor(USER, payload)).toEqual({ church: 'Grace Chapel' });
    await expect(decryptAnchor(OTHER, payload)).rejects.toThrow();
  });

  it('stores only ciphertext and reads it back', async () => {
    expect(await saveChurchAnchor(USER, { church: 'Grace Chapel' })).toBe(true);
    expect(Object.keys(mocks.upserts[0]).sort()).toEqual(['private_payload', 'updated_at', 'user_id']);
    expect(JSON.stringify(mocks.upserts[0])).not.toContain('Grace');
    expect(await fetchChurchAnchor(USER)).toEqual({ church: 'Grace Chapel' });
  });

  it('reads an account with no anchor as empty', async () => {
    mocks.row = { private_payload: null };
    expect(await fetchChurchAnchor(USER)).toEqual({ church: '' });
  });

  it('neither reads nor writes while the vault is locked', async () => {
    mocks.unlocked = false;
    expect(await fetchChurchAnchor(USER)).toBeNull();
    expect(await saveChurchAnchor(USER, { church: 'Grace Chapel' })).toBe(false);
    expect(mocks.upserts).toHaveLength(0);
  });
});
