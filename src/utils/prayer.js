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
