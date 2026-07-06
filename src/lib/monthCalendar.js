// Pure helpers behind the MonthCalendar component. Kept out of the component file
// so it only exports a component (keeps Fast Refresh working) and so callers like
// PlanTab / DayAgenda can import these without pulling in React.
import { toKey } from './schedule';

// Dot colours by schedule kind. `dots` (see planner.monthDots) maps a day key to
// { once, recurring, plan, group } counts; `group` comes from community commitments.
export const DOT_COLORS = {
  recurring: 'var(--accent)',
  once: '#d97706',
  plan: '#94a3b8',
  group: '#0891b2',
};

// The date keys for every day in a given month (1..last), in order.
export function monthDayKeys(monthDate) {
  const y = monthDate.getFullYear();
  const m = monthDate.getMonth();
  const count = new Date(y, m + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => toKey(new Date(y, m, i + 1)));
}
