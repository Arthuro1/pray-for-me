// @vitest-environment jsdom
//
// First-group checklist: steps derive from live group data, complete themselves,
// and the card can be dismissed — after which it never returns for that group.
import { describe, it, expect, beforeEach } from 'vitest';
import { checklistFlags, setChecklistFlag, dismissChecklist, checklistSteps, checklistVisible } from './groupChecklist';

beforeEach(() => localStorage.clear());

describe('checklistSteps', () => {
  it('starts with all three steps open for a fresh solo group', () => {
    const steps = checklistSteps({ memberCount: 1, requestCount: 0, hasPrayed: false, flags: {} });
    expect(steps.map((s) => s.done)).toEqual([false, false, false]);
  });

  it('ticks each step off from live data: members joined, request added, prayed', () => {
    const steps = checklistSteps({ memberCount: 2, requestCount: 1, hasPrayed: true, flags: {} });
    expect(steps.map((s) => s.done)).toEqual([true, true, true]);
  });

  it('honours locally-recorded acts the server cannot see (invite shared, prayer begun)', () => {
    setChecklistFlag('g1', 'invited');
    setChecklistFlag('g1', 'prayed');
    const steps = checklistSteps({ memberCount: 1, requestCount: 0, hasPrayed: false, flags: checklistFlags('g1') });
    expect(steps.find((s) => s.id === 'invite').done).toBe(true);
    expect(steps.find((s) => s.id === 'pray').done).toBe(true);
    expect(steps.find((s) => s.id === 'request').done).toBe(false);
  });
});

describe('checklistVisible', () => {
  const openSteps = checklistSteps({ memberCount: 1, requestCount: 0, hasPrayed: false, flags: {} });

  it('shows while steps remain and the leader has not dismissed it', () => {
    expect(checklistVisible('g1', openSteps)).toBe(true);
  });

  it('disappears for good after a dismissal', () => {
    dismissChecklist('g1');
    expect(checklistVisible('g1', openSteps)).toBe(false);
    // Another group's checklist is unaffected.
    expect(checklistVisible('g2', openSteps)).toBe(true);
  });

  it('retires automatically once every step is complete', () => {
    const doneSteps = checklistSteps({ memberCount: 2, requestCount: 1, hasPrayed: true, flags: {} });
    expect(checklistVisible('g1', doneSteps)).toBe(false);
  });
});
