// One consistent audience model: a compact, factual answer to "who can read
// this prayer?", shown wherever the prayer is displayed (form, saved
// confirmation, detail, share preview). Personal prayers default to Private —
// there is no code path that widens an audience without an explicit share.
import { isUnlocked } from './crypto/keyManager';

// Describe a personal prayer's audience from what is actually stored:
//   fromGroup — a copy saved from a community prayer (follows the group's content)
//   group     — shared with exactly one group
//   groups    — shared with several groups
//   vault     — private AND encrypted at rest (account key ready, or the row
//               already carries ciphertext)
//   private   — private, stored for this account only (legacy plaintext rows)
// `shares` is the prayerShares entry ([{ groupId, groupName }]) for this prayer.
// `unlocked` is injectable for tests; defaults to the device's real key state.
export function audienceOf(prayer, shares = [], { unlocked = isUnlocked() } = {}) {
  if (prayer?.community_origin_id) {
    return { kind: 'fromGroup', groupName: prayer.origin_group_name || '' };
  }
  const list = shares || [];
  if (list.length === 1) return { kind: 'group', groupName: list[0].groupName };
  if (list.length > 1) return { kind: 'groups', count: list.length };
  const encrypted = prayer?.encryption_version != null || unlocked;
  return { kind: encrypted ? 'vault' : 'private' };
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
    case 'vault':
      return { key: 'audienceVault', vars: {} };
    default:
      return { key: 'audiencePrivate', vars: {} };
  }
}
