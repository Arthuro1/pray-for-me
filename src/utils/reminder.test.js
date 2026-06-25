import { describe, it, expect } from 'vitest';
import { nextReminder } from './reminder.js';

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
