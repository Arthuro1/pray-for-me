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

// Returns a personal prayer's testimonies as a chronologically-ordered array of
// { id, content, created_at }. Merges the current `prayer_testimonies` child rows
// (Phase 3c) with the legacy `prayers.testimonies` jsonb array, deduped by id so a
// backfilled row and its jsonb twin collapse into one. Falls back to the legacy
// single `testimony` scalar only when neither source has any entries.
export function testimonyList(prayer) {
  const rows = prayer?.prayer_testimonies || [];
  const legacy = prayer?.testimonies || [];
  const merged = [...rows];
  const seen = new Set(merged.map((t) => t.id).filter(Boolean));
  for (const t of legacy) {
    if (t.id && seen.has(t.id)) continue;
    if (t.id) seen.add(t.id);
    merged.push(t);
  }
  if (merged.length === 0 && prayer?.testimony) {
    merged.push({ id: 'legacy', content: prayer.testimony, created_at: prayer.answered_at || prayer.updated_at });
  }
  return merged.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
}

// The fields a saved-from-community copy `p` inherits from its linked community
// prayer `c` on refresh. Shared content (title, description, prayer points)
// follows the author/group; the answered STATE follows the group request too, so
// an answered request drops off the personal active list and a reopened one
// returns — no matter who toggled it. Personal fields (scheduling, categories,
// testimonies, completions, pin) are deliberately left out and so untouched.
// community_prayers has no answer timestamp, so a synced copy keeps whatever
// answered_at it already had (null for a pure follower — the gallery falls back
// to updated_at and hides the date chip).
export function mirrorSavedCopy(p, c) {
  // Encrypted community rows are fetched with redacted plaintext columns. If
  // the group key is not available yet, decryptCommunityRow marks the row as
  // locked and leaves those empty columns in place. Never mirror that transient
  // representation into the personal copy: doing so would hide a perfectly
  // readable saved snapshot until the key becomes available again.
  if (!c || c._locked) return {};
  const answered = !!c.is_answered;
  return {
    title: c.title ?? p.title,
    description: c.description ?? p.description,
    prayer_points: (c.prayer_points || []).map((pp) => ({ id: pp.id, title: pp.title, verses: pp.verses || [] })),
    status: answered ? 'answered' : 'active',
    answered_at: answered ? (p.answered_at || null) : null,
  };
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
    // The AUTHOR's source language rides along with the saved copy — the copy
    // keeps the original wording, so it keeps the original language too.
    content_language: communityPrayer.content_language || null,
  };
}

// Sorts categories to match an explicit ordered list of ids (unknown ids last).
export function sortByOrder(categories, orderedIds) {
  return [...categories].sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
}
