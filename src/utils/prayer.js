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

// A personal source prayer can outlive the account key that encrypted one of
// its child rows (for example after recovery was reset on another device). When
// that prayer was shared, every community copy received the same point ids and
// a group-key-encrypted snapshot. Use a readable snapshot as a display-only
// fallback for locked points; never rewrite the personal ciphertext implicitly.
export function recoverLockedPrayerPoints(personalPoints = [], communityCopies = []) {
  const readableById = new Map();
  for (const copy of communityCopies || []) {
    if (copy?._locked) continue;
    for (const point of copy?.prayer_points || []) {
      if (point?.id && !readableById.has(point.id)) readableById.set(point.id, point);
    }
  }

  let changed = false;
  const recovered = (personalPoints || []).map((point) => {
    if (!point?._locked) return point;
    const fallback = readableById.get(point.id);
    if (!fallback) return point;
    changed = true;
    return {
      ...point,
      title: fallback.title || '',
      verses: fallback.verses || [],
      _locked: false,
      _communityFallback: true,
    };
  });
  return changed ? recovered : personalPoints;
}

const updateHasContent = (row) => !!(row?.text || (row?.attachments || []).length);
const normalizedAuthor = (row) => (row?.author_name || '').trim().toLocaleLowerCase();
const sameUpdateAuthor = (a, b) => {
  if (a?.user_id && b?.user_id) return a.user_id === b.user_id;
  const aName = normalizedAuthor(a);
  const bName = normalizedAuthor(b);
  if (aName && bName) return aName === bName && !!a.is_anonymous === !!b.is_anonymous;
  return !!a?.is_anonymous && !!b?.is_anonymous;
};
const sameUpdateMoment = (a, b) => {
  const aTime = Date.parse(a?.created_at || '');
  const bTime = Date.parse(b?.created_at || '');
  return Number.isFinite(aTime) && Number.isFinite(bTime) && Math.abs(aTime - bTime) <= 10_000;
};
const updateSignature = (row) => JSON.stringify([
  row?.text || '',
  normalizedAuthor(row),
  !!row?.is_anonymous,
  (row?.attachments || []).map((attachment) => attachment?.id || attachment?.path || '').sort(),
]);

// Merge a personal prayer's timeline with activity from its community copies.
// Readable personal rows win. A locked personal row may borrow the corresponding
// group text for display, and group-only activity is appended read-only. Semantic
// deduplication collapses the same pre-encryption mirror across several groups.
export function mergeSharedPrayerUpdates(personalUpdates = [], sharedUpdates = []) {
  const uniqueShared = [];
  const sharedSignatures = new Set();
  for (const row of sharedUpdates || []) {
    const signature = row?._locked ? `locked:${row.id}` : updateSignature(row);
    if (sharedSignatures.has(signature)) continue;
    sharedSignatures.add(signature);
    uniqueShared.push(row);
  }

  const personalSignatures = new Set(
    (personalUpdates || []).filter((row) => !row?._locked).map(updateSignature)
  );
  const available = uniqueShared.filter((row) => !personalSignatures.has(updateSignature(row)));
  const consumed = new Set();

  const personal = (personalUpdates || []).map((row) => {
    if (!row?._locked) return row;
    const matchIndex = available.findIndex((candidate, index) => (
      !consumed.has(index)
      && !candidate?._locked
      && updateHasContent(candidate)
      && sameUpdateAuthor(row, candidate)
      && (row.id === candidate.id || sameUpdateMoment(row, candidate))
    ));
    if (matchIndex < 0) return row;
    consumed.add(matchIndex);
    const match = available[matchIndex];
    return {
      ...row,
      text: match.text || '',
      attachments: match.attachments || [],
      content_language: match.content_language || row.content_language || null,
      _locked: false,
      _communityFallback: true,
    };
  });

  const groupOnly = available
    .filter((row, index) => !consumed.has(index))
    .map((row) => ({ ...row, _communityFallback: true }));
  return [...personal, ...groupOnly];
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
