// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, normalizeTheme, resolveTheme } from './theme';

// A stand-in for the device's light/dark setting that can be switched.
function mockDevice(dark) {
  const listeners = new Set();
  const query = {
    get matches() { return dark; },
    addEventListener: (_, fn) => listeners.add(fn),
    removeEventListener: (_, fn) => listeners.delete(fn),
  };
  window.matchMedia = vi.fn(() => query);
  return { switchTo(next) { dark = next; listeners.forEach((fn) => fn()); }, listeners };
}

afterEach(() => { delete window.matchMedia; document.documentElement.removeAttribute('data-theme'); });

describe('theme preference', () => {
  it('keeps Automatic, folds Night into Dark and anything else into Light', () => {
    expect(normalizeTheme('system')).toBe('system');
    expect(normalizeTheme('night')).toBe('dark');
    expect(normalizeTheme(null)).toBe('light');
  });

  it('draws Automatic as whatever the device prefers, and follows it as it changes', () => {
    const device = mockDevice(true);
    expect(resolveTheme('system')).toBe('dark');
    applyTheme('system');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    device.switchTo(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('stops following the device once an explicit choice is made', () => {
    const device = mockDevice(false);
    applyTheme('system');
    applyTheme('dark');
    expect(device.listeners.size).toBe(0);
    device.switchTo(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
