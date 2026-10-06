// Pure helpers behind the MonthCalendar component. Kept out of the component file
// so it only exports a component (keeps Fast Refresh working) and so callers like
// PlanTab / DayAgenda can import these without pulling in React.
import { toKey } from './schedule';

// The kinds of day marks, in the order they are drawn. `dots` (see
// planner.monthDots) maps a day key to { once, recurring, plan, group } counts;
// `group` comes from community commitments. Each kind is styled by
// `.cal-dot--<kind>` (utility.css): told apart by shape as well as colour.
export const DOT_KINDS = ['recurring', 'once', 'plan', 'group'];

// The mark for a planner entry's source: a weekly "days" or category rhythm
// reads as part of a plan.
export const dotKind = (source) => (source === 'days' || source === 'category' ? 'plan' : source);

// The date keys for every day in a given month (1..last), in order.
export function monthDayKeys(monthDate) {
  const y = monthDate.getFullYear();
  const m = monthDate.getMonth();
  const count = new Date(y, m + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => toKey(new Date(y, m, i + 1)));
}
