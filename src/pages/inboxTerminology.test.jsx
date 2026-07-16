// @vitest-environment jsdom
//
// One unambiguous inbox: the bell is the single way in and is named "Inbox";
// More has NO Notifications row (Grow / Plan / Settings / data / support only),
// and the reminder settings section is titled "Prayer reminders".
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import MoreTab from './MoreTab';
import NotificationBell from '../components/NotificationBell';
import usePrayerStore from '../store/prayerStore';
import useNotificationStore from '../store/notificationStore';
import { t } from '../i18n';

const lang = 'fr';
afterEach(cleanup);
beforeEach(() => {
  usePrayerStore.setState({ settings: { language: lang } });
});

describe('More — no duplicate notifications destination', () => {
  it('lists Grow, Plan and Settings but no Notifications row', () => {
    render(<MemoryRouter><MoreTab /></MemoryRouter>);
    expect(screen.getByText(t(lang, 'grow'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'plan'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'settings'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'notifications'))).toBeNull();
    expect(screen.queryByText(t(lang, 'inbox'))).toBeNull();
  });
});

describe('NotificationBell — named Inbox', () => {
  it('labels the bell "Inbox" (with the unread variant when applicable)', () => {
    useNotificationStore.setState({ unreadCount: 0 });
    render(<MemoryRouter><NotificationBell /></MemoryRouter>);
    expect(screen.getByRole('button', { name: t(lang, 'inbox') })).toBeTruthy();
    cleanup();
    useNotificationStore.setState({ unreadCount: 3 });
    render(<MemoryRouter><NotificationBell /></MemoryRouter>);
    expect(screen.getByRole('button', { name: t(lang, 'notifUnreadLabel', { n: 3 }) })).toBeTruthy();
  });
});
