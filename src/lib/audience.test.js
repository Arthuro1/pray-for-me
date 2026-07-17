// One consistent audience model: the same facts always produce the same label,
// and a personal prayer with no shares is Private (encrypted when the key is
// ready) — there is no default that widens an audience.
import { describe, it, expect } from 'vitest';
import { audienceOf, audienceLabel } from './audience';

describe('audienceOf', () => {
  it('defaults a personal prayer to Private (vault form when the key is ready)', () => {
    expect(audienceOf({}, [], { unlocked: false })).toEqual({ kind: 'private' });
    expect(audienceOf({}, [], { unlocked: true })).toEqual({ kind: 'vault' });
  });

  it('treats a row already carrying ciphertext as vault even when locked right now', () => {
    expect(audienceOf({ encryption_version: 1 }, [], { unlocked: false }).kind).toBe('vault');
  });

  it('names the single group a prayer is shared with', () => {
    const a = audienceOf({}, [{ groupId: 'g1', groupName: 'Église' }], { unlocked: true });
    expect(a).toEqual({ kind: 'group', groupName: 'Église' });
  });

  it('counts multiple groups', () => {
    const shares = [{ groupId: 'g1', groupName: 'A' }, { groupId: 'g2', groupName: 'B' }];
    expect(audienceOf({}, shares, { unlocked: true })).toEqual({ kind: 'groups', count: 2 });
  });

  it('marks a saved-from-community copy as coming from its group', () => {
    const a = audienceOf({ community_origin_id: 'c1', origin_group_name: 'Église' }, [], { unlocked: true });
    expect(a).toEqual({ kind: 'fromGroup', groupName: 'Église' });
  });
});

describe('audienceLabel', () => {
  it('maps every kind to its localization key + vars', () => {
    expect(audienceLabel({ kind: 'private' })).toEqual({ key: 'audiencePrivate', vars: {} });
    expect(audienceLabel({ kind: 'vault' })).toEqual({ key: 'audienceVault', vars: {} });
    expect(audienceLabel({ kind: 'group', groupName: 'Église' })).toEqual({ key: 'audienceSharedWith', vars: { name: 'Église' } });
    expect(audienceLabel({ kind: 'groups', count: 3 })).toEqual({ key: 'audienceSharedN', vars: { n: 3 } });
    expect(audienceLabel({ kind: 'fromGroup', groupName: 'Église' })).toEqual({ key: 'audienceFromGroup', vars: { name: 'Église' } });
  });
});
