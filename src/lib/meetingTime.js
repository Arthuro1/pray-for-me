// When a group's prayer meeting happens, for the person looking at it. A
// meeting keeps its own wall-clock time and IANA timezone (the scheduler's);
// each member sees the next time in their own zone. Pure, Intl only.
//
// Twin of supabase/functions/_shared/meetingTime.ts, which decides when the
// reminder goes out. A parity test (meetingTime.test.js) keeps the two in step,
// so the time a member reads and the time they are reminded never drift.
import { addDays, nextOccurrence } from './schedule';

export const DEFAULT_DURATION_MINUTES = 60;

function partsIn(instant, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant));
  const out = {};
  for (const p of parts) if (p.type !== 'literal') out[p.type] = Number(p.value);
  return out;
}

// The zone's offset from UTC at `instant`, in milliseconds.
function zoneOffset(instant, timeZone) {
  const p = partsIn(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

// The instant a wall-clock time happens on a day in `timeZone`. Near a
// daylight-saving change the offset in force at that moment decides.
export function zonedInstant(dayKey, hhmm, timeZone) {
  const [y, m, d] = dayKey.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, h, mi);
  const guess = wall - zoneOffset(wall, timeZone);
  return new Date(wall - zoneOffset(guess, timeZone));
}

// The calendar day of `instant` in `timeZone`, as a day key.
export function dayKeyIn(instant, timeZone) {
  const p = partsIn(instant.getTime(), timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return !!timeZone;
  } catch {
    return false;
  }
}

export function deviceTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

// The meeting that is on now or comes next: { key, start, end, live }, or null
// once a one-off meeting is over. `key` is the day in the meeting's own zone.
export function nextMeeting(meeting, now = new Date()) {
  const { schedule, start_time: startTime, timezone, duration_minutes: duration = DEFAULT_DURATION_MINUTES } = meeting || {};
  if (!schedule || !startTime || !isValidTimeZone(timezone)) return null;
  let from = addDays(dayKeyIn(now, timezone), -1);
  for (let guard = 0; guard < 8; guard++) {
    const key = nextOccurrence(schedule, from);
    if (!key) return null;
    const start = zonedInstant(key, startTime.slice(0, 5), timezone);
    const end = new Date(start.getTime() + duration * 60_000);
    if (end > now) return { key, start, end, live: start <= now };
    from = addDays(key, 1);
  }
  return null;
}
