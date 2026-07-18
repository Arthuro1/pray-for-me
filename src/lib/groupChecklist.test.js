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
    const steps = checklistSteps({ memberCount: 1, requestCount: 1, hasPrayed: false, flags: checklistFlags('g1') });
    expect(steps.find((s) => s.id === 'invite').done).toBe(true);
    expect(steps.find((s) => s.id === 'pray').done).toBe(true);
  });

  it('marks the pray step BLOCKED while the group has no request, so the UI can say so up front', () => {
    const empty = checklistSteps({ memberCount: 1, requestCount: 0, hasPrayed: false, flags: {} });
    expect(empty.find((s) => s.id === 'pray').blocked).toBe(true);
    // The moment a request exists it is a real, offerable action.
    const ready = checklistSteps({ memberCount: 1, requestCount: 1, hasPrayed: false, flags: {} });
    expect(ready.find((s) => s.id === 'pray').blocked).toBe(false);
    // Only the pray step can be blocked — inviting and adding never depend on one.
    expect(empty.filter((s) => s.blocked).map((s) => s.id)).toEqual(['pray']);
  });

  it('the pray step can NEVER complete while the group has no request — even with a stale flag or reaction', () => {
    setChecklistFlag('g1', 'prayed');
    const withFlag = checklistSteps({ memberCount: 2, requestCount: 0, hasPrayed: false, flags: checklistFlags('g1') });
    expect(withFlag.find((s) => s.id === 'pray').done).toBe(false);
    const withReaction = checklistSteps({ memberCount: 2, requestCount: 0, hasPrayed: true, flags: {} });
    expect(withReaction.find((s) => s.id === 'pray').done).toBe(false);
    // The moment a request exists, the same evidence counts.
    const valid = checklistSteps({ memberCount: 2, requestCount: 1, hasPrayed: true, flags: {} });
    expect(valid.find((s) => s.id === 'pray').done).toBe(true);
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
