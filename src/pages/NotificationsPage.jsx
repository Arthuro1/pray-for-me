import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCheck, Settings } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import { notificationRoute } from '../lib/notificationRoutes';
import { t } from '../i18n';
import NotificationRow from '../components/NotificationRow';
import { groupNotifications } from '../lib/notificationGroups';
import useGroupLookup from '../hooks/useGroupLookup';
import { PageHeader, QuietButton, SecondaryButton } from '../components/shared/Primitives';
import EmptyState from '../components/shared/EmptyState';

// The Inbox at /notifications — the bell's full destination, with keyset
// pagination for older notifications. (Route unchanged for deep links.)
export default function NotificationsPage() {
  const lang = usePrayerStore((s) => s.settings.language || 'fr');
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const groupFor = useGroupLookup();
  const {
    notifications, unreadCount, loading, error, hasMore,
    fetchNotifications, fetchMoreNotifications, markRead, markAllRead,
  } = useNotificationStore();

  // fetchNotifications is a stable Zustand action; listing it satisfies
  // exhaustive-deps without re-running on every render.
  useEffect(() => {
    if (user?.id) fetchNotifications(user.id);
  }, [user?.id, fetchNotifications]);

  const handleActivate = async (row) => {
    await Promise.all(row.ids.map(markRead));
    navigate(notificationRoute(row.latest));
  };

  return (
    <div className="phase-page">
      <div className="phase-page__shell">
        <PageHeader
          title={t(lang, 'inbox')}
          aside={(
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <QuietButton icon={CheckCheck} iconSize={16} onClick={markAllRead}>{t(lang, 'markAllRead')}</QuietButton>
              )}
              <button
                type="button"
                onClick={() => navigate('/settings#notifications')}
                aria-label={t(lang, 'notifPrefsTitle')}
                title={t(lang, 'notifPrefsTitle')}
                className="icon-button pressable"
              >
                <Settings size={18} aria-hidden="true" />
              </button>
            </div>
          )}
        />
      </div>

      <div className="phase-content max-w-2xl">
        {loading && notifications.length === 0 ? (
          <div className="q-loading py-16"><Loader2 size={22} className="animate-spin" aria-hidden="true" /></div>
        ) : error ? (
          <div className="notif-error">
            <p>{t(lang, 'notifError')}</p>
            <SecondaryButton onClick={() => user?.id && fetchNotifications(user.id)}>{t(lang, 'retry')}</SecondaryButton>
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState title={t(lang, 'notifEmpty')} subtitle={t(lang, 'notifEmptySub')} />
        ) : (
          <>
            <ul className="notif-list">
              {groupNotifications(notifications).map((row) => (
                <li key={row.latest.id}>
                  <NotificationRow
                    notification={row.latest}
                    count={row.ids.length}
                    lang={lang}
                    onActivate={() => handleActivate(row)}
                    group={groupFor(row.latest.group_id)}
                  />
                </li>
              ))}
            </ul>
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <SecondaryButton onClick={fetchMoreNotifications} disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" aria-label={t(lang, 'loadMore')} /> : t(lang, 'loadMore')}
                </SecondaryButton>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
