// @vitest-environment jsdom
//
// The "App news" switch: off writes a type row that stops release
// announcements; on removes it, so they follow the in-app and push switches.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

const prefs = vi.hoisted(() => ({
  fetchNotificationPrefs: vi.fn(),
  savePref: vi.fn(async () => ({ error: null })),
  clearPref: vi.fn(async () => ({ error: null })),
  currentTimezone: () => 'Europe/Paris',
}));
vi.mock('../lib/notificationPrefs', () => prefs);
vi.mock('../push', () => ({ subscribeDeviceForPush: vi.fn(async () => ({})) }));
vi.mock('../lib/supabase', () => ({ supabase: {} }));

import NotificationPreferences from './NotificationPreferences';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import { t } from '../i18n';

const appNewsSwitch = () => screen.findByRole('switch', { name: t('fr', 'notifAppNewsSetting') });

beforeEach(() => {
  usePrayerStore.setState({ settings: { language: 'fr' } });
  useAuthStore.setState({ user: { id: 'u1' } });
  prefs.savePref.mockClear();
  prefs.clearPref.mockClear();
});
afterEach(cleanup);

describe('NotificationPreferences — app news', () => {
  it('is on by default, and switching it off stops announcements', async () => {
    prefs.fetchNotificationPrefs.mockResolvedValue({});
    render(<NotificationPreferences />);
    const toggle = await appNewsSwitch();
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    fireEvent.click(toggle);
    await waitFor(() => expect(prefs.savePref).toHaveBeenCalledWith('u1', 'app_news', { delivery_mode: 'off' }));
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(prefs.clearPref).not.toHaveBeenCalled();
  });

  it('switching it back on removes the row instead of overriding the account switches', async () => {
    prefs.fetchNotificationPrefs.mockResolvedValue({ app_news: { delivery_mode: 'off' } });
    render(<NotificationPreferences />);
    const toggle = await appNewsSwitch();
    expect(toggle.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(toggle);
    await waitFor(() => expect(prefs.clearPref).toHaveBeenCalledWith('u1', 'app_news'));
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(prefs.savePref).not.toHaveBeenCalled();
  });
});
