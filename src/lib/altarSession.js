// "Pray through my altar": the prayer session's optional order, which walks
// today's prayers circle by circle — My heart, My house, My people, His Church,
// Authorities, Nations, Kingdom & Mission — then whatever is not in a circle.
// It is an order for one time of prayer, never a score: no circle is "done",
// and nothing here is ever saved to a prayer.
import { circleOf, groupByCircle, planCircles } from './circles';
import { planById } from './guidedPlan';

// The circle a prayer is prayed in on this walk: the one the person placed it
// in, else — for a guided plan run — its plan's primary circle. The plan's
// circle is shown, never stored: a circle is only ever placed by the person.
export function sessionCircle(prayer) {
  return circleOf(prayer) ?? planCircles(planById(prayer?.schedule?.plan?.id)).primary;
}

// Worth offering only when there is more than one prayer and at least one of
// them belongs to a circle; otherwise the order would change nothing.
export function canPrayThroughAltar(prayers) {
  return (prayers?.length || 0) > 1 && prayers.some((prayer) => sessionCircle(prayer));
}

// The prayers in altar order — each circle's prayers in the order they were
// given, inner to outer, unplaced ones last — and where each circle's group
// begins (`starts`: index → circle, `null` for the unplaced group), so the walk
// can mark the threshold into a new circle.
export function altarOrder(prayers) {
  const prayersInOrder = [];
  const starts = new Map();
  for (const { circle, prayers: group } of groupByCircle(prayers, sessionCircle)) {
    starts.set(prayersInOrder.length, circle);
    prayersInOrder.push(...group);
  }
  return { prayers: prayersInOrder, starts };
}
