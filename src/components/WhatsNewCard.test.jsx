// @vitest-environment jsdom
//
// A release announcement ('app_news') shows on Today while unread, opens the
// What's new page, and is settled by hiding it or by reading the page.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../lib/logger', () => ({ devError: vi.fn() }));
vi.mock('../lib/supabase', () => {
  const chain = {
    update: () => chain,
    eq: () => chain,
    is: () => chain,
    then: (resolve) => resolve({ data: null, error: null }),
  };
  return { supabase: { from: () => chain, removeChannel: () => {} } };
});

import WhatsNewCard from './WhatsNewCard';
import WhatsNewPage from '../pages/WhatsNewPage';
import useNotificationStore from '../store/notificationStore';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';

const announcement = (extra = {}) => ({
  id: 'n1', recipient_id: 'u1', type: 'app_news', metadata: { version: '1.0.6' },
  created_at: '2026-10-17T08:00:00Z', read_at: null, seen_at: null, ...extra,
});

function renderToday() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<WhatsNewCard lang="fr" />} />
        <Route path="/whats-new" element={<WhatsNewPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

const readAt = () => useNotificationStore.getState().notifications.find((n) => n.id === 'n1')?.read_at;

beforeEach(() => {
  usePrayerStore.setState({ settings: { language: 'fr' } });
  useNotificationStore.setState({ notifications: [announcement()], unreadCount: 1 });
});
afterEach(() => {
  cleanup();
  useNotificationStore.getState().reset();
});

describe('WhatsNewCard', () => {
  it('shows nothing without an unread announcement', () => {
    useNotificationStore.setState({ notifications: [announcement({ read_at: '2026-10-17T09:00:00Z' })], unreadCount: 0 });
    const { container } = renderToday();
    expect(container.innerHTML).toBe('');
  });

  it('names the release and its summary', () => {
    renderToday();
    expect(screen.getByText(t('fr', 'whatsNewVersion', { version: '1.0.6' }))).toBeTruthy();
    expect(screen.getByRole('heading', { name: t('fr', 'whatsNewTitle') })).toBeTruthy();
    expect(screen.getByText(t('fr', 'whatsNew106Summary'))).toBeTruthy();
  });

  it('hiding the card settles the announcement', () => {
    renderToday();
    fireEvent.click(screen.getByRole('button', { name: t('fr', 'close') }));
    expect(readAt()).toBeTruthy();
    expect(screen.queryByText(t('fr', 'whatsNew106Summary'))).toBeNull();
  });

  it("opens the What's new page, which lists the release and settles it", () => {
    renderToday();
    fireEvent.click(screen.getByRole('button', { name: t('fr', 'whatsNewCta') }));
    for (const key of ['whatsNew106SpiritTitle', 'whatsNew106MeetingsTitle', 'whatsNew106ChurchTitle', 'whatsNew106CirclesTitle']) {
      expect(screen.getByRole('heading', { name: t('fr', key) })).toBeTruthy();
    }
    expect(readAt()).toBeTruthy();
  });
});
