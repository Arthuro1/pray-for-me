// Server port of the recurrence engine (src/lib/schedule.js). Kept as a faithful
// subset — only what the reminder scheduler needs to decide "does this prayer
// occur on this local day" — so server notification counts match exactly what
// the app shows. All dates are LOCAL day keys ("YYYY-MM-DD"). If you change the
// engine here, change src/lib/schedule.js too (and vice versa).

export interface Schedule {
  type: 'once' | 'recurring';
  date?: string;
  slot?: string;
  freq?: 'daily' | 'weekly' | 'interval' | 'monthly' | 'yearly';
  weekDays?: number[];
  interval?: number;
  dayOfMonth?: number;
  month?: number;
  day?: number;
  startDate?: string;
  end?: { kind: 'never' | 'date' | 'count' | 'answered'; date?: string; count?: number };
  plan?: { id: string; startDate: string };
}

export type Overrides = Record<string, { skip?: boolean; movedTo?: string } | undefined>;

const pad = (n: number) => String(n).padStart(2, '0');

// 'YYYY-MM-DD' → local Date at midnight. Manual parse — new Date('YYYY-MM-DD')
// would parse as UTC and shift the day in western timezones.
export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d);
}

export function toKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

// Whole days from a to b (positive when b is after a). DST-safe via rounding.
export function diffDays(a: string, b: string): number {
  return Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 86400000);
}

function daysInMonth(year: number, month1: number): number {
  return new Date(year, month1, 0).getDate();
}

// Does the base pattern (ignoring overrides and end conditions) hit this day?
function matchesPattern(s: Schedule, key: string): boolean {
  if (s.type === 'once') return s.date === key;
  if (!s.startDate || key < s.startDate) return false;
  const d = parseKey(key);
  switch (s.freq) {
    case 'daily':
      return true;
    case 'weekly':
      return (s.weekDays || []).includes(d.getDay());
    case 'interval': {
      const n = Math.max(2, s.interval || 2);
      return diffDays(s.startDate, key) % n === 0;
    }
    case 'monthly': {
      const dim = daysInMonth(d.getFullYear(), d.getMonth() + 1);
      const target = Math.min(s.dayOfMonth || 1, dim);
      return d.getDate() === target;
    }
    case 'yearly': {
      if (d.getMonth() + 1 !== (s.month || 1)) return false;
      const dim = daysInMonth(d.getFullYear(), s.month || 1);
      return d.getDate() === Math.min(s.day || 1, dim);
    }
    default:
      return false;
  }
}

// How many base occurrences fall in [startDate, key], for `count` ends.
function occurrenceIndex(s: Schedule, key: string): number {
  let count = 0;
  let cursor = s.startDate!;
  let guard = 0;
  while (cursor <= key && guard < 1000) {
    if (matchesPattern(s, cursor)) count++;
    cursor = addDays(cursor, 1);
    guard++;
  }
  return count;
}

function withinEnd(s: Schedule, key: string): boolean {
  if (s.type === 'once') return true;
  const end = s.end || { kind: 'never' };
  if (end.kind === 'date') return !end.date || key <= end.date;
  if (end.kind === 'count') return occurrenceIndex(s, key) <= (end.count || 1);
  return true; // never / answered
}

// Does this schedule land on `key`, honouring end conditions and overrides?
export function occursOn(s: Schedule | null | undefined, key: string, overrides: Overrides = {}): boolean {
  if (!s) return false;
  const ov = overrides[key];
  if (ov && (ov.skip || ov.movedTo)) return false; // skipped or moved away
  for (const [from, o] of Object.entries(overrides)) {
    if (o && o.movedTo === key && matchesPattern(s, from) && withinEnd(s, from)) return true;
  }
  return matchesPattern(s, key) && withinEnd(s, key);
}

// Deterministic round-robin over a category's ordered active prayers (mirrors
// the client so a rotation day shows the same group everywhere).
export function rotationForDay(orderedIds: string[], perDay: number, key: string): string[] {
  const n = orderedIds.length;
  const per = Math.max(1, perDay || 1);
  if (n <= per) return orderedIds;
  const groups = Math.ceil(n / per);
  const serial = Math.floor(parseKey(key).getTime() / 86400000);
  const idx = ((serial % groups) + groups) % groups;
  return orderedIds.slice(idx * per, idx * per + per);
}
