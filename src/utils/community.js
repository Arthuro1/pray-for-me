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

// Immutably replaces one prayer in a list via the updater function.
export function updatePrayerInList(prayers, prayerId, updater) {
  return prayers.map((p) => (p.id === prayerId ? updater(p) : p));
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
