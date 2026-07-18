// One consistent audience model: a compact, factual answer to "who can read
// this prayer?", shown wherever the prayer is displayed (form, saved
// confirmation, detail, share preview). Personal prayers default to Private —
// there is no code path that widens an audience without an explicit share.
//
// AUDIENCE (who can read it) and PROTECTION (how it is stored) are separate
// facts: encryption is never an audience. audienceOf answers the first,
// protectionOf the second, and the badge renders them as a primary label plus
// a smaller secondary status.

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

// The prayer's OWN at-rest protection, read from that prayer's stored data and
// nothing else:
//   encrypted — this row carries ciphertext (encryption_version /
//               encrypted_payload), or was just written encrypted (the
//               optimistic `_encrypted` marker the store stamps at write time)
//   null      — this row is plaintext
//
// Deliberately NOT a function of the vault: unlocking lets encrypted content be
// READ, it does not retroactively encrypt a legacy plaintext row, so vault state
// can never change a prayer's classification. `locked` rides along for the
// surfaces that usefully say "encrypted — and not readable on this device".
export function protectionOf(prayer) {
  if (!prayer) return null;
  const encrypted = prayer.encryption_version != null
    || !!prayer.encrypted_payload
    || prayer._encrypted === true;
  if (!encrypted) return null;
  return { kind: 'encrypted', locked: prayer._locked === true };
}

// The protection a prayer WILL get when it is saved — a creation DECISION, not
// a claim about a stored row. Used by the form before anything exists; the
// saved confirmation switches to protectionOf on the real created prayer.
export function plannedProtection(willEncrypt) {
  return willEncrypt ? { kind: 'willEncrypt' } : null;
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
// "Will be encrypted" (intent) reads differently from "Encrypted" (fact), and a
// row that can't be opened on this device says so rather than implying it can.
export function protectionLabel(protection) {
  if (!protection) return null;
  if (protection.kind === 'willEncrypt') return { key: 'protWillEncrypt', vars: {} };
  return { key: protection.locked ? 'protEncryptedLocked' : 'protEncrypted', vars: {} };
}
