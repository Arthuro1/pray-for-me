export const PWA_RETENTION_STORAGE_KEY = 'pfm_pwa_retention_v1';
export const PWA_VISIT_SESSION_KEY = 'pfm_pwa_visit_recorded';
export const CONTEXTUAL_PROMPT_SESSION_KEY = 'pfm_contextual_prompt_shown';

const INSTALL_STATE_EVENT = 'pfm:pwa-install-state';
const SNOOZE_VISITS = 4;

let deferredInstallPrompt = null;
let captureInitialized = false;

function localStore() {
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

export function readPwaRetention() {
  const fallback = { version: 1, visits: 0, snoozedUntilVisit: 0, installed: false };
  try {
    const parsed = JSON.parse(localStore()?.getItem(PWA_RETENTION_STORAGE_KEY) || 'null');
    return {
      version: 1,
      visits: Math.max(0, Number.isFinite(parsed?.visits) ? Math.floor(parsed.visits) : 0),
      snoozedUntilVisit: Math.max(
        0,
        Number.isFinite(parsed?.snoozedUntilVisit) ? Math.floor(parsed.snoozedUntilVisit) : 0,
      ),
      installed: parsed?.installed === true,
    };
  } catch {
    return fallback;
  }
}

function writePwaRetention(next) {
  try {
    localStore()?.setItem(PWA_RETENTION_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Installation retention is best-effort and must never block prayer.
  }
  return next;
}

// A visit is one browsing session, not each reload. This is deliberately only a
// content-free count; it stores no dates, routes, prayer ids, or account data.
export function recordPwaVisit() {
  const current = readPwaRetention();
  try {
    if (sessionStore()?.getItem(PWA_VISIT_SESSION_KEY) === '1') return current;
    sessionStore()?.setItem(PWA_VISIT_SESSION_KEY, '1');
  } catch {
    // If session storage is unavailable, count this load once.
  }
  return writePwaRetention({ ...current, visits: current.visits + 1 });
}

export function snoozePwaInstallPrompt() {
  const current = readPwaRetention();
  return writePwaRetention({
    ...current,
    snoozedUntilVisit: current.visits + SNOOZE_VISITS,
  });
}

export function markPwaInstalled() {
  const current = readPwaRetention();
  return writePwaRetention({ ...current, installed: true });
}

export function markContextualPromptShownForVisit() {
  try {
    sessionStore()?.setItem(CONTEXTUAL_PROMPT_SESSION_KEY, '1');
  } catch {
    // Best-effort only.
  }
}

export function contextualPromptShownThisVisit() {
  try {
    return sessionStore()?.getItem(CONTEXTUAL_PROMPT_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function isInstalledPwa(win = globalThis.window, nav = globalThis.navigator) {
  return !!(
    win?.matchMedia?.('(display-mode: standalone)')?.matches
    || nav?.standalone === true
  );
}

export function isIosDevice(nav = globalThis.navigator) {
  const ua = nav?.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua)
    || (nav?.platform === 'MacIntel' && nav?.maxTouchPoints > 1);
}

export function pwaInstallMode({
  retention = readPwaRetention(),
  sessionCompleted = false,
  nativePromptAvailable = !!deferredInstallPrompt,
  ios = isIosDevice(),
  installed = isInstalledPwa(),
  secureContext = globalThis.window?.isSecureContext !== false,
  promptShownThisVisit = contextualPromptShownThisVisit(),
} = {}) {
  if (
    !secureContext
    || installed
    || retention.installed
    || retention.visits < 2
    || retention.snoozedUntilVisit > retention.visits
    || !sessionCompleted
    || promptShownThisVisit
  ) {
    return null;
  }
  if (nativePromptAvailable) return 'native';
  if (ios) return 'ios';
  return null;
}

function announceInstallState(win = globalThis.window) {
  win?.dispatchEvent?.(new Event(INSTALL_STATE_EVENT));
}

// Capture beforeinstallprompt before the lazy Home chunk mounts. Chromium only
// fires it when the browser has independently confirmed installability.
export function initPwaInstallCapture(win = globalThis.window) {
  if (!win || captureInitialized) return;
  captureInitialized = true;
  win.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    announceInstallState(win);
  });
  win.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    markPwaInstalled();
    announceInstallState(win);
  });
}

export function subscribePwaInstallState(listener, win = globalThis.window) {
  win?.addEventListener?.(INSTALL_STATE_EVENT, listener);
  return () => win?.removeEventListener?.(INSTALL_STATE_EVENT, listener);
}

export async function requestNativePwaInstall(win = globalThis.window) {
  const prompt = deferredInstallPrompt;
  if (!prompt) return 'unavailable';
  deferredInstallPrompt = null;
  announceInstallState(win);
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice?.outcome === 'accepted') {
      markPwaInstalled();
      return 'accepted';
    }
    snoozePwaInstallPrompt();
    return 'dismissed';
  } catch {
    snoozePwaInstallPrompt();
    return 'dismissed';
  }
}

export function pwaShortcutAction(search = '') {
  const action = new URLSearchParams(search).get('action');
  return action === 'add-prayer' ? action : null;
}

export function resolvePwaShortcut({
  search = '',
  authLoading = true,
  userId = null,
  vaultChecked = false,
  vaultUnlocked = false,
} = {}) {
  if (pwaShortcutAction(search) !== 'add-prayer') return null;
  if (authLoading) return 'wait';
  if (!userId) return 'guest-prayer';
  if (!vaultChecked || !vaultUnlocked) return 'wait';
  return 'add-prayer';
}

// Used only by isolated tests to avoid state leaking between browser fixtures.
export function resetPwaInstallCaptureForTests() {
  deferredInstallPrompt = null;
  captureInitialized = false;
}
