import { useNavigate } from 'react-router-dom';
import { Compass, CalendarDays, Settings, ChevronRight, Feather } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { PageHeader } from '../components/shared/Primitives';

// More is a short bridge to four secondary destinations — the last is the
// biblical foundation behind the app's name. It does not mirror Settings
// sections or duplicate the notification inbox.
export default function MoreTab() {
  const navigate = useNavigate();
  const settings = usePrayerStore((s) => s.settings);
  const lang = settings.language || 'fr';

  const items = [
    { key: 'guidance', icon: Compass, tone: 'teal', label: t(lang, 'guidance'), description: t(lang, 'moreGuidanceDesc'), to: '/guidance' },
    { key: 'calendar', icon: CalendarDays, tone: 'sky', label: t(lang, 'calendar'), description: t(lang, 'moreCalendarDesc'), to: '/calendar' },
    { key: 'settings', icon: Settings, tone: 'plum', label: t(lang, 'settingsAndHelp'), description: t(lang, 'moreSettingsHelpDesc'), to: '/settings' },
    { key: 'about', icon: Feather, tone: 'amber', label: t(lang, 'aboutTitle'), description: t(lang, 'moreAboutDesc'), to: '/about' },
  ];

  const go = (to) => {
    const [path, hash] = to.split('#');
    // navigate() alone doesn't re-run SettingsTab's hash effect, so set the
    // hash explicitly before navigating to a hash destination.
    if (hash) window.location.hash = hash;
    navigate(path + (hash ? `#${hash}` : ''));
  };

  return (
    <div className="phase-page">
      <div className="phase-page__shell">
        <PageHeader title={t(lang, 'moreTab')} />
      </div>

      <div className="phase-content">
        <ul className="menu-list">
          {items.map(({ key, icon: Icon, tone, label, description, to }) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => go(to)}
                // Stated explicitly so the row reads as one thing — "Grow — guides
                // and ideas to help you pray" — rather than two run-together spans.
                aria-label={`${label} — ${description}`}
                className="menu-row"
              >
                <span className={`icon-tile tone-${tone}`} aria-hidden="true">
                  <Icon size={19} strokeWidth={1.85} />
                </span>
                <span className="menu-row__body">
                  <span className="menu-row__title">{label}</span>
                  {/* What you'll find there — one quiet line, never a second label. */}
                  <span className="menu-row__description">{description}</span>
                </span>
                <ChevronRight className="rtl-mirror" size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
