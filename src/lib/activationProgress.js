// Content-free, device-local progress for the small post-sign-in activation
// sequence. We store only which generic step was handled — never a prayer id,
// title, person, group, timestamp, or anything else that could reveal content.
//
// This module is STORAGE only. Whether a step should be offered at all is
// decided in activationPolicy.js, so the thresholds live in one readable place.
export const ACTIVATION_STORAGE_KEY = 'pfm_activation_progress_v1';
// Session-scoped: one education prompt per visit, answered and then done.
export const EDUCATION_VISIT_KEY = 'pfm_education_handled';

export const ACTIVATION_STEPS = Object.freeze({
  RHYTHM: 'rhythm',
  REMINDER: 'reminder',
  ORGANIZE: 'organize',
});

const VALID_STEPS = new Set(Object.values(ACTIVATION_STEPS));
const SESSION_COMPLETED = 'session_completed';

function storage() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function sessionStore() {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

// An earlier implementation offered the reminder as a one-time toast. Either
// path should stop the other from asking the same person again.
export function legacyReminderSuggested() {
  try {
    return storage()?.getItem('pfm_reminder_suggested') === '1';
  } catch {
    return false;
  }
}

// A prompt was offered AND answered (acted on or dismissed) in this visit.
// Nothing else is taught until the next one — dismissing one card must never
// hand the next one straight to the same person.
export function markEducationHandledForVisit() {
  try {
    sessionStore()?.setItem(EDUCATION_VISIT_KEY, '1');
  } catch {
    // Best-effort only; prayer work never depends on this.
  }
}

export function educationHandledThisVisit() {
  try {
    return sessionStore()?.getItem(EDUCATION_VISIT_KEY) === '1';
  } catch {
    return false;
  }
}

export function readActivationProgress() {
  const fallback = { version: 1, handled: [], signals: [] };
  try {
    const raw = storage()?.getItem(ACTIVATION_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const handled = Array.isArray(parsed?.handled)
      ? parsed.handled.filter((step) => VALID_STEPS.has(step))
      : [];
    const signals = Array.isArray(parsed?.signals) && parsed.signals.includes(SESSION_COMPLETED)
      ? [SESSION_COMPLETED]
      : [];
    return { version: 1, handled: [...new Set(handled)], signals };
  } catch {
    return fallback;
  }
}

export function markActivationStepHandled(step) {
  if (!VALID_STEPS.has(step)) return readActivationProgress();
  const current = readActivationProgress();
  const next = {
    version: 1,
    handled: [...new Set([...current.handled, step])],
    signals: current.signals,
  };
  try {
    storage()?.setItem(ACTIVATION_STORAGE_KEY, JSON.stringify(next));
    // Respect the earlier one-time reminder toast: either implementation should
    // prevent the other from prompting the same person again.
    if (step === ACTIVATION_STEPS.REMINDER) storage()?.setItem('pfm_reminder_suggested', '1');
  } catch {
    // Storage can be unavailable in private/restricted contexts. The caller
    // still handles the current card in memory, so prayer work is unaffected.
  }
  return next;
}

export function markActivationSessionCompleted() {
  const current = readActivationProgress();
  const next = {
    version: 1,
    handled: current.handled,
    signals: [...new Set([...current.signals, SESSION_COMPLETED])],
  };
  try {
    storage()?.setItem(ACTIVATION_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Best-effort only; prayer completion itself must never depend on storage.
  }
  return next;
}
