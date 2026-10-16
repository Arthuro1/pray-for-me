// When a group's prayer meeting starts, as a real instant, from its local
// wall-clock time and IANA timezone. Pure and dependency-free (Intl only), so
// both send-event-notifications and Vitest import it — the same pattern as
// eventNotify.ts. The client twin is src/lib/meetingTime.js; a parity test
// (src/lib/meetingTime.test.js) keeps the two in step. Change both together.
import { addDays, occursOn, type Schedule } from './schedule.ts';

// How long before a meeting its reminder is queued. The event cron runs every
// five minutes, so a reminder lands between ten and fifteen minutes ahead.
export const REMINDER_LEAD_MINUTES = 15;

export interface MeetingTiming {
  id: string;
  schedule: Schedule;
  start_time: string; // 'HH:MM' or 'HH:MM:SS' (Postgres time)
  timezone: string;
}

function partsIn(instant: number, timeZone: string): Record<string, number> {
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
  const out: Record<string, number> = {};
  for (const p of parts) if (p.type !== 'literal') out[p.type] = Number(p.value);
  return out;
}

// The zone's offset from UTC at `instant`, in milliseconds.
function zoneOffset(instant: number, timeZone: string): number {
  const p = partsIn(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

// The instant a wall-clock time happens on a day in `timeZone`. Near a
// daylight-saving change the offset in force at that moment decides.
export function zonedInstant(dayKey: string, hhmm: string, timeZone: string): Date {
  const [y, m, d] = dayKey.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, h, mi);
  const guess = wall - zoneOffset(wall, timeZone);
  return new Date(wall - zoneOffset(guess, timeZone));
}

// The calendar day of `instant` in `timeZone`, as a day key.
export function dayKeyIn(instant: Date, timeZone: string): string {
  const p = partsIn(instant.getTime(), timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

// The occurrences of a meeting that start within the next `leadMinutes`, as
// { key, startsAt }. Yesterday to tomorrow in the meeting's own zone covers a
// window that crosses midnight there.
export function remindersDue(
  meeting: MeetingTiming,
  now: Date,
  leadMinutes = REMINDER_LEAD_MINUTES,
): { key: string; startsAt: Date }[] {
  const today = dayKeyIn(now, meeting.timezone);
  const due: { key: string; startsAt: Date }[] = [];
  for (const key of [addDays(today, -1), today, addDays(today, 1)]) {
    if (!occursOn(meeting.schedule, key)) continue;
    const startsAt = zonedInstant(key, meeting.start_time.slice(0, 5), meeting.timezone);
    const ahead = startsAt.getTime() - now.getTime();
    if (ahead > 0 && ahead <= leadMinutes * 60_000) due.push({ key, startsAt });
  }
  return due;
}
