// The intercession queue: the shared requests a user has EXPLICITLY taken on —
// never "everything from every group". A prayer enters the queue only through a
// deliberate act that already exists in the data model:
//   · a personal prayer marked as being for another person (for_other)
//   · a community request the user chose to carry (saved copy —
//     community_origin_id — created by "I'm praying" / "Add to my prayer list")
// Completion stays the ordinary per-prayer completion record (markPrayedOn), so
// the queue, Today and the calendar can never disagree about what was prayed.
import { prayersForDay } from './planner';

// Active personal prayers that belong in the queue. Locked rows (undecryptable
// on this device) are excluded — a session can't display them.
export function intercessionQueue(prayers) {
  return (prayers || []).filter(
    (p) => p.status === 'active' && !p._locked && (p.community_origin_id || p.for_other)
  );
}

// The DEFAULT queue: only the carried requests that are DUE on `dayKey`, so a
// high-volume intercessor faces today's commitments, not every request they've
// ever taken on. Due-ness rides the ordinary planner (prayersForDay) — the same
// engine Today and the calendar use — so there is no second scheduling model:
//   · a prayer with its own schedule is due only when that schedule says so
//   · legacy unscheduled prayers keep their existing fallback (daily)
//   · a prayer-chain commitment claimed for `dayKey` makes its saved copy due
//     that day, even when the copy's own schedule wouldn't ask for it
// `commitments` is communityStore's myCommitments ([{ community_prayer_id, day }]).
export function dueIntercessionQueue(prayers, categories, dayKey, commitments = []) {
  const carried = intercessionQueue(prayers);
  if (carried.length === 0) return [];
  const dueIds = new Set(prayersForDay(prayers, categories || [], dayKey).map((e) => e.prayer.id));
  const claimedOrigins = new Set(
    (commitments || []).filter((c) => c.day === dayKey).map((c) => c.community_prayer_id)
  );
  return carried.filter(
    (p) => dueIds.has(p.id) || (p.community_origin_id && claimedOrigins.has(p.community_origin_id))
  );
}

// Which sources feed the queue — used to show filters ONLY when there is more
// than one kind of source to filter between.
export function queueSources(queue) {
  const personal = queue.some((p) => !p.community_origin_id);
  const groups = queue.some((p) => !!p.community_origin_id);
  return { personal, groups, count: (personal ? 1 : 0) + (groups ? 1 : 0) };
}

// 'all' | 'personal' | 'groups' — filtering never touches completion data.
export function filterQueue(queue, filter) {
  if (filter === 'personal') return queue.filter((p) => !p.community_origin_id);
  if (filter === 'groups') return queue.filter((p) => !!p.community_origin_id);
  return queue;
}

// What is still unprayed on `dayKey` — resuming a left-midway session starts
// here, so the first unfinished request always comes first and finished ones
// are never repeated. `completions` is the store's { prayerId: [dayKey] } map.
export function remainingInQueue(queue, completions = {}, dayKey) {
  return queue.filter((p) => !(completions[p.id] || []).includes(dayKey));
}
