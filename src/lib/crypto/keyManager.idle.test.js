import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureAccountContext, getLifecycleToken, getMasterKey, handleAccountSecurityStorageChange,
  installCandidateMasterKey, isLifecycleCurrent, isUnlocked, lock, resetAutoLock, setAutoLockMs,
  setDeviceProtectionPolicy } from './keyManager';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key) };
}

let candidate;
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  vi.setSystemTime(new Date('2026-10-09T00:00:00Z'));
  vi.stubGlobal('localStorage', memoryStorage());
  vi.stubGlobal('sessionStorage', memoryStorage());
  configureAccountContext(null);
  configureAccountContext('idle-account');
  setAutoLockMs(0);
  candidate = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  expect(await installCandidateMasterKey(candidate)).toBe(true);
});

afterEach(() => {
  configureAccountContext(null);
  setAutoLockMs(0);
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('protected account inactivity', () => {
  it('enforces five minutes even when the transparent setting disables auto-lock', () => {
    expect(setDeviceProtectionPolicy('idle-account', true)).toBe(true);
    setAutoLockMs(0);
    vi.advanceTimersByTime(299_999);
    expect(isUnlocked()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(isUnlocked()).toBe(false);
  });

  it('keeps active protected use open and starts a fresh limit after verified unlock', async () => {
    setDeviceProtectionPolicy('idle-account', true);
    vi.advanceTimersByTime(240_000);
    resetAutoLock();
    vi.advanceTimersByTime(299_999);
    expect(getMasterKey()).toBe(candidate);
    vi.advanceTimersByTime(1);
    expect(isUnlocked()).toBe(false);
    expect(await installCandidateMasterKey(candidate, { verifyCandidate: async () => true })).toBe(true);
    vi.advanceTimersByTime(299_999);
    expect(isUnlocked()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(isUnlocked()).toBe(false);
  });

  it('locks on return after sleep before activity can replace an expired deadline', () => {
    setDeviceProtectionPolicy('idle-account', true);
    // Changing wall time does not run queued callbacks, like a suspended tab.
    vi.setSystemTime(Date.now() + 30 * 60_000);
    resetAutoLock();
    expect(isUnlocked()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects stale key access and pending commits even before a suspended timer or focus event runs', () => {
    setDeviceProtectionPolicy('idle-account', true);
    const beforeSleep = getLifecycleToken();
    vi.setSystemTime(Date.now() + 300_000);
    expect(() => getMasterKey()).toThrow('Vault is locked');
    expect(isLifecycleCurrent(beforeSleep)).toBe(false);
  });

  it('restores the configured transparent timeout when device protection is disabled', () => {
    setAutoLockMs(120_000);
    setDeviceProtectionPolicy('idle-account', true);
    vi.advanceTimersByTime(180_000);
    expect(isUnlocked()).toBe(true);
    setDeviceProtectionPolicy('idle-account', false);
    vi.advanceTimersByTime(119_999);
    expect(isUnlocked()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(isUnlocked()).toBe(false);
  });

  it('keeps the default transparent key open and clears another account timer on switch', async () => {
    vi.advanceTimersByTime(600_000);
    expect(isUnlocked()).toBe(true);
    setDeviceProtectionPolicy('idle-account', true);
    vi.advanceTimersByTime(200_000);
    configureAccountContext('transparent-account');
    expect(await installCandidateMasterKey(candidate)).toBe(true);
    vi.advanceTimersByTime(600_000);
    expect(isUnlocked()).toBe(true);
  });

  it('applies the current account policy on unlock and locks a tab after external protection changes', async () => {
    lock();
    localStorage.setItem('pfm_device_protected_idle-account', 'v1');
    expect(await installCandidateMasterKey(candidate)).toBe(true);
    vi.advanceTimersByTime(300_000);
    expect(isUnlocked()).toBe(false);
    expect(await installCandidateMasterKey(candidate)).toBe(true);
    handleAccountSecurityStorageChange('pfm_device_protected_idle-account');
    expect(isUnlocked()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rearms the transparent configuration when another tab removes protection', () => {
    setDeviceProtectionPolicy('idle-account', true);
    setAutoLockMs(45_000);
    localStorage.removeItem('pfm_device_protected_idle-account');
    handleAccountSecurityStorageChange('pfm_device_protected_idle-account');
    vi.advanceTimersByTime(44_999);
    expect(isUnlocked()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(isUnlocked()).toBe(false);
  });
});
