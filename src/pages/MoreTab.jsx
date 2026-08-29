import { useNavigate } from 'react-router-dom';
import { Compass, CalendarDays, Settings, ChevronRight } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { PageHeader } from '../components/shared/Primitives';

// More is a short bridge to three secondary destinations. It does not mirror
// Settings sections or duplicate the notification inbox.
export default function MoreTab() {
  const navigate = useNavigate();
  const settings = usePrayerStore((s) => s.settings);
  const lang = settings.language || 'fr';

  const items = [
    { key: 'guidance', icon: Compass, label: t(lang, 'guidance'), description: t(lang, 'moreGuidanceDesc'), to: '/guidance' },
    { key: 'calendar', icon: CalendarDays, label: t(lang, 'calendar'), description: t(lang, 'moreCalendarDesc'), to: '/calendar' },
    { key: 'settings', icon: Settings, label: t(lang, 'settingsAndHelp'), description: t(lang, 'moreSettingsHelpDesc'), to: '/settings' },
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
          {items.map(({ key, icon: Icon, label, description, to }, i) => (
            <button
              key={key}
              onClick={() => go(to)}
              // Stated explicitly so the row reads as one thing — "Grow — guides
              // and ideas to help you pray" — rather than two run-together spans.
              aria-label={`${label} — ${description}`}
              className="constellation-menu__row w-full flex items-center gap-3 px-1 py-3.5 text-start transition-colors"
              style={i > 0 ? { borderTop: '0.5px solid var(--border)' } : {}}
            >
              <Icon size={18} className="shrink-0" style={{ color: 'var(--accent)' }} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium" style={{ color: 'var(--text-1)' }}>{label}</span>
                {/* What you'll find there — one quiet line, never a second label. */}
                <span className="block text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{description}</span>
              </span>
              <ChevronRight size={15} className="shrink-0" style={{ color: 'var(--text-3)' }} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
