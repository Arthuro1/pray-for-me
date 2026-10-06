import { useState } from 'react';
import { Bell } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useNotificationStore from '../store/notificationStore';
import { t } from '../i18n';
import NotificationPanel from './NotificationPanel';

// The notification bell + unread badge. Opens the NotificationPanel overlay.
// Rendered in the app header (see Layout) — one instance for desktop, one for
// mobile; only one is visible at a time via responsive classes.
export default function NotificationBell({ className = '' }) {
  const lang = usePrayerStore((s) => s.settings.language || 'fr');
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={unreadCount > 0 ? t(lang, 'notifUnreadLabel', { n: unreadCount }) : t(lang, 'inbox')}
        className={`icon-button pressable relative ${className}`}
      >
        <Bell size={20} strokeWidth={1.8} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="nav-badge nav-badge--corner" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </>
  );
}
