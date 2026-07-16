// @vitest-environment jsdom
//
// The primary nav labels the /prayers destination "Journal" (all requests +
// history), not "Prayers" — the route/id are unchanged, only the label. Only the
// French locale is loaded in unit tests, so t() resolves to the French strings.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// NotificationBell subscribes to realtime on mount; stub it so the nav renders
// in isolation.
vi.mock('../NotificationBell', () => ({ default: () => null }));

import Layout from '../Layout';
import usePrayerStore from '../../store/prayerStore';
import useCommunityStore from '../../store/communityStore';
import useLayoutStore from '../../store/layoutStore';
import { t } from '../../i18n';

const lang = 'fr';
afterEach(cleanup);
beforeEach(() => {
  usePrayerStore.setState({ settings: { language: lang } });
  useCommunityStore.setState({ pendingCount: 0 });
  useLayoutStore.setState({ fabSuppressed: false });
});

const renderNav = () =>
  render(
    <MemoryRouter>
      <Layout onAddPrayer={() => {}}>content</Layout>
    </MemoryRouter>
  );

describe('Layout — primary navigation', () => {
  it('labels the /prayers tab "Journal", not "Prayers"', () => {
    renderNav();
    // Rendered in both the sidebar and the mobile bottom bar.
    expect(screen.getAllByText(t(lang, 'journal')).length).toBeGreaterThan(0);
    expect(screen.queryByText(t(lang, 'prayers'))).toBeNull();
  });

  it('renders the four primary tabs (Today · Journal · Community · More)', () => {
    renderNav();
    for (const key of ['today', 'journal', 'community', 'moreTab']) {
      expect(screen.getAllByText(t(lang, key)).length).toBeGreaterThan(0);
    }
    // Grow and Settings moved inside More — off the prime navigation.
    expect(screen.queryByText(t(lang, 'grow'))).toBeNull();
    expect(screen.queryByText(t(lang, 'settings'))).toBeNull();
  });
});

describe('Layout — floating Add button suppression', () => {
  it('shows the FAB by default', () => {
    renderNav();
    expect(screen.getAllByRole('button', { name: t(lang, 'tipAddPrayer') }).length).toBeGreaterThan(0);
  });

  it('hides the FAB while a page declares its own prominent Add CTA', () => {
    useLayoutStore.setState({ fabSuppressed: true });
    renderNav();
    // Only the sidebar "New prayer" button remains; the mobile FAB
    // (aria-label = tipAddPrayer) is gone.
    expect(screen.queryByRole('button', { name: t(lang, 'tipAddPrayer') })).toBeNull();
  });
});
