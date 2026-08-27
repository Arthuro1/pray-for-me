// @vitest-environment jsdom
//
// The early lifecycle, from the outside: someone should be able to write a
// prayer, pray it, and come back — several times — before the app starts
// teaching them about rhythms, reminders, organizing or installing. These tests
// pin the states in which each prompt may and may not appear, so a future
// threshold change has to be deliberate.
import { beforeEach, describe, expect, it } from 'vitest';
import {
  ACTIVATION_STEPS,
  markActivationStepHandled,
  markEducationHandledForVisit,
} from './activationProgress';
import {
  activationTargetPrayer,
  nextActivationStep,
  pwaInstallAllowed,
  returningDayCount,
} from './activationPolicy';

const prayer = (id, extra = {}) => ({
  id,
  title: `private-${id}`,
  status: 'active',
  prayer_categories: [],
  ...extra,
});

// Two prayers prayed, on two different days — the shape of "they came back".
const RETURNED = { p1: ['2026-08-25'], p2: ['2026-08-26'] };
const ONE_DAY = { p1: ['2026-08-25'] };

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('the first prayer is left alone', () => {
  it('teaches nothing to someone with one prayer in their first session', () => {
    expect(nextActivationStep({ prayers: [prayer('p1')] })).toBeNull();
  });

  it('still teaches nothing after they pray it — the loop is the point', () => {
    expect(nextActivationStep({
      prayers: [prayer('p1')],
      completions: ONE_DAY,
      sessionCompleted: true,
    })).toBeNull();
  });

  it('lets the install invitation through only when nothing else is due', () => {
    expect(pwaInstallAllowed({ activationStep: null })).toBe(true);
    expect(pwaInstallAllowed({ activationStep: ACTIVATION_STEPS.RHYTHM })).toBe(false);
  });
});

describe('rhythm — offered once a rhythm would solve something', () => {
  it('appears at a second prayer', () => {
    expect(nextActivationStep({ prayers: [prayer('p1'), prayer('p2')] }))
      .toBe(ACTIVATION_STEPS.RHYTHM);
  });

  it('appears for a returning person even with one prayer', () => {
    expect(nextActivationStep({ prayers: [prayer('p1')], completions: RETURNED }))
      .toBe(ACTIVATION_STEPS.RHYTHM);
  });

  it('appears when a prayer has no way of coming back at all', () => {
    const stuck = prayer('p1', { schedule: { type: 'none' } });
    expect(nextActivationStep({ prayers: [stuck] })).toBe(ACTIVATION_STEPS.RHYTHM);
    // …and it points at the prayer it can actually fix.
    expect(activationTargetPrayer(ACTIVATION_STEPS.RHYTHM, [prayer('p0'), stuck])).toBe(stuck);
  });

  it('counts only active prayers — answered ones are not a growing list', () => {
    expect(nextActivationStep({
      prayers: [prayer('p1'), prayer('p2', { status: 'answered' })],
    })).toBeNull();
  });
});

describe('reminder — offered to someone who has shown they come back', () => {
  const afterOneSession = { sessionCompleted: true, handled: [ACTIVATION_STEPS.RHYTHM] };

  it('is not offered after a single prayer on a single day', () => {
    expect(nextActivationStep({
      ...afterOneSession, prayers: [prayer('p1')], completions: ONE_DAY,
    })).toBeNull();
  });

  it('is offered once a second day of praying exists', () => {
    expect(nextActivationStep({
      ...afterOneSession, prayers: [prayer('p1')], completions: RETURNED,
    })).toBe(ACTIVATION_STEPS.REMINDER);
  });

  it('is offered once there is more than one prayer to be reminded about', () => {
    expect(nextActivationStep({
      ...afterOneSession, prayers: [prayer('p1'), prayer('p2')], completions: ONE_DAY,
    })).toBe(ACTIVATION_STEPS.REMINDER);
  });

  it('is not offered to someone who already has reminders on', () => {
    expect(nextActivationStep({
      ...afterOneSession,
      prayers: [prayer('p1'), prayer('p2')],
      dailyReminderEnabled: true,
    })).toBeNull();
  });

  it('honours the earlier reminder-toast marker so nobody is asked twice', () => {
    localStorage.setItem('pfm_reminder_suggested', '1');
    expect(nextActivationStep({
      ...afterOneSession, prayers: [prayer('p1'), prayer('p2')],
    })).toBeNull();
  });
});

describe('organizing — offered once a list is worth grouping', () => {
  const handled = [ACTIVATION_STEPS.RHYTHM, ACTIVATION_STEPS.REMINDER];

  it('waits for three prayers', () => {
    expect(nextActivationStep({ prayers: [prayer('p1'), prayer('p2')], handled })).toBeNull();
    expect(nextActivationStep({
      prayers: [prayer('p1'), prayer('p2'), prayer('p3')], handled,
    })).toBe(ACTIVATION_STEPS.ORGANIZE);
  });

  it('never introduces organizing to a journal that already uses it', () => {
    expect(nextActivationStep({
      prayers: [prayer('p1', { person_name: 'kept only in memory' }), prayer('p2'), prayer('p3')],
      handled,
    })).toBeNull();
  });

  it('targets a prayer that is actually unorganized', () => {
    const organized = prayer('p1', { category_ids: ['c1'] });
    const bare = prayer('p2');
    expect(activationTargetPrayer(ACTIVATION_STEPS.ORGANIZE, [organized, bare])).toBe(bare);
  });
});

describe('one prompt at a time', () => {
  it('reveals exactly one step, in order, as the account grows', () => {
    const two = [prayer('p1'), prayer('p2')];
    expect(nextActivationStep({ prayers: two })).toBe(ACTIVATION_STEPS.RHYTHM);

    markActivationStepHandled(ACTIVATION_STEPS.RHYTHM);
    expect(nextActivationStep({ prayers: two, sessionCompleted: true }))
      .toBe(ACTIVATION_STEPS.REMINDER);

    markActivationStepHandled(ACTIVATION_STEPS.REMINDER);
    expect(nextActivationStep({ prayers: [...two, prayer('p3')] }))
      .toBe(ACTIVATION_STEPS.ORGANIZE);
  });

  it('answering one ends education for the rest of the visit', () => {
    const three = [prayer('p1'), prayer('p2'), prayer('p3')];
    expect(nextActivationStep({ prayers: three })).toBe(ACTIVATION_STEPS.RHYTHM);

    // Dismissing the rhythm card must not hand over the organize card, nor let
    // the install invitation take the empty slot.
    markActivationStepHandled(ACTIVATION_STEPS.RHYTHM);
    markEducationHandledForVisit();
    expect(nextActivationStep({ prayers: three })).toBeNull();
    expect(pwaInstallAllowed({ activationStep: null })).toBe(false);
  });

  it('starts offering again on the next visit', () => {
    const three = [prayer('p1'), prayer('p2'), prayer('p3')];
    markActivationStepHandled(ACTIVATION_STEPS.RHYTHM);
    markEducationHandledForVisit();
    sessionStorage.clear(); // a new visit
    expect(nextActivationStep({ prayers: three })).toBe(ACTIVATION_STEPS.ORGANIZE);
  });
});

describe('returningDayCount', () => {
  it('counts distinct days across every prayer, never prayers', () => {
    expect(returningDayCount({})).toBe(0);
    expect(returningDayCount({ p1: ['2026-08-25'], p2: ['2026-08-25'] })).toBe(1);
    expect(returningDayCount({ p1: ['2026-08-25', '2026-08-26'] })).toBe(2);
    expect(returningDayCount({ p1: null })).toBe(0);
  });
});
