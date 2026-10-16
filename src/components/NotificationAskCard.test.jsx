// @vitest-environment jsdom
//
// Notifications are on by default: Today asks a device that never answered,
// once. Turning on enables the daily reminder and this device's push; saying
// no or hiding the card settles it for good on this device.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

const push = vi.hoisted(() => ({
  enablePush: vi.fn(),
  updatePushPrefs: vi.fn(async () => {}),
}));
const prefs = vi.hoisted(() => ({ isEventPushEnabled: vi.fn() }));

vi.mock('../lib/supabase', () => ({ supabase: { from: () => ({}) } }));
vi.mock('../lib/analytics', async (importOriginal) => ({ ...(await importOriginal()), track: vi.fn() }));
vi.mock('../push', async (importOriginal) => ({
  ...(await importOriginal()),
  pushAvailable: () => true,
  enablePush: push.enablePush,
  updatePushPrefs: push.updatePushPrefs,
}));
vi.mock('../lib/notificationPrefs', async (importOriginal) => ({
  ...(await importOriginal()),
  isEventPushEnabled: prefs.isEventPushEnabled,
}));

import NotificationAskCard from './NotificationAskCard';
import useNotificationAsk from '../hooks/useNotificationAsk';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import { NOTIFICATION_ASK_DISMISSED_KEY, canAskForNotifications } from '../lib/notificationAsk';
import { ACTIVATION_STEPS, readActivationProgress } from '../lib/activationProgress';
import { t } from '../i18n';

function Today() {
  const ask = useNotificationAsk();
  return ask.visible
    ? <NotificationAskCard lang="fr" busy={ask.busy} onTurnOn={ask.turnOn} onDismiss={ask.dismiss} />
    : <p>no card</p>;
}

const title = () => screen.queryByRole('heading', { name: t('fr', 'notifyAskTitle') });
const setPermission = (permission) => { globalThis.Notification = { permission }; };

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  setPermission('default');
  prefs.isEventPushEnabled.mockResolvedValue(true);
  push.enablePush.mockReset();
  usePrayerStore.setState((s) => ({ settings: { ...s.settings, language: 'fr', dailyReminderEnabled: false, dailyReminderTime: '07:00' } }));
  useAuthStore.setState({ user: { id: 'u1' } });
});
afterEach(() => {
  cleanup();
  delete globalThis.Notification;
});

describe('canAskForNotifications', () => {
  it('asks only a device that has never answered and has not hidden the card', () => {
    expect(canAskForNotifications()).toBe(true);
    setPermission('granted');
    expect(canAskForNotifications()).toBe(false);
    setPermission('denied');
    expect(canAskForNotifications()).toBe(false);
    setPermission('default');
    localStorage.setItem(NOTIFICATION_ASK_DISMISSED_KEY, '1');
    expect(canAskForNotifications()).toBe(false);
  });
});

describe('NotificationAskCard on Today', () => {
  it('asks a device that never answered', async () => {
    render(<Today />);
    expect(await screen.findByRole('heading', { name: t('fr', 'notifyAskTitle') })).toBeTruthy();
    expect(screen.getByText(t('fr', 'notifyAskBody'))).toBeTruthy();
  });

  it('never asks someone who switched push off in Settings', async () => {
    prefs.isEventPushEnabled.mockResolvedValue(false);
    render(<Today />);
    await waitFor(() => expect(prefs.isEventPushEnabled).toHaveBeenCalledWith('u1'));
    expect(title()).toBeNull();
  });

  it('turning on enables the daily reminder and this device, then settles', async () => {
    push.enablePush.mockResolvedValue({});
    render(<Today />);
    fireEvent.click(await screen.findByRole('button', { name: t('fr', 'notifyAskCta') }));
    await waitFor(() => expect(title()).toBeNull());
    expect(push.enablePush).toHaveBeenCalledWith('u1', expect.objectContaining({ enabled: true, reminderTime: '07:00', lang: 'fr' }));
    expect(usePrayerStore.getState().settings.dailyReminderEnabled).toBe(true);
    expect(readActivationProgress().handled).toContain(ACTIVATION_STEPS.REMINDER);
  });

  it('a refusal at the system prompt leaves the reminder off and settles', async () => {
    push.enablePush.mockResolvedValue({ error: 'denied' });
    render(<Today />);
    fireEvent.click(await screen.findByRole('button', { name: t('fr', 'notifyAskCta') }));
    await waitFor(() => expect(title()).toBeNull());
    expect(usePrayerStore.getState().settings.dailyReminderEnabled).toBe(false);
  });

  it('hiding the card asks nothing and is remembered on this device', async () => {
    render(<Today />);
    fireEvent.click(await screen.findByRole('button', { name: t('fr', 'close') }));
    expect(title()).toBeNull();
    expect(push.enablePush).not.toHaveBeenCalled();
    expect(localStorage.getItem(NOTIFICATION_ASK_DISMISSED_KEY)).toBe('1');
    expect(canAskForNotifications()).toBe(false);
  });
});
