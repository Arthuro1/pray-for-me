import { useEffect } from 'react';
import { CalendarClock, Church, CircleDot, Sparkles, Wind } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useNotificationStore from '../store/notificationStore';
import { t } from '../i18n';
import { LATEST_RELEASE } from '../content/releaseNotes';
import { PageHeader } from '../components/shared/Primitives';

// What each item of a release looks like (content/releaseNotes.js `id`).
const ITEM_LOOK = {
  spirit: { icon: Wind, tone: 'sky' },
  meetings: { icon: CalendarClock, tone: 'indigo' },
  church: { icon: Church, tone: 'church' },
  circles: { icon: CircleDot, tone: 'teal' },
};
const DEFAULT_LOOK = { icon: Sparkles, tone: 'plum' };

// /whats-new — what the latest release brought. The push and the inbox row of
// a release announcement open here; reading it settles that announcement.
export default function WhatsNewPage() {
  const lang = usePrayerStore((s) => s.settings.language || 'fr');
  const announcementId = useNotificationStore((s) => s.notifications.find(
    (n) => n.type === 'app_news' && !n.read_at && n.metadata?.version === LATEST_RELEASE.version,
  )?.id);
  const markRead = useNotificationStore((s) => s.markRead);

  useEffect(() => {
    if (announcementId) markRead(announcementId);
  }, [announcementId, markRead]);

  return (
    <div className="phase-page">
      <div className="phase-page__shell max-w-2xl">
        <PageHeader
          eyebrow={t(lang, 'whatsNewVersion', { version: LATEST_RELEASE.version })}
          title={t(lang, 'whatsNewTitle')}
          backTo="/"
          backLabel={t(lang, 'today')}
          backAriaLabel={`${t(lang, 'backBtn')}: ${t(lang, 'today')}`}
        />
      </div>

      <div className="phase-content max-w-2xl">
        <ul className="whats-new">
          {LATEST_RELEASE.items.map((item) => {
            const { icon: Icon, tone } = ITEM_LOOK[item.id] || DEFAULT_LOOK;
            return (
              <li key={item.id} className="whats-new__item q-card">
                <span className={`icon-tile tone-${tone}`} aria-hidden="true"><Icon size={18} strokeWidth={1.8} /></span>
                <div className="min-w-0">
                  <h2 className="whats-new__title">{t(lang, item.titleKey)}</h2>
                  <p className="whats-new__body">{t(lang, item.bodyKey)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
