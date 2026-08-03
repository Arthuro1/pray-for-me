// Pure helpers for the community store — extracted so the data transforms can
// be unit-tested without mocking Supabase.

// Maps a Supabase error to the store's { error } shape.
export function toError(error) {
  return { error: error?.message };
}

// friendships enforces user_id < friend_id; order any pair to match that.
// UUIDs are lowercase hex, so JS string sort matches Postgres uuid ordering.
export function orderedPair(a, b) {
  return [a, b].sort();
}

// Anonymity must hold AT REST, not only in the UI: a community row flagged
// anonymous must never carry the author's real display name in its plaintext
// `author_name` column, or the Network response / Supabase table editor
// de-anonymizes exactly what the app renders as "Anonymous". Returns '' when
// anonymous, the name otherwise. (user_id necessarily stays — RLS ownership,
// "who's praying", moderation and blocking all key off it.)
export function publicAuthorName(isAnonymous, name) {
  return isAnonymous ? '' : (name || '');
}

// Immutably replaces one prayer in a list via the updater function.
export function updatePrayerInList(prayers, prayerId, updater) {
  return prayers.map((p) => (p.id === prayerId ? updater(p) : p));
}

// Counts, per group, the community prayers created after the group's last-seen
// time. Own posts (currentUserId) are excluded so the badge reflects others'
// new requests. seenMap: { [groupId]: ISO string }. rows: { group_id, created_at, user_id }.
export function unreadCounts(rows, seenMap = {}, currentUserId = null) {
  const counts = {};
  for (const r of rows || []) {
    if (currentUserId && r.user_id === currentUserId) continue;
    const seen = seenMap[r.group_id];
    if (!seen || new Date(r.created_at) > new Date(seen)) {
      counts[r.group_id] = (counts[r.group_id] || 0) + 1;
    }
  }
  return counts;
}

// Builds the share map { [sourcePrayerId]: [{ groupId, groupName, isAnonymous,
// prayingCount }] } from raw community_prayers rows joined with group + reactions.
export function buildSharesMap(rows) {
  const map = {};
  (rows || []).forEach((r) => {
    (map[r.source_prayer_id] ||= []).push({
      groupId: r.group_id,
      groupName: r.groups?.name || '?',
      isAnonymous: !!r.is_anonymous,
      prayingCount: r.prayer_reactions?.[0]?.count ?? 0,
    });
  });
  return map;
}
