import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, BookOpen, Plus, ChevronLeft, ChevronRight, Users, MoreHorizontal, Route } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useCommunityStore from '../store/communityStore';
import useLayoutStore from '../store/layoutStore';
import NotificationBell from './NotificationBell';
import { t } from '../i18n';
import { APP_NAME } from '../lib/brand';

import { BrandLockup, BrandMark } from './shared/Brand';
// A small count badge. The number itself is announced through the destination's
// aria-label (e.g. "Community, 3 pending"), so the visual pill is aria-hidden to
// avoid a screen reader reading the digits twice. Royal purple, not an alarm
// red: an ordinary count is an invitation to return, not an emergency.
function Badge({ count, className = '', style = {} }) {
  if (!count) return null;
  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center text-[10px] font-bold rounded-full ${className}`}
      style={{ minWidth: 18, height: 18, padding: '0 5px', background: 'var(--q-action-primary)', color: 'var(--q-on-action)', ...style }}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

const SIDEBAR_FULL = 220;
const SIDEBAR_MINI = 64;
const MD_BREAKPOINT = 768;
// Usable height of one bottom-nav destination (also the minimum tap target).
// Shared with the FAB and the main content's bottom padding so a single number
// governs how much room the mobile navigation reserves.
const BOTTOM_NAV_H = 56;

export default function Layout({ children, onAddPrayer }) {
  const settings = usePrayerStore((s) => s.settings);
  const pendingCount = useCommunityStore((s) => s.pendingCount);
  const fabSuppressed = useLayoutStore((s) => s.fabSuppressed);
  const lang = settings.language || 'en';
  const { pathname } = useLocation();
  const isJournalRoute = pathname === '/prayers';
  const isPersonalPrayerDetailRoute = /^\/prayers\/[^/]+/.test(pathname);
  const isPrayerDetailRoute = isPersonalPrayerDetailRoute
    || /^\/community\/group\/[^/]+\/prayer\/[^/]+/.test(pathname);
  const isCommunityRoute = pathname.startsWith('/community');
  const hasOwnMobileHeader = isJournalRoute || isPrayerDetailRoute || isCommunityRoute;
  const routeName = isPrayerDetailRoute
    ? 'detail'
    : isJournalRoute
      ? 'journal'
      : isCommunityRoute
        ? 'community'
        : pathname === '/'
          ? 'home'
          : pathname.split('/').filter(Boolean)[0] || 'home';
  const showBottomNav = !isPersonalPrayerDetailRoute;
  const [collapsed, setCollapsed] = useState(false);
  const [isMd, setIsMd] = useState(() => window.innerWidth >= MD_BREAKPOINT);
  const mainRef = useRef(null);

  const sidebarWidth = collapsed ? SIDEBAR_MINI : SIDEBAR_FULL;

  useEffect(() => {
    const onResize = () => setIsMd(window.innerWidth >= MD_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.style.paddingInlineStart = isMd ? `${sidebarWidth}px` : '0px';
    }
  }, [sidebarWidth, isMd]);

  // Five destinations, with the daily prayer rhythm front-and-centre: Today,
  // Journal, Plans, Together and More. Prayer plans earned a place of their own
  // once they became a main way the app guides prayer — reached through More
  // they sat four taps deep. Guidance, Calendar, Settings, data export and
  // support live inside More. `state.source` tells the Plans page it was
  // opened from the navigation (lib/planAnalytics.js).
  const tabs = [
    { id: 'home', path: '/', label: t(lang, 'today'), icon: Home },
    // Label reads "Journal" (all requests + history); route/id stay `prayers`.
    { id: 'prayers', path: '/prayers', label: t(lang, 'journal'), icon: BookOpen },
    { id: 'plans', path: '/plans', label: t(lang, 'navPlans'), icon: Route, state: { source: 'tab' } },
    { id: 'community', path: '/community', label: t(lang, 'together'), icon: Users, badge: pendingCount },
    { id: 'more', path: '/more', label: t(lang, 'moreTab'), icon: MoreHorizontal },
  ];

  // Destinations reached THROUGH More keep the More tab lit, so the user always
  // knows the way back to them.
  const MORE_PATHS = ['/more', '/guidance', '/calendar', '/grow', '/plan', '/settings', '/notifications', '/about'];
  // A route and everything nested under it — segment-wise, so the old `/plan`
  // (now Calendar) never claims `/plans`.
  const within = (base) => pathname === base || pathname.startsWith(`${base}/`);
  const isActive = (path) => {
    if (path === '/') return pathname === '/';
    if (path === '/more') return MORE_PATHS.some(within);
    // Nested routes keep their tab lit: Community's group and prayer pages,
    // and a shared plan's page under Plans.
    return within(path);
  };

  // A destination's accessible name. When it carries pending items we fold the
  // count into the name ("Community, 3 pending") so a screen reader announces it
  // once, in the reader's language; otherwise the visible label is the name.
  const navLabel = (label, badge) =>
    badge ? `${label}, ${t(lang, 'navPending', { count: badge })}` : undefined;

  return (
    <div
      className={`layout-shell layout-shell--${routeName} min-h-screen flex`}
      style={{ background: 'transparent' }}
    >

      {/* ── Sidebar (md+) ── */}
      <aside
        className="app-sidebar hidden md:flex flex-col fixed top-0 h-full z-20 py-6"
        style={{
          width: `${sidebarWidth}px`,
          insetInlineStart: 0,
          borderInlineEnd: '1px solid var(--q-border)',
          overflow: 'hidden',
          transition: 'width var(--q-motion-standard) var(--q-ease)',
        }}
      >
        <div className="flex items-center justify-between px-4 mb-8" style={{ minHeight: 32 }}>
          {!collapsed && <BrandLockup size={30} className="overflow-hidden" />}
          {collapsed && <BrandMark size={30} title={APP_NAME} className="mx-auto" />}
          <div className="flex items-center gap-1 shrink-0">
            {!collapsed && <NotificationBell className="w-8 h-8" style={{ color: 'var(--q-text-tertiary)' }} />}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="pressable flex h-11 w-11 items-center justify-center rounded-full transition-colors"
              style={{ color: 'var(--q-text-tertiary)', marginLeft: collapsed ? 0 : 4 }}
              title={collapsed ? t(lang, "tipExpandSidebar") : t(lang, "tipCollapseSidebar")}
            >
              {collapsed ? <ChevronRight className="rtl-mirror" size={16} /> : <ChevronLeft className="rtl-mirror" size={16} />}
            </button>
          </div>
        </div>

        {/* Collapsed sidebar still needs the inbox: render the bell on its own
            centered row so a collapsed power-user never loses access to it. */}
        {collapsed && (
          <div className="flex justify-center mb-3">
            <NotificationBell className="w-9 h-9" style={{ color: 'var(--q-text-tertiary)' }} />
          </div>
        )}

        <nav className="flex flex-col gap-1 flex-1 px-2" aria-label={t(lang, 'primaryNav')}>
          {tabs.map(({ id, path, label, icon: Icon, badge, state }) => {
            const active = isActive(path);
            return (
              <Link
                key={id}
                to={path}
                state={state}
                aria-current={active ? 'page' : undefined}
                aria-label={navLabel(label, badge)}
                title={collapsed ? label : undefined}
                className="app-nav-item pressable relative flex min-h-11 items-center rounded-control text-sm no-underline"
                style={{
                  gap: collapsed ? 0 : 12,
                  padding: collapsed ? '10px 0' : '10px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: active ? 'var(--q-royal-text)' : 'var(--q-text-secondary)',
                  fontWeight: active ? 650 : 500,
                }}
              >
                {/* Active: purple text and a 2px gold line — never a filled card. */}
                {active && <span aria-hidden="true" className="app-nav-item__mark" />}
                <span className="relative flex items-center">
                  <Icon size={18} strokeWidth={active ? 2.1 : 1.8} aria-hidden="true" />
                  {collapsed && <Badge count={badge} className="absolute" style={{ top: -8, insetInlineEnd: -8 }} />}
                </span>
                {!collapsed && <span>{label}</span>}
                {!collapsed && <Badge count={badge} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 mt-4">
          <button
            onClick={onAddPrayer}
            title={t(lang, "tipAddPrayer")}
            className="primary-button pressable w-full"
            style={{
              gap: collapsed ? 0 : 10,
              padding: collapsed ? '12px 0' : '12px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <Plus size={18} strokeWidth={2.1} aria-hidden="true" />
            {!collapsed && <span>{t(lang, 'newPrayer')}</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar (holds the notification bell; no sidebar on mobile) ──
          In an installed (standalone) PWA the OS status bar can sit over the
          top edge, so pad the bar down by the top safe-area inset — 0 on a
          normal browser tab, the notch/status-bar height when installed. */}
      {!hasOwnMobileHeader && (
        <header
          className="app-mobile-bar md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4"
          style={{
            height: 'calc(3rem + env(safe-area-inset-top))',
            paddingTop: 'env(safe-area-inset-top)',
            borderBottom: '1px solid var(--q-border)',
          }}
        >
          <BrandLockup size={28} />
          <NotificationBell className="w-9 h-9" style={{ color: 'var(--q-text-secondary)' }} />
        </header>
      )}

      {/* ── Main content ──
          Top padding clears the mobile bar (incl. its top safe-area inset);
          bottom padding clears the bottom nav, the FAB and the bottom safe-area
          inset, so the last card is never hidden behind them. */}
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto w-full"
        style={{
          paddingInlineStart: isMd ? `${sidebarWidth}px` : '0px',
          paddingTop: isMd ? 0 : hasOwnMobileHeader ? 'env(safe-area-inset-top)' : 'calc(3rem + env(safe-area-inset-top))',
          paddingBottom: isMd
            ? '2rem'
            : showBottomNav
              ? `calc(${BOTTOM_NAV_H + 20}px + env(safe-area-inset-bottom))`
              : 'env(safe-area-inset-bottom)',
          transition: 'padding-inline-start var(--q-motion-standard) var(--q-ease)',
        }}
      >
        {children}
      </main>

      {/* ── FAB (mobile only) ── Pages showing their own prominent Add CTA
          (empty Today / empty Journal) suppress it via useSuppressFab, so only
          one Add action is prominent per viewport. */}
      {!fabSuppressed && pathname === '/' && (
        <button
          onClick={onAddPrayer}
          title={t(lang, "tipAddPrayer")}
          aria-label={t(lang, "tipAddPrayer")}
          className="app-add-button pressable md:hidden fixed z-20 flex items-center justify-center"
          style={{
            // Float clear of the nav bar AND the bottom safe-area inset.
            // insetInlineEnd (not right) mirrors the FAB to the left in RTL.
            bottom: `calc(${BOTTOM_NAV_H + 16}px + env(safe-area-inset-bottom))`,
            insetInlineEnd: '20px',
          }}
        >
          <Plus size={24} strokeWidth={2} aria-hidden="true" />
        </button>
      )}

      {/* ── Bottom nav (mobile only) ──
          paddingBottom = the bottom safe-area inset, so the surface fills down
          to the very edge while the tappable row sits above the home indicator.
          Flat and native: a solid canvas and one hairline separate it from the
          content scrolling underneath — no floating container, no shadow. */}
      {showBottomNav && (
        <nav
          className="app-bottom-nav md:hidden fixed bottom-0 left-0 right-0 flex z-10"
          aria-label={t(lang, 'primaryNav')}
          style={{
            borderTop: '1px solid var(--q-border)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {tabs.map(({ id, path, label, icon: Icon, badge, state }) => {
            const active = isActive(path);
            return (
              <Link
                key={id}
                to={path}
                state={state}
                aria-current={active ? 'page' : undefined}
                aria-label={navLabel(label, badge)}
                className="pressable flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 no-underline transition-colors"
                style={{ minHeight: BOTTOM_NAV_H, color: active ? 'var(--q-royal-text)' : 'var(--q-text-tertiary)' }}
              >
                <span className="relative flex h-7 w-10 items-center justify-center">
                  <Icon size={22} strokeWidth={active ? 2.1 : 1.75} aria-hidden="true" />
                  <Badge count={badge} className="absolute" style={{ top: -2, insetInlineEnd: 2 }} />
                </span>
                <span
                  className="truncate max-w-full text-center px-0.5"
                  style={{ fontSize: 11, lineHeight: 1.1, fontWeight: active ? 600 : 400 }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
