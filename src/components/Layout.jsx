import { Home, BookOpen, Calendar, Settings, Plus } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';

export default function Layout({ children, currentTab, onTabChange, onAddPrayer }) {
  const { settings } = usePrayerStore();
  const lang = settings.language || 'fr';

  const tabs = [
    { id: 'home', label: t(lang, 'today'), icon: Home },
    { id: 'prayers', label: t(lang, 'prayers'), icon: BookOpen },
    { id: 'plan', label: t(lang, 'plan'), icon: Calendar },
    { id: 'settings', label: t(lang, 'settings'), icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto relative" style={{ background: '#f7f4ef' }}>
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* FAB */}
      <button
        onClick={onAddPrayer}
        className="fixed z-20 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
        style={{
          bottom: '72px',
          left: '50%',
          transform: 'translateX(calc(-50% + 200px))',
          width: '52px',
          height: '52px',
          background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)',
        }}
        title="Ajouter une prière"
      >
        <Plus size={24} color="white" strokeWidth={2.5} />
      </button>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg flex z-10"
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
