import { describe, expect, it } from 'vitest';
import { dailyReminderStartDay } from './push';

describe('dailyReminderStartDay', () => {
  it('allows a reminder later today to run', () => {
    expect(dailyReminderStartDay('09:30', new Date(2026, 8, 1, 9, 29))).toBeUndefined();
  });

  it('marks today complete when enabling at or after the chosen time', () => {
    expect(dailyReminderStartDay('09:30', new Date(2026, 8, 1, 9, 30))).toBe('2026-09-01');
    expect(dailyReminderStartDay('09:30', new Date(2026, 8, 1, 18, 0))).toBe('2026-09-01');
  });
});
