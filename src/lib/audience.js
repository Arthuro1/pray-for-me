// One consistent audience model: a compact, factual answer to "who can read
// this prayer?", shown wherever the prayer is displayed (form, saved
// confirmation, detail, share preview). Personal prayers default to Private —
// there is no code path that widens an audience without an explicit share.
//
// AUDIENCE (who can read it) and PROTECTION (how it is stored) are separate
// facts: encryption is never an audience. audienceOf answers the first,
// protectionOf the second, and the badge renders them as a primary label plus
// a smaller secondary status.
import { isUnlocked } from './crypto/keyManager';

// Describe a personal prayer's audience from what is actually stored:
//   fromGroup — a copy saved from a community prayer (follows the group's content)
//   group     — shared with exactly one group
//   groups    — shared with several groups
//   private   — stored for this account only
// `shares` is the prayerShares entry ([{ groupId, groupName }]) for this prayer.
export function audienceOf(prayer, shares = []) {
  if (prayer?.community_origin_id) {
    return { kind: 'fromGroup', groupName: prayer.origin_group_name || '' };
  }
  const list = shares || [];
  if (list.length === 1) return { kind: 'group', groupName: list[0].groupName };
  if (list.length > 1) return { kind: 'groups', count: list.length };
  return { kind: 'private' };
}

// The prayer's at-rest protection, independent of who may read it:
//   encrypted — the row carries ciphertext, or new writes will (key ready)
//   null      — legacy plaintext row on a device without the key
// `unlocked` is injectable for tests; defaults to the device's real key state.
export function protectionOf(prayer, { unlocked = isUnlocked() } = {}) {
  const encrypted = prayer?.encryption_version != null || (unlocked && !prayer?.community_origin_id);
  return encrypted ? { kind: 'encrypted' } : null;
}

// The localization key + vars for an audience — kept beside audienceOf so every
// surface renders the same wording for the same facts.
export function audienceLabel(audience) {
  switch (audience.kind) {
    case 'fromGroup':
      return { key: 'audienceFromGroup', vars: { name: audience.groupName } };
    case 'group':
      return { key: 'audienceSharedWith', vars: { name: audience.groupName } };
    case 'groups':
      return { key: 'audienceSharedN', vars: { n: audience.count } };
    default:
      return { key: 'audiencePrivate', vars: {} };
  }
}

// Localization key for the secondary protection status (null → render nothing).
export function protectionLabel(protection) {
  if (!protection) return null;
  return { key: 'protEncrypted', vars: {} };
}
