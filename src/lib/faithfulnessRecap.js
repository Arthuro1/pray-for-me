import { testimonyList } from '../utils/prayer';

const validDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const monthKey = (date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
);

// Builds private, in-memory monthly reflections from already-decrypted prayers.
// Nothing is persisted or sent anywhere. A synced community copy may not have
// answered_at, so updated_at is the same conservative fallback used by the
// answered gallery to place it in the remembrance timeline.
export function faithfulnessMonths(prayers = []) {
  const byMonth = new Map();

  for (const prayer of prayers) {
    if (prayer.status !== 'answered') continue;
    const answeredDate = validDate(prayer.answered_at || prayer.updated_at);
    if (!answeredDate) continue;
    const key = monthKey(answeredDate);
    if (!byMonth.has(key)) {
      byMonth.set(key, {
        key,
        date: new Date(answeredDate.getFullYear(), answeredDate.getMonth(), 1),
        prayers: [],
      });
    }
    byMonth.get(key).prayers.push({
      prayer,
      answeredDate,
      testimonies: testimonyList(prayer).filter((item) => item.content?.trim()),
    });
  }

  return [...byMonth.values()]
    .map((month) => ({
      ...month,
      prayers: month.prayers.sort((a, b) => b.answeredDate - a.answeredDate),
    }))
    .sort((a, b) => b.date - a.date);
}

export const prayerSelectionId = (prayerId) => `prayer:${prayerId}`;
export const testimonySelectionId = (prayerId, testimonyId, index) => (
  `testimony:${prayerId}:${testimonyId || index}`
);

// Produces the exact plain-text preview that can later be shared. Only IDs the
// user explicitly selected are included; passing an empty selection therefore
// returns an empty string and can never expose private prayer content.
export function faithfulnessShareText({
  month,
  selectedIds,
  heading,
  translate = (text) => text,
}) {
  const selected = selectedIds instanceof Set ? selectedIds : new Set(selectedIds || []);
  if (!month || selected.size === 0) return '';

  const lines = [];
  for (const { prayer, testimonies } of month.prayers) {
    const title = translate(prayer.title || '');
    if (selected.has(prayerSelectionId(prayer.id))) lines.push(`• ${title}`);
    testimonies.forEach((testimony, index) => {
      if (!selected.has(testimonySelectionId(prayer.id, testimony.id, index))) return;
      lines.push(`“${translate(testimony.content)}” — ${title}`);
    });
  }

  return lines.length > 0 ? `${heading}\n\n${lines.join('\n')}` : '';
}
