import { describe, expect, it } from 'vitest';
import { dayKeyIn, nextMeeting, zonedInstant } from './meetingTime';
// The server twin that decides when reminders go out.
import {
  dayKeyIn as serverDayKeyIn,
  remindersDue,
  zonedInstant as serverZonedInstant,
} from '../../supabase/functions/_shared/meetingTime.ts';

const weeklyTuesday = {
  id: 'm1',
  schedule: { type: 'recurring', freq: 'weekly', weekDays: [2], startDate: '2026-10-01' },
  start_time: '20:00:00',
  timezone: 'Europe/Paris',
  duration_minutes: 60,
};

describe('meeting time', () => {
  it('turns a wall-clock time in a zone into the right instant, across daylight saving', () => {
    // Paris is UTC+2 in summer time, UTC+1 after 25 October 2026.
    expect(zonedInstant('2026-10-20', '20:00', 'Europe/Paris').toISOString()).toBe('2026-10-20T18:00:00.000Z');
    expect(zonedInstant('2026-10-27', '20:00', 'Europe/Paris').toISOString()).toBe('2026-10-27T19:00:00.000Z');
    expect(zonedInstant('2026-10-20', '09:30', 'America/New_York').toISOString()).toBe('2026-10-20T13:30:00.000Z');
    expect(zonedInstant('2026-10-20', '06:00', 'Asia/Tokyo').toISOString()).toBe('2026-10-19T21:00:00.000Z');
  });

  it('reads the calendar day in the meeting\'s own zone', () => {
    const lateUtc = new Date('2026-10-20T23:30:00Z');
    expect(dayKeyIn(lateUtc, 'Europe/Paris')).toBe('2026-10-21');
    expect(dayKeyIn(lateUtc, 'America/Los_Angeles')).toBe('2026-10-20');
  });

  it('agrees with the server twin', () => {
    const cases = [
      ['2026-03-29', '02:30', 'Europe/Paris'],
      ['2026-10-25', '02:30', 'Europe/Paris'],
      ['2026-11-01', '18:45', 'America/Sao_Paulo'],
      ['2026-06-15', '05:00', 'Africa/Nairobi'],
      ['2026-12-31', '23:59', 'Pacific/Auckland'],
    ];
    for (const [key, time, zone] of cases) {
      expect(zonedInstant(key, time, zone).getTime()).toBe(serverZonedInstant(key, time, zone).getTime());
    }
    const instant = new Date('2026-10-20T22:15:00Z');
    for (const zone of ['Europe/Paris', 'Asia/Kolkata', 'America/Chicago']) {
      expect(dayKeyIn(instant, zone)).toBe(serverDayKeyIn(instant, zone));
    }
  });

  it('shows the next meeting, and the current one while it is on', () => {
    const monday = new Date('2026-10-19T12:00:00Z');
    const next = nextMeeting(weeklyTuesday, monday);
    expect(next.key).toBe('2026-10-20');
    expect(next.start.toISOString()).toBe('2026-10-20T18:00:00.000Z');
    expect(next.live).toBe(false);

    const during = nextMeeting(weeklyTuesday, new Date('2026-10-20T18:30:00Z'));
    expect(during.key).toBe('2026-10-20');
    expect(during.live).toBe(true);

    const after = nextMeeting(weeklyTuesday, new Date('2026-10-20T19:05:00Z'));
    expect(after.key).toBe('2026-10-27');
  });

  it('has nothing next once a one-off meeting is over', () => {
    const once = { ...weeklyTuesday, schedule: { type: 'once', date: '2026-10-20' } };
    expect(nextMeeting(once, new Date('2026-10-21T08:00:00Z'))).toBeNull();
  });

  it('queues the reminder only in the quarter hour before the meeting', () => {
    const due = (iso) => remindersDue(weeklyTuesday, new Date(iso)).map(({ key }) => key);
    expect(due('2026-10-20T17:40:00Z')).toEqual([]); // 20 minutes ahead
    expect(due('2026-10-20T17:46:00Z')).toEqual(['2026-10-20']); // 14 minutes ahead
    expect(due('2026-10-20T18:00:00Z')).toEqual([]); // already begun
    expect(due('2026-10-21T17:50:00Z')).toEqual([]); // not a meeting day
  });

  it('reminds across midnight in the meeting\'s zone', () => {
    const midnight = { ...weeklyTuesday, start_time: '00:05', timezone: 'Asia/Tokyo' };
    // 23:55 Monday in Tokyo is 14:55 UTC; the Tuesday 00:05 meeting is ten minutes away.
    expect(remindersDue(midnight, new Date('2026-10-19T14:55:00Z')).map(({ key }) => key)).toEqual(['2026-10-20']);
  });
});
