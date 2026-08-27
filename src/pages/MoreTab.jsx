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
//
// Every row says what you will find after tapping it, in one short line. Some of
// these labels ("Grow", "Plan") mean nothing until you have been there once, and
// two of them ("Privacy & Security", "Settings") sound alike from outside — the
// descriptions are what tell them apart, which is why they are kept rather than
// the navigation being reshuffled.
export default function MoreTab() {
  const navigate = useNavigate();
  const settings = usePrayerStore((s) => s.settings);
  const lang = settings.language || 'fr';

  const items = [
    { key: 'grow', icon: Sprout, label: t(lang, 'grow'), description: t(lang, 'moreGrowDesc'), to: '/grow' },
    { key: 'plan', icon: CalendarDays, label: t(lang, 'plan'), description: t(lang, 'morePlanDesc'), to: '/plan' },
    // Deep links force-open their Settings section (see SettingsTab hash effect).
    { key: 'privacy', icon: ShieldCheck, label: t(lang, 'privacySecurity'), description: t(lang, 'morePrivacyDesc'), to: '/settings#privacy' },
    { key: 'settings', icon: Settings, label: t(lang, 'settings'), description: t(lang, 'moreSettingsDesc'), to: '/settings' },
    { key: 'support', icon: Heart, label: t(lang, 'settingsSecSupport'), description: t(lang, 'moreSupportDesc'), to: '/settings#support' },
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
