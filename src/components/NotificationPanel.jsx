import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCheck, X } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useNotificationStore from '../store/notificationStore';
import useAuthStore from '../store/authStore';
import { notificationRoute } from '../lib/notificationRoutes';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { t } from '../i18n';
import NotificationRow from './NotificationRow';
import useGroupLookup from '../hooks/useGroupLookup';
import { QuietButton, SecondaryButton } from './shared/Primitives';
import EmptyState from './shared/EmptyState';

// A dropdown-style panel (bottom sheet on mobile) listing the most recent
// notifications. Clicking one marks it read and deep-links to the relevant page.
export default function NotificationPanel({ onClose }) {
  const lang = usePrayerStore((s) => s.settings.language || 'fr');
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const groupFor = useGroupLookup();
  const {
    notifications, unreadCount, loading, error,
    fetchNotifications, markRead, markAllRead,
  } = useNotificationStore();

  useEscapeKey(onClose);
  const trapRef = useFocusTrap();

  // Refresh the latest page whenever the panel opens. fetchNotifications is a
  // stable Zustand action, so listing it satisfies exhaustive-deps without
  // re-running on every render.
  useEffect(() => {
    if (user?.id) fetchNotifications(user.id);
  }, [user?.id, fetchNotifications]);

  const recent = notifications.slice(0, 8);

  const handleActivate = async (n) => {
    await markRead(n.id);
    onClose();
    navigate(notificationRoute(n));
  };

  return (
    <div className="dialog-backdrop notif-panel-backdrop" onClick={onClose}>
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, 'inbox')}
        className="notif-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notif-panel__header">
          <h2 className="q-dialog__title">{t(lang, 'inbox')}</h2>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <QuietButton icon={CheckCheck} iconSize={16} onClick={markAllRead}>{t(lang, 'markAllRead')}</QuietButton>
            )}
            <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="notif-panel__body">
          {loading && notifications.length === 0 ? (
            <div className="q-loading py-10"><Loader2 size={20} className="animate-spin" aria-hidden="true" /></div>
          ) : error ? (
            <div className="notif-error">
              <p>{t(lang, 'notifError')}</p>
              <SecondaryButton onClick={() => user?.id && fetchNotifications(user.id)}>{t(lang, 'retry')}</SecondaryButton>
            </div>
          ) : recent.length === 0 ? (
            <EmptyState compact title={t(lang, 'notifEmpty')} subtitle={t(lang, 'notifEmptySub')} />
          ) : (
            <ul className="notif-list">
              {recent.map((n) => (
                <li key={n.id}>
                  <NotificationRow notification={n} lang={lang} onActivate={handleActivate} group={groupFor(n.group_id)} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="notif-panel__footer">
          <SecondaryButton onClick={() => { onClose(); navigate('/notifications'); }} className="w-full">
            {t(lang, 'seeAllNotifications')}
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
