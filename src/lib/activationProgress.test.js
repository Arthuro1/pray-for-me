// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  ACTIVATION_STORAGE_KEY,
  ACTIVATION_STEPS,
  activationTargetPrayer,
  markActivationStepHandled,
  markActivationSessionCompleted,
  nextActivationStep,
  readActivationProgress,
} from './activationProgress';

const prayer = (id, extra = {}) => ({
  id,
  title: `private-${id}`,
  status: 'active',
  prayer_categories: [],
  ...extra,
});

beforeEach(() => localStorage.clear());

describe('progressive activation', () => {
  it('reveals exactly one step in contextual priority order', () => {
    const prayers = [prayer('p1')];
    expect(nextActivationStep({ prayers })).toBe(ACTIVATION_STEPS.RHYTHM);

    markActivationStepHandled(ACTIVATION_STEPS.RHYTHM);
    markActivationSessionCompleted();
    expect(nextActivationStep({ prayers }))
      .toBe(ACTIVATION_STEPS.REMINDER);

    markActivationStepHandled(ACTIVATION_STEPS.REMINDER);
    const grown = [prayer('p1'), prayer('p2'), prayer('p3')];
    expect(nextActivationStep({ prayers: grown })).toBe(ACTIVATION_STEPS.ORGANIZE);
  });

  it('skips suggestions already satisfied by product state', () => {
    const organized = [
      prayer('p1', { person_name: 'kept only in memory' }),
      prayer('p2'),
      prayer('p3'),
    ];
    expect(nextActivationStep({
      prayers: organized,
      sessionCompleted: true,
      dailyReminderEnabled: true,
      handled: [ACTIVATION_STEPS.RHYTHM],
    })).toBeNull();
  });

  it('honours the earlier reminder-toast marker so users are not prompted twice', () => {
    localStorage.setItem('pfm_reminder_suggested', '1');
    expect(nextActivationStep({
      prayers: [prayer('p1'), prayer('p2')],
      sessionCompleted: true,
      handled: [ACTIVATION_STEPS.RHYTHM],
    })).toBeNull();
  });

  it('persists only generic step identifiers, never prayer content or ids', () => {
    markActivationStepHandled(ACTIVATION_STEPS.RHYTHM);
    const raw = localStorage.getItem(ACTIVATION_STORAGE_KEY);
    expect(JSON.parse(raw)).toEqual({ version: 1, handled: ['rhythm'], signals: [] });
    expect(raw).not.toContain('private');
    expect(raw).not.toContain('p1');
    expect(readActivationProgress().handled).toEqual(['rhythm']);
  });

  it('opens an in-memory prayer target without persisting its identity', () => {
    const prayers = [prayer('p1'), prayer('p2'), prayer('p3')];
    expect(activationTargetPrayer(ACTIVATION_STEPS.ORGANIZE, prayers)).toBe(prayers[0]);
    expect(localStorage.getItem(ACTIVATION_STORAGE_KEY)).toBeNull();
  });
});
