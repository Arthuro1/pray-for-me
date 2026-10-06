// @vitest-environment jsdom
//
// activationProgress is STORAGE. It records, content-free, which generic step a
// person has handled and whether they have completed a prayer session — never a
// prayer id, title, person or timestamp. The decision of what (if anything) to
// offer lives in activationPolicy.js and is tested there.
import { beforeEach, describe, expect, it } from 'vitest';
import {
  ACTIVATION_STORAGE_KEY,
  ACTIVATION_STEPS,
  EDUCATION_VISIT_KEY,
  educationHandledThisVisit,
  legacyReminderSuggested,
  markActivationStepHandled,
  markActivationSessionCompleted,
  markEducationHandledForVisit,
  readActivationProgress,
} from './activationProgress';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('activation progress storage', () => {
  it('persists only generic step identifiers, never prayer content or ids', () => {
    markActivationStepHandled(ACTIVATION_STEPS.RHYTHM);
    const raw = localStorage.getItem(ACTIVATION_STORAGE_KEY);
    expect(JSON.parse(raw)).toEqual({ version: 1, handled: ['rhythm'], signals: [] });
    expect(raw).not.toContain('private');
    expect(raw).not.toContain('p1');
    expect(readActivationProgress().handled).toEqual(['rhythm']);
  });

  it('records a completed prayer session as a bare signal', () => {
    markActivationSessionCompleted();
    expect(readActivationProgress().signals).toEqual(['session_completed']);
  });

  it('ignores an unknown step rather than storing it', () => {
    expect(markActivationStepHandled('not-a-step').handled).toEqual([]);
    expect(localStorage.getItem(ACTIVATION_STORAGE_KEY)).toBeNull();
  });

  it('recovers from a corrupt record instead of throwing', () => {
    localStorage.setItem(ACTIVATION_STORAGE_KEY, '{not json');
    expect(readActivationProgress()).toEqual({ version: 1, handled: [], signals: [] });
  });

  it('sets the legacy reminder marker so neither implementation asks twice', () => {
    expect(legacyReminderSuggested()).toBe(false);
    markActivationStepHandled(ACTIVATION_STEPS.REMINDER);
    expect(legacyReminderSuggested()).toBe(true);
  });
});

describe('one education prompt per visit', () => {
  it('remembers, for this visit only, that a prompt was answered', () => {
    expect(educationHandledThisVisit()).toBe(false);
    markEducationHandledForVisit();
    expect(educationHandledThisVisit()).toBe(true);
    // Session-scoped: a later visit starts clean.
    expect(sessionStorage.getItem(EDUCATION_VISIT_KEY)).toBe('1');
    sessionStorage.clear();
    expect(educationHandledThisVisit()).toBe(false);
  });
});
