// @vitest-environment jsdom
//
// The primary nav labels the /prayers destination "Journal" (all requests +
// history), not "Prayers" — the route/id are unchanged, only the label. Only the
// French locale is loaded in unit tests, so t() resolves to the French strings.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
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

const renderNav = (route = '/', l = lang) => {
  usePrayerStore.setState({ settings: { language: l } });
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Layout onAddPrayer={() => {}}>content</Layout>
    </MemoryRouter>
  );
};

// The mobile bottom bar is the <nav> carrying the responsive `md:hidden` class;
// the desktop sidebar nav does not. Scoping queries to it lets us assert on the
// mobile destinations without the sidebar's duplicate copies interfering.
const bottomNav = (container) => container.querySelector('nav[class*="md:hidden"]');

describe('Layout — primary navigation', () => {
  it('labels the /prayers tab "Journal", not "Prayers"', () => {
    renderNav();
    // Rendered in both the sidebar and the mobile bottom bar.
    expect(screen.getAllByText(t(lang, 'journal')).length).toBeGreaterThan(0);
    expect(screen.queryByText(t(lang, 'prayers'))).toBeNull();
  });

  it('renders exactly four primary destinations (Today · Journal · Together · More)', () => {
    const { container } = renderNav();
    const links = within(bottomNav(container)).getAllByRole('link');
    expect(links).toHaveLength(4);
    for (const key of ['today', 'journal', 'together', 'moreTab']) {
      expect(within(bottomNav(container)).getByText(t(lang, key))).toBeTruthy();
    }
    // Grow and Settings moved inside More — off the prime navigation.
    expect(screen.queryByText(t(lang, 'grow'))).toBeNull();
    expect(screen.queryByText(t(lang, 'settings'))).toBeNull();
  });

  it('exposes the mobile destinations as semantic links, not buttons', () => {
    const { container } = renderNav();
    const today = within(bottomNav(container)).getByText(t(lang, 'today')).closest('a');
    expect(today).toBeTruthy();
    expect(today.getAttribute('href')).toBe('/');
  });

  it('names both navigation regions accessibly', () => {
    renderNav();
    // One landmark per responsive variant (sidebar + bottom bar), same name.
    expect(screen.getAllByRole('navigation', { name: t(lang, 'primaryNav') }).length).toBeGreaterThan(0);
  });
});

describe('Layout — active destination & aria-current', () => {
  const currentPage = (container, key) =>
    within(bottomNav(container)).getByText(t(lang, key)).closest('a').getAttribute('aria-current');

  it('marks Today active on "/" and nothing else', () => {
    const { container } = renderNav('/');
    expect(currentPage(container, 'today')).toBe('page');
    expect(currentPage(container, 'journal')).toBeNull();
    expect(currentPage(container, 'together')).toBeNull();
    expect(currentPage(container, 'moreTab')).toBeNull();
  });

  it('marks Journal active on /prayers', () => {
    const { container } = renderNav('/prayers');
    expect(currentPage(container, 'journal')).toBe('page');
    expect(currentPage(container, 'today')).toBeNull();
  });

  it('keeps More active on every descendant route reached through it', () => {
    for (const route of ['/more', '/guidance', '/calendar', '/grow', '/plan', '/settings', '/notifications']) {
      const { container } = renderNav(route);
      expect(currentPage(container, 'moreTab')).toBe('page');
      // Today must NOT also light up on those routes.
      expect(currentPage(container, 'today')).toBeNull();
      cleanup();
    }
  });

  it('keeps Community active on nested group and prayer routes', () => {
    for (const route of ['/community', '/community/group/g1', '/community/group/g1/prayer/p1']) {
      const { container } = renderNav(route);
      expect(currentPage(container, 'together')).toBe('page');
      cleanup();
    }
  });
});

