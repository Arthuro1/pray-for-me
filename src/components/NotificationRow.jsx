import { UserPlus, Mail, MessageSquare, CheckCircle2, HandHeart, Plus, Sparkles, Users, Shield, Bell, CalendarPlus } from 'lucide-react';
import { t } from '../i18n';
import { timeAgo } from '../utils/date';

// Type → icon + localized, PRIVACY-SAFE label. The label text is a fixed generic
// string per type — it is NEVER built from notification metadata content (no
// prayer titles, update text, names), so nothing sensitive is rendered here.
const TYPE_META = {
  friend_request:    { icon: UserPlus,      labelKey: 'notifFriendRequest' },
  group_invitation:  { icon: Mail,          labelKey: 'notifGroupInvitation' },
  community_update:  { icon: MessageSquare, labelKey: 'notifCommunityUpdate' },
  answered:          { icon: CheckCircle2,  labelKey: 'notifAnswered' },
  reaction_bucket:   { icon: HandHeart,     labelKey: 'notifReaction' },
  group_prayer_added:{ icon: Plus,          labelKey: 'notifGroupPrayerAdded' },
  testimony:         { icon: Sparkles,      labelKey: 'notifTestimony' },
  membership_change: { icon: Users,         labelKey: 'notifMembership' },
  role_change:       { icon: Shield,        labelKey: 'notifRoleChange' },
  plan_invitation:   { icon: CalendarPlus,  labelKey: 'notifPlanInvitation' },
};

function notificationLabel(notification, lang) {
  const meta = TYPE_META[notification.type];
  return t(lang, meta?.labelKey || 'notifGeneric');
}

// One inbox row. Renders as a button so it is keyboard-focusable and activates
// on Enter/Space. `onActivate` marks read + navigates (handled by the caller).
export default function NotificationRow({ notification, lang, onActivate }) {
  const meta = TYPE_META[notification.type] || { icon: Bell, labelKey: 'notifGeneric' };
  const Icon = meta.icon;
  const unread = !notification.read_at;

  return (
    <button
      type="button"
      onClick={() => onActivate(notification)}
      aria-label={notificationLabel(notification, lang)}
      className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors"
      style={{
        background: unread ? 'var(--accent-soft)' : 'var(--surface)',
        border: '0.5px solid var(--border)',
      }}
    >
      <span
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm" style={{ color: 'var(--text-1)', fontWeight: unread ? 600 : 400 }}>
          {t(lang, meta.labelKey)}
        </span>
        <span className="block text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
          {timeAgo(notification.created_at, lang)}
        </span>
      </span>
      {unread && (
        <span className="shrink-0 mt-2 w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} aria-hidden="true" />
      )}
    </button>
  );
}
