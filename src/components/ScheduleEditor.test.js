import { describe, it, expect } from 'vitest';
import { emptyDraft, isAdvancedDraft, scheduleFromDraft, draftFromSchedule } from './ScheduleEditor';

// The Simple/Advanced split hinges on isAdvancedDraft() deciding whether an
// existing schedule needs the advanced controls revealed. Advanced is a pure UX
// disclosure (never a gate) — these tests pin the classification and confirm the
// underlying draft→schedule round-trip is untouched by the UI split.
describe('isAdvancedDraft', () => {
  it('treats no schedule / one-time / plain daily+weekly as simple', () => {
    expect(isAdvancedDraft(null)).toBe(false);
    expect(isAdvancedDraft(emptyDraft())).toBe(false); // mode: 'plan'
    expect(isAdvancedDraft({ ...emptyDraft(), mode: 'once' })).toBe(false);
    expect(isAdvancedDraft({ ...emptyDraft(), mode: 'recurring', freq: 'daily' })).toBe(false);
    expect(isAdvancedDraft({ ...emptyDraft(), mode: 'recurring', freq: 'weekly' })).toBe(false);
  });

  it('keeps "until answered" and "never" in the simple tier', () => {
    expect(isAdvancedDraft({ ...emptyDraft(), mode: 'recurring', freq: 'daily', endKind: 'answered' })).toBe(false);
    expect(isAdvancedDraft({ ...emptyDraft(), mode: 'recurring', freq: 'weekly', endKind: 'never' })).toBe(false);
  });

  it('flags custom recurrence rules as advanced', () => {
    for (const freq of ['interval', 'monthly', 'yearly']) {
      expect(isAdvancedDraft({ ...emptyDraft(), mode: 'recurring', freq })).toBe(true);
    }
  });

  it('flags bounded end conditions as advanced', () => {
    for (const endKind of ['date', 'count']) {
      expect(isAdvancedDraft({ ...emptyDraft(), mode: 'recurring', freq: 'daily', endKind })).toBe(true);
    }
  });

  it('auto-opens for an existing monthly-until-count schedule (round-trips)', () => {
    const draft = draftFromSchedule({ type: 'recurring', freq: 'monthly', dayOfMonth: 15, end: { kind: 'count', count: 30 } });
    expect(isAdvancedDraft(draft)).toBe(true);
    // The split is UI-only: the persisted schedule must be unchanged.
    const s = scheduleFromDraft(draft);
    expect(s.freq).toBe('monthly');
    expect(s.dayOfMonth).toBe(15);
    expect(s.end).toEqual({ kind: 'count', count: 30 });
  });
});
