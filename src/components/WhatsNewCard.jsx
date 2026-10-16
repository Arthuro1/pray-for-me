import { useNavigate } from 'react-router-dom';
import { ScrollText, X } from 'lucide-react';
import { t } from '../i18n';
import useNotificationStore from '../store/notificationStore';
import { releaseFor, unreadAppNews } from '../content/releaseNotes';
import { SecondaryButton } from './shared/Primitives';

// A release's "What's new", on Today while its announcement is unread. The
// card follows the inbox row (the 'app_news' notification), so it shows on
// every device until it is read or hidden, and never for an account created
// after the release.
export default function WhatsNewCard({ lang }) {
  const navigate = useNavigate();
  const news = useNotificationStore((s) => unreadAppNews(s.notifications));
  const markRead = useNotificationStore((s) => s.markRead);
  if (!news) return null;

  const release = releaseFor(news.metadata.version);

  return (
    <section className="today-notice q-card" aria-labelledby="today-news-title">
      <div className="today-notice__head">
        <span className="icon-tile tone-plum" aria-hidden="true"><ScrollText size={18} strokeWidth={1.8} /></span>
        <div className="min-w-0 flex-1">
          <p className="section-label">{t(lang, 'whatsNewVersion', { version: release.version })}</p>
          <h2 id="today-news-title" className="today-notice__title">{t(lang, 'whatsNewTitle')}</h2>
        </div>
        <button type="button" onClick={() => markRead(news.id)} aria-label={t(lang, 'close')} title={t(lang, 'close')} className="icon-button pressable">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <p className="today-notice__body">{t(lang, release.summaryKey)}</p>
      <div>
        <SecondaryButton onClick={() => navigate('/whats-new')}>{t(lang, 'whatsNewCta')}</SecondaryButton>
      </div>
    </section>
  );
}