describe('Layout — community pending badge', () => {
  it('shows no badge when there is nothing pending', () => {
    useCommunityStore.setState({ pendingCount: 0 });
    const { container } = renderNav('/');
    const community = within(bottomNav(container)).getByText(t(lang, 'together')).closest('a');
    // No count folded into the name, and no visible badge digits.
    expect(community.getAttribute('aria-label')).toBeNull();
    expect(within(community).queryByText(/\d/)).toBeNull();
  });

  it('announces the pending count in the destination name and shows the pill', () => {
    useCommunityStore.setState({ pendingCount: 3 });
    const { container } = renderNav('/');
    const community = within(bottomNav(container)).getByText(t(lang, 'together')).closest('a');
    // The count rides in the accessible name…
    expect(community.getAttribute('aria-label')).toBe(`${t(lang, 'together')}, ${t(lang, 'navPending', { count: 3 })}`);
    // …while the visual pill is present but hidden from the a11y tree (no double read).
    const pill = within(community).getByText('3');
    expect(pill.getAttribute('aria-hidden')).toBe('true');
  });

  it('caps the visible badge at 9+ but still announces the real count', () => {
    useCommunityStore.setState({ pendingCount: 12 });
    const { container } = renderNav('/');
    const community = within(bottomNav(container)).getByText(t(lang, 'together')).closest('a');
    expect(within(community).getByText('9+')).toBeTruthy();
    expect(community.getAttribute('aria-label')).toContain('12');
  });
});

describe('Layout — floating Add button', () => {
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

  it('positions the FAB clear of the bottom nav and the safe-area inset', () => {
    renderNav();
    const fab = screen.getByRole('button', { name: t(lang, 'tipAddPrayer') });
    // Its offset is computed above the nav bar AND the home-indicator inset.
    expect(fab.style.bottom).toContain('safe-area-inset-bottom');
    expect(fab.style.bottom).toContain('72'); // 56px nav + 16px gap
  });
});

// jsdom's CSS parser keeps env()/var() only inside calc() or in properties it
// doesn't specifically validate (box-shadow), and its default viewport is
// desktop-width — so these force the mobile branch and assert on values it
// preserves. The nav's own bottom inset padding is verified visually in-browser.
describe('Layout — safe-area & separation', () => {
  it('lifts the bottom nav off scrolling content with a soft shadow', () => {
    const { container } = renderNav();
    const nav = bottomNav(container);
    expect(nav.style.boxShadow).toContain('var(--nav-shadow)');
  });

  it('pads the main content clear of the nav and the bottom inset on mobile', () => {
    const original = window.innerWidth;
    window.innerWidth = 375; // force the mobile layout branch (default jsdom is 1024)
    try {
      const { container } = renderNav();
      const main = container.querySelector('main');
      expect(main.style.paddingBottom).toContain('safe-area-inset-bottom');
    } finally {
      window.innerWidth = original;
    }
  });
});

// Only the French locale is bundled in unit tests, so a `de`/`ar` render still
// resolves its strings through the French fallback. What these guard is the
// language-independent machinery that keeps ANY long label on one line and lets
// an RTL locale render, exercised through those language codes.
describe('Layout — long localized labels & RTL', () => {
  it('guards every label against wrapping (truncate + a min-w-0 cell)', () => {
    const { container } = renderNav('/', 'de');
    const community = within(bottomNav(container)).getByText(t('de', 'together'));
    expect(community.className).toMatch(/truncate/);
    expect(community.closest('a').className).toMatch(/min-w-0/);
  });

  it('renders all four destinations under a right-to-left locale (Arabic)', () => {
    const { container } = renderNav('/', 'ar');
    const links = within(bottomNav(container)).getAllByRole('link');
    expect(links).toHaveLength(4);
    expect(within(bottomNav(container)).getByText(t('ar', 'together'))).toBeTruthy();
    // Direction is owned by <html dir>, never duplicated onto the nav itself —
    // the nav relies on logical CSS (insetInlineEnd) to mirror instead.
    expect(container.querySelector('[dir]')).toBeNull();
  });
});
