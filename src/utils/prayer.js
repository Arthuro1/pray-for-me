// Whether an active prayer is scheduled for a given weekday (0-6). A per-prayer
// week_days override wins; otherwise it follows its categories (uncategorized =
// every day). dayCatIds = ids of categories assigned to that weekday.
export function prayerOnDay(prayer, dayIdx, dayCatIds) {
  if (prayer.status !== 'active') return false;
  if (prayer.week_days?.length) return prayer.week_days.includes(dayIdx);
  const catIds = (prayer.prayer_categories || []).map((pc) => pc.category_id);
  if (catIds.length === 0) return true;
  return catIds.some((cid) => dayCatIds.includes(cid));
}

// A prayer's display priority = the position of its highest-priority category
// (orderById maps category id → its index in the user's ordered category list).
// Uncategorized prayers sort last. Use as a comparator key (lower = first).
export function prayerPriority(prayer, orderById) {
  const ids = (prayer.prayer_categories || []).map((pc) => pc.category_id);
  if (ids.length === 0) return Infinity;
  return Math.min(...ids.map((id) => orderById[id] ?? Infinity));
}

// Returns a personal prayer's testimonies as an array of { id, content, created_at },
// falling back to the legacy single `testimony` field for prayers answered before
// testimonies became a list.
export function testimonyList(prayer) {
  if (prayer?.testimonies?.length) return prayer.testimonies;
  if (prayer?.testimony) {
    return [{ id: 'legacy', content: prayer.testimony, created_at: prayer.answered_at || prayer.updated_at }];
  }
  return [];
}
