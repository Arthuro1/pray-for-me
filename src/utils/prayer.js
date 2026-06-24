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

// Appends a new testimony to the existing list (preserving prior ones), skipping
// blank input. Pure — the caller persists the result. newId/now are injectable
// for deterministic tests.
export function appendTestimony(existing, content, newId = crypto.randomUUID(), now = new Date().toISOString()) {
  const list = [...(existing || [])];
  if (content && content.trim()) {
    list.push({ id: newId, content: content.trim(), created_at: now });
  }
  return list;
}

// Builds the personal-prayer insert payload when saving a community prayer.
// Categories are intentionally omitted — they belong to the original author.
export function communityToPersonalInsert(communityPrayer, groupName, userId) {
  return {
    user_id: userId,
    title: communityPrayer.title,
    description: communityPrayer.description || '',
    status: 'active',
    community_origin_id: communityPrayer.id,
    origin_author_name: communityPrayer.is_anonymous ? null : communityPrayer.author_name,
    origin_is_anonymous: !!communityPrayer.is_anonymous,
    origin_group_name: groupName,
  };
}

// Sorts categories to match an explicit ordered list of ids (unknown ids last).
export function sortByOrder(categories, orderedIds) {
  return [...categories].sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
}
