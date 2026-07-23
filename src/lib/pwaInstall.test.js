// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONTEXTUAL_PROMPT_SESSION_KEY,
  PWA_RETENTION_STORAGE_KEY,
  PWA_VISIT_SESSION_KEY,
  initPwaInstallCapture,
  isInstalledPwa,
  isIosDevice,
  markContextualPromptShownForVisit,
  pwaInstallMode,
  pwaShortcutAction,
  resolvePwaShortcut,
  readPwaRetention,
  recordPwaVisit,
  requestNativePwaInstall,
  resetPwaInstallCaptureForTests,
  snoozePwaInstallPrompt,
} from './pwaInstall';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  resetPwaInstallCaptureForTests();
});

describe('PWA retention eligibility', () => {
  it('counts browsing sessions rather than reloads', () => {
    recordPwaVisit();
    recordPwaVisit();
    expect(readPwaRetention().visits).toBe(1);

    sessionStorage.removeItem(PWA_VISIT_SESSION_KEY);
    recordPwaVisit();
    expect(readPwaRetention().visits).toBe(2);
  });

  it('requires a meaningful repeat visit and a supported install path', () => {
    const retention = { version: 1, visits: 2, snoozedUntilVisit: 0, installed: false };
    expect(pwaInstallMode({
      retention,
      sessionCompleted: true,
      nativePromptAvailable: true,
      ios: false,
      installed: false,
      promptShownThisVisit: false,
    })).toBe('native');
    expect(pwaInstallMode({
      retention: { ...retention, visits: 1 },
      sessionCompleted: true,
      nativePromptAvailable: true,
      promptShownThisVisit: false,
    })).toBeNull();
    expect(pwaInstallMode({
      retention,
      sessionCompleted: false,
      nativePromptAvailable: true,
      promptShownThisVisit: false,
    })).toBeNull();
    expect(pwaInstallMode({
      retention,
      sessionCompleted: true,
      nativePromptAvailable: false,
      ios: true,
      installed: false,
      promptShownThisVisit: false,
    })).toBe('ios');
  });

  it('does not stack with another contextual suggestion in the same visit', () => {
    markContextualPromptShownForVisit();
    expect(sessionStorage.getItem(CONTEXTUAL_PROMPT_SESSION_KEY)).toBe('1');
    expect(pwaInstallMode({
      retention: { version: 1, visits: 3, snoozedUntilVisit: 0, installed: false },
      sessionCompleted: true,
      nativePromptAvailable: true,
    })).toBeNull();
  });

  it('snoozes without storing dates or content', () => {
    localStorage.setItem(PWA_RETENTION_STORAGE_KEY, JSON.stringify({
      version: 1,
      visits: 3,
      snoozedUntilVisit: 0,
      installed: false,
    }));
    expect(snoozePwaInstallPrompt().snoozedUntilVisit).toBe(7);
    expect(Object.keys(readPwaRetention()).sort()).toEqual([
      'installed',
      'snoozedUntilVisit',
      'version',
      'visits',
    ]);
  });

  it('uses real install events and records an accepted native prompt', async () => {
    initPwaInstallCapture(window);
    const event = new Event('beforeinstallprompt');
    event.preventDefault = vi.fn();
    event.prompt = vi.fn();
    event.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(event);

    expect(pwaInstallMode({
      retention: { version: 1, visits: 2, snoozedUntilVisit: 0, installed: false },
      sessionCompleted: true,
      ios: false,
      installed: false,
      promptShownThisVisit: false,
    })).toBe('native');
    await expect(requestNativePwaInstall(window)).resolves.toBe('accepted');
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(readPwaRetention().installed).toBe(true);
  });
});

describe('PWA platform and shortcuts', () => {
  it('recognizes iPhone/iPadOS and installed display modes', () => {
    expect(isIosDevice({ userAgent: 'Mozilla/5.0 (iPhone)', platform: 'iPhone' })).toBe(true);
    expect(isIosDevice({ userAgent: 'Mozilla/5.0', platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true);
    expect(isInstalledPwa({ matchMedia: () => ({ matches: true }) }, {})).toBe(true);
  });

  it('accepts only the add-prayer shortcut action', () => {
    expect(pwaShortcutAction('?action=add-prayer')).toBe('add-prayer');
    expect(pwaShortcutAction('?action=delete-prayer')).toBeNull();
    expect(pwaShortcutAction('?source=pwa-shortcut')).toBeNull();
  });

  it('does not consume Add prayer while a saved session is still restoring', () => {
    const base = { search: '?action=add-prayer' };
    expect(resolvePwaShortcut({ ...base, authLoading: true })).toBe('wait');
    expect(resolvePwaShortcut({
      ...base,
      authLoading: false,
      userId: 'user-1',
      vaultChecked: false,
      vaultUnlocked: false,
    })).toBe('wait');
    expect(resolvePwaShortcut({
      ...base,
      authLoading: false,
      userId: 'user-1',
      vaultChecked: true,
      vaultUnlocked: true,
    })).toBe('add-prayer');
    expect(resolvePwaShortcut({
      ...base,
      authLoading: false,
      userId: null,
    })).toBe('guest-prayer');
  });
});
