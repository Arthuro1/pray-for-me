import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PWA_VISIT_SESSION_KEY,
  initPwaInstallCapture,
  pwaInstallMode,
  readPwaRetention,
  recordPwaVisit,
  resolvePwaShortcut,
  requestNativePwaInstall,
  resetPwaInstallCaptureForTests,
} from './pwaInstall';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  resetPwaInstallCaptureForTests();
});

describe('PWA install eligibility in a real browser', () => {
  it('waits for an engaged repeat visit, then uses the captured browser prompt', async () => {
    initPwaInstallCapture(window);
    const promptEvent = new Event('beforeinstallprompt', { cancelable: true });
    const prompt = vi.fn();
    Object.defineProperties(promptEvent, {
      prompt: { value: prompt },
      userChoice: { value: Promise.resolve({ outcome: 'accepted' }) },
    });
    window.dispatchEvent(promptEvent);

    recordPwaVisit();
    expect(promptEvent.defaultPrevented).toBe(true);
    expect(pwaInstallMode({
      retention: readPwaRetention(),
      sessionCompleted: true,
      ios: false,
      installed: false,
      promptShownThisVisit: false,
    })).toBeNull();

    // A new browsing session, not a reload.
    sessionStorage.removeItem(PWA_VISIT_SESSION_KEY);
    recordPwaVisit();
    expect(pwaInstallMode({
      retention: readPwaRetention(),
      sessionCompleted: true,
      ios: false,
      installed: false,
      promptShownThisVisit: false,
    })).toBe('native');

    await expect(requestNativePwaInstall(window)).resolves.toBe('accepted');
    expect(prompt).toHaveBeenCalledOnce();
    expect(readPwaRetention().installed).toBe(true);
  });

  it('keeps the Add prayer action through an authenticated cold start', () => {
    const search = '?action=add-prayer';
    expect(resolvePwaShortcut({ search, authLoading: true })).toBe('wait');
    expect(resolvePwaShortcut({
      search,
      authLoading: false,
      userId: 'restored-user',
      vaultChecked: false,
      vaultUnlocked: false,
    })).toBe('wait');
    expect(resolvePwaShortcut({
      search,
      authLoading: false,
      userId: 'restored-user',
      vaultChecked: true,
      vaultUnlocked: true,
    })).toBe('add-prayer');
  });
});
