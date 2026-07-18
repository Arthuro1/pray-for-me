// One consistent audience model: the same facts always produce the same label,
// and a personal prayer with no shares is Private — there is no default that
// widens an audience. AUDIENCE (who can read it) and PROTECTION (encrypted at
// rest) are SEPARATE facts: encryption is never presented as an audience.
import { describe, it, expect } from 'vitest';
import { audienceOf, audienceLabel, protectionOf, protectionLabel, plannedProtection } from './audience';

describe('audienceOf — audience only, never encryption', () => {
  it('defaults a personal prayer to Private regardless of key state', () => {
    expect(audienceOf({}, [])).toEqual({ kind: 'private' });
    expect(audienceOf({ encryption_version: 1 }, [])).toEqual({ kind: 'private' });
  });

  it('names the single group a prayer is shared with', () => {
    const a = audienceOf({}, [{ groupId: 'g1', groupName: 'Église' }]);
    expect(a).toEqual({ kind: 'group', groupName: 'Église' });
  });

  it('counts multiple groups', () => {
    const shares = [{ groupId: 'g1', groupName: 'A' }, { groupId: 'g2', groupName: 'B' }];
    expect(audienceOf({}, shares)).toEqual({ kind: 'groups', count: 2 });
  });

  it('marks a saved-from-community copy as coming from its group', () => {
    const a = audienceOf({ community_origin_id: 'c1', origin_group_name: 'Église' }, []);
    expect(a).toEqual({ kind: 'fromGroup', groupName: 'Église' });
  });
});

// The vault is a READ capability: unlocking lets ciphertext be opened, it never
// retroactively encrypts a plaintext row. So protectionOf reads the prayer's own
// stored encryption metadata and takes no vault argument at all — there is no
// way for lock state to change what a prayer is classified as.
describe('protectionOf — read from the prayer, never from the vault', () => {
  const PLAINTEXT = { id: 'p1', title: 'Legacy row' };
  const ENCRYPTED = { id: 'p2', title: '', encryption_version: 1 };

  it('never labels a plaintext prayer encrypted — whatever the vault is doing', () => {
    // Same row, both vault states (the vault isn't even an input): still plaintext.
    expect(protectionOf(PLAINTEXT)).toBeNull();
    expect(protectionOf({ ...PLAINTEXT, _locked: false })).toBeNull();
  });

  it('labels an encrypted prayer encrypted in BOTH vault states', () => {
    expect(protectionOf(ENCRYPTED)).toEqual({ kind: 'encrypted', locked: false });
    // Locked device: same classification, plus the honest "can't open it here".
    expect(protectionOf({ ...ENCRYPTED, _locked: true })).toEqual({ kind: 'encrypted', locked: true });
  });

  it('lock state changes only readability, never the classification', () => {
    const open = protectionOf({ ...ENCRYPTED, _locked: false });
    const shut = protectionOf({ ...ENCRYPTED, _locked: true });
    expect(open.kind).toBe(shut.kind);
  });

  it('accepts any definitive per-prayer marker: version, payload, or the optimistic write flag', () => {
    expect(protectionOf({ encrypted_payload: 'v1.gcm.abc' })).toEqual({ kind: 'encrypted', locked: false });
    expect(protectionOf({ _encrypted: true })).toEqual({ kind: 'encrypted', locked: false });
    expect(protectionOf({ _encrypted: false })).toBeNull();
  });

  it('a saved-from-community copy is judged the same way — by its own row', () => {
    expect(protectionOf({ community_origin_id: 'c1' })).toBeNull();
    expect(protectionOf({ community_origin_id: 'c1', encryption_version: 1 })).toEqual({ kind: 'encrypted', locked: false });
  });

  it('has nothing to say about a prayer that does not exist yet', () => {
    expect(protectionOf(null)).toBeNull();
    expect(protectionOf(undefined)).toBeNull();
  });
});

describe('plannedProtection — creation intent, not a stored fact', () => {
  it('is a distinct kind from a confirmed encrypted row', () => {
    expect(plannedProtection(true)).toEqual({ kind: 'willEncrypt' });
    expect(plannedProtection(false)).toBeNull();
    expect(plannedProtection(true).kind).not.toBe(protectionOf({ encryption_version: 1 }).kind);
  });
});

describe('labels', () => {
  it('maps every audience kind to its localization key + vars', () => {
    expect(audienceLabel({ kind: 'private' })).toEqual({ key: 'audiencePrivate', vars: {} });
    expect(audienceLabel({ kind: 'group', groupName: 'Église' })).toEqual({ key: 'audienceSharedWith', vars: { name: 'Église' } });
    expect(audienceLabel({ kind: 'groups', count: 3 })).toEqual({ key: 'audienceSharedN', vars: { n: 3 } });
    expect(audienceLabel({ kind: 'fromGroup', groupName: 'Église' })).toEqual({ key: 'audienceFromGroup', vars: { name: 'Église' } });
  });

  it('maps protection to its own key — and to nothing when unprotected', () => {
    expect(protectionLabel({ kind: 'encrypted' })).toEqual({ key: 'protEncrypted', vars: {} });
    expect(protectionLabel(null)).toBeNull();
  });

  it('says "will be encrypted" for intent and marks an unreadable row as locked', () => {
    expect(protectionLabel({ kind: 'willEncrypt' })).toEqual({ key: 'protWillEncrypt', vars: {} });
    expect(protectionLabel({ kind: 'encrypted', locked: true })).toEqual({ key: 'protEncryptedLocked', vars: {} });
  });

  it('keeps audience and protection in separate namespaces — no key is ever both', () => {
    const audienceKeys = ['private', 'group', 'groups', 'fromGroup']
      .map((kind) => audienceLabel({ kind, groupName: 'G', count: 2 }).key);
    const protectionKeys = [
      protectionLabel({ kind: 'encrypted' }).key,
      protectionLabel({ kind: 'encrypted', locked: true }).key,
      protectionLabel({ kind: 'willEncrypt' }).key,
    ];
    expect(audienceKeys.some((k) => protectionKeys.includes(k))).toBe(false);
  });
});
