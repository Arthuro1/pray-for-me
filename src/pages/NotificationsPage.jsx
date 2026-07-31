import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCheck, Bell, Settings } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import { notificationRoute } from '../lib/notificationRoutes';
import { t } from '../i18n';
import NotificationRow from '../components/NotificationRow';
import { PageHeader } from '../components/shared/Primitives';

// The Inbox at /notifications — the bell's full destination, with keyset
// pagination for older notifications. (Route unchanged for deep links.)
export default function NotificationsPage() {
  const lang = usePrayerStore((s) => s.settings.language || 'fr');
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const {
    notifications, unreadCount, loading, error, hasMore,
    fetchNotifications, fetchMoreNotifications, markRead, markAllRead,
  } = useNotificationStore();

  // fetchNotifications is a stable Zustand action; listing it satisfies
  // exhaustive-deps without re-running on every render.
  useEffect(() => {
    if (user?.id) fetchNotifications(user.id);
  }, [user?.id, fetchNotifications]);

  const handleActivate = async (n) => {
    await markRead(n.id);
    navigate(notificationRoute(n));
  };

  return (
    <div className="phase-page constellation-notifications">
      <div className="phase-page__shell">
        <PageHeader
          eyebrow={t(lang, 'inbox')}
          title={t(lang, 'inbox')}
          aside={(
            <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                <CheckCheck size={15} /> {t(lang, 'markAllRead')}
              </button>
            )}
            <button
              onClick={() => navigate('/settings#notifications')}
              aria-label={t(lang, 'notifPrefsTitle')}
              title={t(lang, 'notifPrefsTitle')}
              className="flex items-center justify-center w-11 h-11 rounded-xl"
              style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
            >
              <Settings size={16} />
            </button>
            </div>
          )}
        />
      </div>

      <div className="phase-content max-w-2xl">
        {loading && notifications.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>{t(lang, 'notifError')}</p>
            <button onClick={() => user?.id && fetchNotifications(user.id)} className="text-sm font-medium px-4 py-2 rounded-xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              {t(lang, 'retry')}
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={36} className="mx-auto mb-4" style={{ color: 'var(--text-3)', opacity: 0.5 }} />
            <p className="text-base" style={{ color: 'var(--text-2)' }}>{t(lang, 'notifEmpty')}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{t(lang, 'notifEmptySub')}</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {notifications.map((n) => (
                <NotificationRow key={n.id} notification={n} lang={lang} onActivate={handleActivate} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-5">
                <button
                  onClick={fetchMoreNotifications}
                  disabled={loading}
                  className="text-sm font-medium px-5 py-2.5 rounded-xl disabled:opacity-50"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : t(lang, 'loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
