import { describe, it, expect } from 'vitest';
import { nextReminder, nextFollowUp } from './reminder.js';

describe('nextReminder', () => {
  const at = (h, m) => new Date(2026, 5, 24, h, m, 0); // 2026-06-24 local

  it('is later today when the time has not passed yet', () => {
    expect(nextReminder('07:00', at(6, 0))).toEqual({ tomorrow: false, time: '07:00' });
  });

  it('is tomorrow once the time has passed', () => {
    expect(nextReminder('07:00', at(8, 0))).toEqual({ tomorrow: true, time: '07:00' });
  });

  it('treats the exact minute as already passed (→ tomorrow)', () => {
    expect(nextReminder('07:00', at(7, 0))).toEqual({ tomorrow: true, time: '07:00' });
  });

  it('zero-pads and defaults a missing time', () => {
    expect(nextReminder('9:5', at(0, 0))).toEqual({ tomorrow: false, time: '09:05' });
    expect(nextReminder(undefined, at(0, 0))).toEqual({ tomorrow: false, time: '07:00' });
  });
});

describe('nextFollowUp', () => {
  const at = (h, m) => new Date(2026, 5, 24, h, m, 0); // 2026-06-24 local

  it('counts one full cadence from now when never sent', () => {
    expect(nextFollowUp(null, 7, '07:00', at(6, 0)).daysAhead).toBe(7);
    expect(nextFollowUp(null, 7, '07:00', at(8, 0)).daysAhead).toBe(8); // 07:00 on day 7 precedes the anchor time → next day
  });

  it('moves with the chosen cadence', () => {
    expect(nextFollowUp(null, 3, '07:00', at(6, 0)).daysAhead).toBe(3);
    expect(nextFollowUp(null, 14, '07:00', at(6, 0)).daysAhead).toBe(14);
    expect(nextFollowUp(null, 30, '07:00', at(6, 0)).daysAhead).toBe(30);
  });

  it('lands `days` after the last send, at the reminder time', () => {
    const lastSent = new Date(2026, 5, 20, 7, 0, 0).toISOString(); // 2026-06-20 07:00
    const r = nextFollowUp(lastSent, 7, '07:00', at(6, 0));
    expect(r.daysAhead).toBe(3); // 2026-06-27
    expect(r.time).toBe('07:00');
  });

  it('falls back to the next reminder slot if already overdue', () => {
    const lastSent = new Date(2026, 5, 1, 7, 0, 0).toISOString(); // long past due
    expect(nextFollowUp(lastSent, 7, '07:00', at(6, 0)).daysAhead).toBe(0);
    expect(nextFollowUp(lastSent, 7, '07:00', at(8, 0)).daysAhead).toBe(1);
  });
});
