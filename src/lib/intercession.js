// The intercession queue: the shared requests a user has EXPLICITLY taken on —
// never "everything from every group". A prayer enters the queue only through a
// deliberate act that already exists in the data model:
//   · a personal prayer marked as being for another person (for_other)
//   · a community request the user chose to carry (saved copy —
//     community_origin_id — created by "I'm praying" / "Add to my prayer list")
// Completion stays the ordinary per-prayer completion record (markPrayedOn), so
// the queue, Today and the calendar can never disagree about what was prayed.

// Active personal prayers that belong in the queue. Locked rows (undecryptable
// on this device) are excluded — a session can't display them.
export function intercessionQueue(prayers) {
  return (prayers || []).filter(
    (p) => p.status === 'active' && !p._locked && (p.community_origin_id || p.for_other)
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
