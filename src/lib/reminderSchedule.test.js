import { describe, expect, it } from 'vitest';
import {
  dailyReminderDue,
  localReminderClock,
} from '../../supabase/functions/_shared/reminderSchedule.ts';

describe('daily reminder scheduling', () => {
  it('becomes due at the requested minute and stays retryable afterwards', () => {
    const sub = { timezone: 'Europe/Berlin', reminder_time: '22:40' };
    expect(dailyReminderDue(sub, new Date('2026-08-31T20:39:00Z')).due).toBe(false);
    expect(dailyReminderDue(sub, new Date('2026-08-31T20:40:00Z'))).toEqual({
      due: true,
      dayKey: '2026-08-31',
    });
    expect(dailyReminderDue(sub, new Date('2026-08-31T21:15:00Z')).due).toBe(true);
  });

  it('never sends twice on the same local calendar day', () => {
    const sub = {
      timezone: 'Africa/Douala',
      reminder_time: '07:00',
      last_daily_sent_on: '2026-09-01',
    };
    expect(dailyReminderDue(sub, new Date('2026-09-01T12:00:00Z')).due).toBe(false);
    expect(dailyReminderDue(sub, new Date('2026-09-02T06:00:00Z')).due).toBe(true);
  });

  it('uses the IANA timezone instead of a stale fixed offset across DST', () => {
    const clock = localReminderClock(new Date('2026-10-26T06:30:00Z'), {
      timezone: 'Europe/Berlin',
      tz_offset: 120, // stale summer offset; Berlin is UTC+1 on this date
    });
    expect(clock).toEqual({ dayKey: '2026-10-26', minutes: 7 * 60 + 30 });
  });

  it('falls back to the saved offset for legacy or invalid timezones', () => {
    const clock = localReminderClock(new Date('2026-09-01T22:30:00Z'), {
      timezone: 'Not/AZone',
      tz_offset: 120,
    });
    expect(clock).toEqual({ dayKey: '2026-09-02', minutes: 30 });
  });
});
