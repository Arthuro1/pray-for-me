import { useState, useEffect, useRef } from 'react';
import { Home, BookOpen, Calendar, Settings, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';

const SIDEBAR_FULL = 220;
const SIDEBAR_MINI = 64;
const MD_BREAKPOINT = 768;

export default function Layout({ children, currentTab, onTabChange, onAddPrayer }) {
  const { settings } = usePrayerStore();
  const lang = settings.language || 'en';
  const [collapsed, setCollapsed] = useState(false);
  const [isMd, setIsMd] = useState(() => window.innerWidth >= MD_BREAKPOINT);
  const mainRef = useRef(null);

  const sidebarWidth = collapsed ? SIDEBAR_MINI : SIDEBAR_FULL;

  // Track viewport width
  useEffect(() => {
    const onResize = () => setIsMd(window.innerWidth >= MD_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Sync padding-left on main whenever sidebar or viewport changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.style.paddingLeft = isMd ? `${sidebarWidth}px` : '0px';
    }
  }, [sidebarWidth, isMd]);

  const tabs = [
    { id: 'home', label: t(lang, 'today'), icon: Home },
    { id: 'prayers', label: t(lang, 'prayers'), icon: BookOpen },
    { id: 'plan', label: t(lang, 'plan'), icon: Calendar },
    { id: 'settings', label: t(lang, 'settings'), icon: Settings },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#f7f4ef' }}>

      {/* ── Sidebar (md+) ── */}
      <aside
        className="hidden md:flex flex-col fixed top-0 left-0 h-full z-20 py-6"
        style={{
          width: `${sidebarWidth}px`,
          background: '#fff',
          borderRight: '0.5px solid #ede8f5',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
        }}
      >
        {/* Logo + collapse toggle */}
        <div className="flex items-center justify-between px-4 mb-8" style={{ minHeight: 32 }}>
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-xl shrink-0">🙏</span>
              <span className="font-bold text-sm whitespace-nowrap" style={{ color: '#2d1b5e' }}>Pray For Me</span>
            </div>
          )}
          {collapsed && <span className="text-xl mx-auto">🙏</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="shrink-0 rounded-lg p-1 transition-colors hover:bg-gray-100"
            style={{ color: '#9b8cb0', marginLeft: collapsed ? 0 : 8 }}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 flex-1 px-2">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = currentTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                title={collapsed ? label : undefined}
                className="flex items-center rounded-xl text-sm font-medium transition-all"
                style={{
                  gap: collapsed ? 0 : 12,
                  padding: collapsed ? '10px 0' : '10px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  ...(active
                    ? { background: 'linear-gradient(135deg, #ede8ff, #ddd5ff)', color: '#5a3fa0' }
                    : { color: '#9b8cb0' }),
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                {!collapsed && <span>{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Add button */}
        <div className="px-2 mt-4">
          <button
            onClick={onAddPrayer}
            title={collapsed ? t(lang, 'newPrayer') : undefined}
            className="w-full flex items-center rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
            style={{
              gap: collapsed ? 0 : 10,
              padding: collapsed ? '12px 0' : '12px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)',
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            {!collapsed && <span>{t(lang, 'newPrayer')}</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto pb-24 md:pb-8 w-full"
        style={{
          paddingLeft: isMd ? `${sidebarWidth}px` : '0px',
          transition: 'padding-left 0.2s ease',
        }}
      >
        {children}
      </main>

      {/* ── FAB (mobile only) ── */}
      <button
        onClick={onAddPrayer}
        className="md:hidden fixed z-20 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
        style={{
          bottom: '72px',
          right: '20px',
          width: '52px',
          height: '52px',
          background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)',
        }}
      >
        <Plus size={24} color="white" strokeWidth={2.5} />
      </button>

      {/* ── Bottom nav (mobile only) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex z-10"
        style={{ background: '#fff', borderTop: '0.5px solid #ede8f5' }}
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = currentTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors"
              style={{ color: active ? '#7c5cfc' : '#c5bdd4' }}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-xs" style={{ fontWeight: active ? 600 : 400 }}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
