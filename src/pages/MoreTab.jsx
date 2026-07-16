import { useNavigate } from 'react-router-dom';
import { Sprout, CalendarDays, Settings, Download, Heart, ChevronRight } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';

// Everything that matters but isn't daily: Grow, planning, settings, data and
// support live here so the bottom navigation stays about Today / Journal /
// Community. Each row is a plain destination — no state, no logic. The inbox is
// NOT duplicated here: the bell in the header is its one way in.
export default function MoreTab() {
  const navigate = useNavigate();
  const settings = usePrayerStore((s) => s.settings);
  const lang = settings.language || 'fr';

  const items = [
    { key: 'grow', icon: Sprout, label: t(lang, 'grow'), to: '/grow' },
    { key: 'plan', icon: CalendarDays, label: t(lang, 'plan'), to: '/plan' },
    { key: 'settings', icon: Settings, label: t(lang, 'settings'), to: '/settings' },
    // Deep links force-open their Settings section (see SettingsTab hash effect).
    { key: 'export', icon: Download, label: t(lang, 'exportData'), to: '/settings#data' },
    { key: 'support', icon: Heart, label: t(lang, 'settingsSecSupport'), to: '/settings#support' },
  ];

  const go = (to) => {
    const [path, hash] = to.split('#');
    // navigate() alone doesn't re-run SettingsTab's hash effect, so set the
    // hash explicitly before navigating to a hash destination.
    if (hash) window.location.hash = hash;
    navigate(path + (hash ? `#${hash}` : ''));
  };

  return (
    <div>
      <div className="px-4 md:px-8 pt-8 pb-6" style={{ background: 'var(--header)' }}>
        <h2 className="text-xl font-semibold text-white">{t(lang, 'moreTab')}</h2>
      </div>

      <div className="px-4 md:px-8 pt-5 max-w-2xl mx-auto">
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          {items.map(({ key, icon: Icon, label, to }, i) => (
            <button
              key={key}
              onClick={() => go(to)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
              style={i > 0 ? { borderTop: '0.5px solid var(--border)' } : {}}
            >
              <Icon size={18} style={{ color: 'var(--accent)' }} />
              <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-1)' }}>{label}</span>
              <ChevronRight size={15} style={{ color: 'var(--text-3)' }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
