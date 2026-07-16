import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCheck, X, Bell } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useNotificationStore from '../store/notificationStore';
import useAuthStore from '../store/authStore';
import { notificationRoute } from '../lib/notificationRoutes';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { t } from '../i18n';
import NotificationRow from './NotificationRow';

// A dropdown-style panel (bottom sheet on mobile) listing the most recent
// notifications. Clicking one marks it read and deep-links to the relevant page.
export default function NotificationPanel({ onClose }) {
  const lang = usePrayerStore((s) => s.settings.language || 'fr');
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const {
    notifications, unreadCount, loading, error,
    fetchNotifications, markRead, markAllRead,
  } = useNotificationStore();

  useEscapeKey(onClose);
  const trapRef = useFocusTrap();

  // Refresh the latest page whenever the panel opens.
  useEffect(() => {
    if (user?.id) fetchNotifications(user.id);
  }, [user?.id]);

  const recent = notifications.slice(0, 8);

  const handleActivate = async (n) => {
    await markRead(n.id);
    onClose();
    navigate(notificationRoute(n));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-start md:justify-end p-0 md:p-4 md:pt-16"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, 'inbox')}
        className="w-full md:w-96 rounded-t-2xl md:rounded-2xl max-h-[80vh] md:max-h-[70vh] flex flex-col"
        style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <Bell size={16} /> {t(lang, 'inbox')}
          </h2>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
                style={{ color: 'var(--accent)' }}
              >
                <CheckCheck size={14} /> {t(lang, 'markAllRead')}
              </button>
            )}
            <button onClick={onClose} aria-label={t(lang, 'close')} className="p-1 rounded-lg" style={{ color: 'var(--text-3)' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading && notifications.length === 0 ? (
            <div className="flex justify-center py-10">
              <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-3)' }} />
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>{t(lang, 'notifError')}</p>
              <button onClick={() => user?.id && fetchNotifications(user.id)} className="text-sm font-medium px-4 py-2 rounded-xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                {t(lang, 'retry')}
              </button>
            </div>
          ) : recent.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={28} className="mx-auto mb-3" style={{ color: 'var(--text-3)', opacity: 0.5 }} />
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>{t(lang, 'notifEmpty')}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{t(lang, 'notifEmptySub')}</p>
            </div>
          ) : (
            recent.map((n) => (
              <NotificationRow key={n.id} notification={n} lang={lang} onActivate={handleActivate} />
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => { onClose(); navigate('/notifications'); }}
            className="w-full text-center text-sm font-medium py-2 rounded-xl"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {t(lang, 'seeAllNotifications')}
          </button>
        </div>
      </div>
    </div>
  );
}
