// Content-free, device-local progress for the small post-sign-in activation
// sequence. We store only which generic step was handled — never a prayer id,
// title, person, group, timestamp, or anything else that could reveal content.
export const ACTIVATION_STORAGE_KEY = 'pfm_activation_progress_v1';

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

function hasOrganization(prayer) {
  return !!(
    prayer?.for_other
    || prayer?.person_name
    || (prayer?.category_ids || []).length
    || (prayer?.prayer_categories || []).length
  );
}

// Returns ONE next step in priority order. Natural product state also completes
// a step: an enabled reminder needs no prompt, and an already-organized journal
// needs no introduction.
export function nextActivationStep({
  prayers = [],
  dailyReminderEnabled = false,
  progress = readActivationProgress(),
  handled = progress.handled,
  sessionCompleted = progress.signals.includes(SESSION_COMPLETED),
  legacyReminderHandled = storage()?.getItem('pfm_reminder_suggested') === '1',
} = {}) {
  const done = new Set(handled);
  const activePrayers = prayers.filter((prayer) => prayer?.status !== 'answered');

  if (activePrayers.length === 1 && !done.has(ACTIVATION_STEPS.RHYTHM)) {
    return ACTIVATION_STEPS.RHYTHM;
  }

  if (
    sessionCompleted
    && !dailyReminderEnabled
    && !legacyReminderHandled
    && !done.has(ACTIVATION_STEPS.REMINDER)
  ) {
    return ACTIVATION_STEPS.REMINDER;
  }

  if (
    activePrayers.length >= 3
    && !activePrayers.some(hasOrganization)
    && !done.has(ACTIVATION_STEPS.ORGANIZE)
  ) {
    return ACTIVATION_STEPS.ORGANIZE;
  }

  return null;
}

export function activationTargetPrayer(step, prayers = []) {
  const active = prayers.filter((prayer) => prayer?.status !== 'answered');
  if (step === ACTIVATION_STEPS.RHYTHM) return active[0] || null;
  if (step === ACTIVATION_STEPS.ORGANIZE) {
    return active.find((prayer) => !hasOrganization(prayer)) || null;
  }
  return null;
}
