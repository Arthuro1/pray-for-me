import { useNavigate } from 'react-router-dom';
import { Sprout, CalendarDays, Settings, Heart, ChevronRight, ShieldCheck } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { PageHeader } from '../components/shared/Primitives';

// Everything that matters but isn't daily: Grow, planning, privacy & security,
// settings and support live here so the bottom navigation stays about
// Today / Journal / Community. Each row is a plain destination — no state, no
// logic. The inbox is NOT duplicated here (the bell in the header is its one
// way in), and neither is Export — it lives inside Privacy & Security.
export default function MoreTab() {
  const navigate = useNavigate();
  const settings = usePrayerStore((s) => s.settings);
  const lang = settings.language || 'fr';

  const items = [
    { key: 'grow', icon: Sprout, label: t(lang, 'grow'), to: '/grow' },
    { key: 'plan', icon: CalendarDays, label: t(lang, 'plan'), to: '/plan' },
    // Deep links force-open their Settings section (see SettingsTab hash effect).
    { key: 'privacy', icon: ShieldCheck, label: t(lang, 'privacySecurity'), to: '/settings#privacy' },
    { key: 'settings', icon: Settings, label: t(lang, 'settings'), to: '/settings' },
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
    <div className="phase-page constellation-more">
      <div className="phase-page__shell">
        <PageHeader
          eyebrow={t(lang, 'moreTab')}
          title={t(lang, 'moreTab')}
        />
      </div>

      <div className="phase-content max-w-2xl">
        <div className="constellation-menu">
          {items.map(({ key, icon: Icon, label, to }, i) => (
            <button
              key={key}
              onClick={() => go(to)}
              className="constellation-menu__row w-full flex items-center gap-3 px-1 py-4 text-left transition-colors"
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
