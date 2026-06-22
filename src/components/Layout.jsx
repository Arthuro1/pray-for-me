import { Home, BookOpen, Calendar, Settings, Plus } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';

export default function Layout({ children, currentTab, onTabChange, onAddPrayer }) {
  const { settings } = usePrayerStore();
  const lang = settings.language || 'en';

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
        className="hidden md:flex flex-col fixed top-0 left-0 h-full z-20 py-8 px-4"
        style={{ width: '220px', background: '#fff', borderRight: '0.5px solid #ede8f5' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 mb-10">
          <span className="text-2xl">🙏</span>
          <span className="font-bold text-base" style={{ color: '#2d1b5e' }}>Pray For Me</span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 flex-1">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = currentTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                style={active
                  ? { background: 'linear-gradient(135deg, #ede8ff, #ddd5ff)', color: '#5a3fa0' }
                  : { color: '#9b8cb0' }}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Add button in sidebar */}
        <button
          onClick={onAddPrayer}
          className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)' }}
        >
          <Plus size={18} strokeWidth={2.5} />
          {t(lang, 'newPrayer')}
        </button>
      </aside>

      {/* ── Main content ── */}
      <div
        className="flex-1 flex flex-col min-h-screen"
        style={{ marginLeft: 0 }}
      >
        {/* Offset for sidebar on md+ */}
        <style>{`@media (min-width: 768px) { .main-offset { margin-left: 220px; } }`}</style>
        <main className="main-offset flex-1 overflow-y-auto pb-24 md:pb-8 max-w-3xl w-full mx-auto">
          {children}
        </main>
      </div>

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
        title="Ajouter une prière"
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
