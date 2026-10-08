import { UserPlus, Mail, MessageSquare, CheckCircle2, HandHeart, Plus, Sparkles, Users, Shield, Bell, CalendarPlus } from 'lucide-react';
import { t, tp } from '../i18n';
import { timeAgo } from '../utils/date';
import Avatar from './shared/Avatar';
import { avatarConfigFrom } from '../lib/avatar';

// Type → icon, tone + localized, PRIVACY-SAFE label. The label text is a fixed
// generic string per type — it is NEVER built from notification metadata
// content (no prayer titles, update text, names), so nothing sensitive is
// rendered here. The tone is the same soft icon tile Settings uses.
const TYPE_META = {
  friend_request:    { icon: UserPlus,      tone: 'sky',    labelKey: 'notifFriendRequest' },
  group_invitation:  { icon: Mail,          tone: 'indigo', labelKey: 'notifGroupInvitation' },
  community_update:  { icon: MessageSquare, tone: 'teal',   labelKey: 'notifCommunityUpdate' },
  answered:          { icon: CheckCircle2,  tone: 'amber',  labelKey: 'notifAnswered' },
  reaction_bucket:   { icon: HandHeart,     tone: 'rose',   labelKey: 'notifReaction' },
  group_prayer_added:{ icon: Plus,          tone: 'plum',   labelKey: 'notifGroupPrayerAdded' },
  testimony:         { icon: Sparkles,      tone: 'amber',  labelKey: 'notifTestimony' },
  membership_change: { icon: Users,         tone: 'teal',   labelKey: 'notifMembership' },
  role_change:       { icon: Shield,        tone: 'indigo', labelKey: 'notifRoleChange' },
  plan_invitation:   { icon: CalendarPlus,  tone: 'plum',   labelKey: 'notifPlanInvitation' },
};
const GENERIC = { icon: Bell, tone: null, labelKey: 'notifGeneric' };

// One inbox row. Renders as a button so it is keyboard-focusable and activates
// on Enter/Space. `onActivate` marks read + navigates (handled by the caller).
// `count` > 1 when several notifications of this kind were folded into the
// row (lib/notificationGroups): the newest one speaks, "and N others" follows.
//
// `group` (optional) is the recipient's OWN membership record for the group this
// notification belongs to, resolved by the caller. It only ever contributes the
// group's avatar and name — never a member, an actor, or any content — so the
// row gains "which group is this?" at a glance without disclosing anything the
// recipient could not already see, and the generic label text is untouched.
export default function NotificationRow({ notification, count = 1, lang, onActivate, group = null }) {
  const meta = TYPE_META[notification.type] || GENERIC;
  const Icon = meta.icon;
  const tone = meta.tone ? `tone-${meta.tone}` : '';
  const unread = !notification.read_at;
  const label = t(lang, meta.labelKey);
  const more = count > 1 ? tp(lang, 'notifAndMore', count - 1) : null;

  return (
    <button
      type="button"
      onClick={onActivate}
      aria-label={more ? `${label}, ${more}` : label}
      className={`notif-row ${unread ? 'notif-row--unread' : ''}`}
    >
      {group ? (
        // Group context: the group's tile leads, with the type icon as a small
        // toned badge so the KIND of notification stays glanceable too.
        <span className="notif-row__mark" aria-hidden="true">
          <Avatar kind="group" name={group.name} avatar={avatarConfigFrom(group)} size={36} />
          <span className={`notif-row__badge icon-tile ${tone}`}><Icon size={11} strokeWidth={2.2} /></span>
        </span>
      ) : (
        <span className={`notif-row__mark icon-tile ${tone}`} aria-hidden="true">
          <Icon size={18} strokeWidth={1.85} />
        </span>
      )}
      <span className="notif-row__body">
        <span className="notif-row__label">{label}</span>
        <span className="notif-row__time">
          {timeAgo(notification.created_at, lang)}
          {more && <> · {more}</>}
        </span>
      </span>
      {unread && <span className="notif-row__dot" aria-hidden="true" />}
    </button>
  );
}
