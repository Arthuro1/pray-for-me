// One consistent audience model: the same facts always produce the same label,
// and a personal prayer with no shares is Private — there is no default that
// widens an audience. AUDIENCE (who can read it) and PROTECTION (encrypted at
// rest) are SEPARATE facts: encryption is never presented as an audience.
import { describe, it, expect } from 'vitest';
import { audienceOf, audienceLabel, protectionOf, protectionLabel } from './audience';

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

describe('protectionOf — the separate at-rest status', () => {
  it('reports encrypted when the row carries ciphertext, even while locked', () => {
    expect(protectionOf({ encryption_version: 1 }, { unlocked: false })).toEqual({ kind: 'encrypted' });
  });

  it('reports encrypted for an own prayer when the device key is ready', () => {
    expect(protectionOf({}, { unlocked: true })).toEqual({ kind: 'encrypted' });
  });

  it('reports nothing for a legacy plaintext row on a keyless device', () => {
    expect(protectionOf({}, { unlocked: false })).toBeNull();
  });

  it('a saved-from-community copy without ciphertext is not claimed encrypted by the account key', () => {
    expect(protectionOf({ community_origin_id: 'c1' }, { unlocked: true })).toBeNull();
    expect(protectionOf({ community_origin_id: 'c1', encryption_version: 1 }, { unlocked: true })).toEqual({ kind: 'encrypted' });
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
});
