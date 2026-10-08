// The original auth header was absolutely positioned and could sit behind the
// form. Verify real layout with long German copy, RTL, and short phone screens.
// These fixtures make no auth or network requests.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '../index.css';

const locale = vi.hoisted(() => ({ value: 'de' }));
vi.mock('../store/prayerStore', () => ({
  default: (selector) => selector({ settings: { language: locale.value } }),
}));
vi.mock('../store/authStore', () => ({
  default: () => ({
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    signInWithEmailLink: vi.fn(),
    resetPassword: vi.fn(),
    resendConfirmation: vi.fn(),
  }),
}));

import AuthPage from './AuthPage';
import { loadLocale, t } from '../i18n';

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('dir');
  document.documentElement.removeAttribute('lang');
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.removeProperty('font-size');
});

describe('AuthPage responsive layout', () => {
  it.each([
    ['de', 1440, 900, 'login', 'light'],
    ['de', 808, 812, 'login', 'light'],
    ['de', 390, 844, 'login', 'light'],
    ['de', 320, 568, 'login', 'dark'],
    ['de', 390, 568, 'register', 'light'],
    ['ar', 360, 640, 'login', 'dark'],
  ])('keeps the brand and %s form apart at %ix%i (%s, %s)', async (lang, width, height, mode, theme) => {
    await page.viewport(width, height);
    await loadLocale(lang);
    locale.value = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dataset.theme = theme;
    render(<AuthPage onBack={() => {}} />);
    if (mode === 'register') fireEvent.click(screen.getByRole('button', { name: t(lang, 'authSignUp') }));
    await document.fonts.ready;

    const brand = document.querySelector('.auth-brand').getBoundingClientRect();
    const sheet = document.querySelector('.auth-sheet').getBoundingClientRect();
    const privacy = document.querySelector('.auth-privacy').getBoundingClientRect();
    expect(brand.bottom).toBeLessThanOrEqual(sheet.top - 16);
    expect(sheet.bottom).toBeLessThanOrEqual(privacy.top - 16);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    for (const input of document.querySelectorAll('input')) {
      const bounds = input.getBoundingClientRect();
      expect(bounds.left).toBeGreaterThanOrEqual(sheet.left);
      expect(bounds.right).toBeLessThanOrEqual(sheet.right);
    }
    if (lang === 'de' && (width === 1440 || width === 390) && mode === 'login') {
      await page.screenshot({
        path: `../../design-qa/login-${width === 1440 ? 'desktop' : 'mobile'}.png`,
        element: document.querySelector('.auth-experience'),
      });
    }
  });

  it('lets the longer form grow naturally with enlarged text', async () => {
    await page.viewport(390, 640);
    await loadLocale('de');
    locale.value = 'de';
    document.documentElement.lang = 'de';
    document.documentElement.style.fontSize = '150%';
    render(<AuthPage onBack={() => {}} intent="join-plan" />);
    await document.fonts.ready;
    const brand = document.querySelector('.auth-brand').getBoundingClientRect();
    const sheet = document.querySelector('.auth-sheet').getBoundingClientRect();
    expect(brand.bottom).toBeLessThanOrEqual(sheet.top - 16);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    expect(screen.getByRole('button', { name: t('de', 'authCreateAccount') })).toBeTruthy();
  });
});
