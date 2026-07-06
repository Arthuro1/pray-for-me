import { describe, it, expect, beforeEach } from 'vitest';
import useFollowUpStore, {
  FOLLOW_UP_OPTIONS,
  followUpDateFor,
  isFollowUpDue,
} from './followUpStore';
import { todayKey } from '../lib/prayedLog';
import { addDays } from '../lib/schedule';

// A per-prayer follow-up is a one-time "check back in on THIS prayer" reminder.
// These tests pin that it is a plain { date, status } value — never a recurrence
// schedule, and never the account-level follow-up cadence from Settings.
const reset = () => useFollowUpStore.setState({ followUps: {} });

describe('followUpStore', () => {
  beforeEach(reset);

  it('offers human "when" presets that resolve to future day-keys, not recurrences', () => {
    expect(FOLLOW_UP_OPTIONS.map((o) => o.id)).toEqual(['off', 'tomorrow', 'in3', 'in1w', 'in2w']);
    const off = FOLLOW_UP_OPTIONS.find((o) => o.id === 'off');
    const in3 = FOLLOW_UP_OPTIONS.find((o) => o.id === 'in3');
    expect(followUpDateFor(off)).toBeNull();
    expect(followUpDateFor(in3)).toBe(addDays(todayKey(), 3));
  });

  it('stores a per-prayer follow-up as { date, status } with no schedule/recurrence shape', () => {
    useFollowUpStore.getState().setFollowUp('p1', addDays(todayKey(), 7));
    const fu = useFollowUpStore.getState().getFollowUp('p1');
    expect(fu.date).toBe(addDays(todayKey(), 7));
    expect(fu.status).toBe('pending');
    // Guard against it ever becoming a recurrence schedule.
    expect(fu).not.toHaveProperty('freq');
    expect(fu).not.toHaveProperty('type');
    expect(fu).not.toHaveProperty('weekDays');
  });

  it('is keyed per prayer and clears independently', () => {
    const s = useFollowUpStore.getState();
    s.setFollowUp('p1', todayKey());
    s.setFollowUp('p2', addDays(todayKey(), 1));
    s.clearFollowUp('p1');
    expect(useFollowUpStore.getState().getFollowUp('p1')).toBeNull();
    expect(useFollowUpStore.getState().getFollowUp('p2').date).toBe(addDays(todayKey(), 1));
  });

  it('snoozes a due follow-up into the future', () => {
    useFollowUpStore.getState().setFollowUp('p1', todayKey());
    useFollowUpStore.getState().snoozeFollowUp('p1', 3);
    expect(useFollowUpStore.getState().getFollowUp('p1').date).toBe(addDays(todayKey(), 3));
  });

  it('is "due" only once the date has arrived and it is still pending', () => {
    expect(isFollowUpDue({ date: todayKey(), status: 'pending' })).toBe(true);
    expect(isFollowUpDue({ date: addDays(todayKey(), 1), status: 'pending' })).toBe(false);
    expect(isFollowUpDue({ date: todayKey(), status: 'done' })).toBe(false);
    expect(isFollowUpDue(null)).toBe(false);
  });
});
