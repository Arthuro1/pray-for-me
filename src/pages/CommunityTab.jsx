import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Users, Plus, HandHeart, MessageSquare, Loader2, ArrowLeft, Mail, Settings, SlidersHorizontal, Trash2, Check, LogOut, Search, Share2, QrCode, ShieldCheck, ShieldOff, Star, DoorOpen, UsersRound, UserPlus, HeartHandshake, CalendarPlus } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import OverflowMenu from '../components/shared/OverflowMenu';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import { t } from '../i18n';
import { toast } from '../store/toastStore';
import { timeAgo, groupByThisMonth } from '../utils/date';
import { getAuthorName, communityAuthor } from '../utils/user';
import PrayerDetail from './PrayerDetail';
import PrayerForm from '../components/PrayerForm';
import IntercessionQueue from '../components/IntercessionQueue';
import GroupChecklist from '../components/GroupChecklist';
import { setChecklistFlag } from '../lib/groupChecklist';
import { groupListControls } from '../lib/groupTools';
import PrayerListSkeleton from '../components/shared/Skeleton';
import Avatar from '../components/shared/Avatar';
import AvatarEditor from '../components/shared/AvatarEditor';
import { avatarConfigFrom, canEditGroupAvatar } from '../lib/avatar';
import { planById } from '../lib/guidedPlan';
import { startGuidedPlan } from '../lib/startGuidedPlan';
import { runningPlanIds } from '../lib/planner';
import { todayKey } from '../lib/prayedLog';
import { plansByCategory } from '../content/prayerPlans';
import PlanDetailModal from '../components/PlanDetailModal';
import { isPlanReviewed } from '../lib/planReview';
import { groupPlanStatus, sortGroupPlans, prayingLabel } from '../lib/groupPlans';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import LockedNotice from '../components/LockedNotice';
import RichText from '../components/rich/RichText';
import ShareButtons from '../components/shared/ShareButtons';
import Switch from '../components/shared/Switch';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '../components/shared/Primitives';
import { Modal, CreateGroupModal, JoinGroupModal, AddFriendModal } from './community/GroupFriendModals';
import { CARD_STYLE, SUBTLE_BTN, INPUT_STYLE } from './community/ui';
import useCommunityHubData from './community/useCommunityHubData';
import useGroupPlans from './community/useGroupPlans';
import useGroupWall from './community/useGroupWall';
// Plain, recognisable line icons (currentColor, so they adapt to theme and to
// the button they sit in): join = walk through a door, create = a circle of
// people, add a friend = a person with a plus.
const COMMUNITY_ACTION_ICONS = { join: DoorOpen, create: UsersRound, friend: UserPlus };

function CommunityActionIcon({ action, compact = false }) {
  const Icon = COMMUNITY_ACTION_ICONS[action];
  return <Icon size={compact ? 16 : 18} strokeWidth={1.9} aria-hidden="true" />;
}

// Formats an ISO 'YYYY-MM-DD' group-plan start day for display, parsing it as a
// LOCAL date so it never shifts a day (new Date('2026-08-01') is UTC midnight).
// Falls back to the raw key if it isn't a plain date.
function formatPlanDate(key, lang) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || '');
  if (!m) return key || '';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  try { return d.toLocaleDateString(lang, { month: 'short', day: 'numeric' }); } catch { return key; }
}

function ActionRow({ label, sublabel, avatarName, avatar, avatarKind = 'user', primaryText, onPrimary, onSecondary, secondaryText, busy }) {
  return (
    <div className="phase-card phase-card--quiet flex items-center justify-between p-3 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {avatarName && <Avatar name={avatarName} avatar={avatar} kind={avatarKind} size={36} />}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{label}</p>
          {sublabel && <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{sublabel}</p>}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={onPrimary} disabled={busy} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-40" style={{ background: 'var(--accent)' }}>
          {busy ? <Loader2 size={12} className="animate-spin" /> : primaryText}
        </button>
        <button onClick={onSecondary} disabled={busy} className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-40" style={SUBTLE_BTN}>
          {secondaryText}
        </button>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="mb-8">
      <h2 className="phase-section-heading flex items-center gap-2">
        {icon} {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ── Community Hub Home ──────────────────────────────────────────────────────
function CommunityHub({ lang, userId, onViewGroup }) {
  const { groups, acceptFriendRequest, rejectFriendRequest, acceptGroupInvitation, rejectGroupInvitation, removeFriend, addFriendship, acceptPlanInvitation, declinePlanInvitation } = useCommunityStore(
    useShallow((s) => ({
      groups: s.groups,
      acceptFriendRequest: s.acceptFriendRequest,
      rejectFriendRequest: s.rejectFriendRequest,
      acceptGroupInvitation: s.acceptGroupInvitation,
      rejectGroupInvitation: s.rejectGroupInvitation,
      removeFriend: s.removeFriend,
      addFriendship: s.addFriendship,
      acceptPlanInvitation: s.acceptPlanInvitation,
      declinePlanInvitation: s.declinePlanInvitation,
    }))
  );
  const navigate = useNavigate();
  // Read-model (friends, requests, invitations, unread badges) + its loader live
  // in a dedicated hook; this component keeps the mutations and the layout.
  const { friends, friendRequests, groupInvitations, planInvitations, unread, loading, reload } = useCommunityHubData(userId);
  const [busyId, setBusyId] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);

  // Accept an invitation to pray a plan together: start the SAME guided plan on
  // your own calendar (unless already running it) and jump to the Plan tab.
  const acceptPlanInvite = async (inv) => {
    const res = await acceptPlanInvitation(inv.id);
    if (res?.error) return res;
    const plan = planById(res.planId);
    // A plan whose content review has not passed cannot be started at all —
    // say so rather than claiming it began.
    if (!plan) { toast.error(t(lang, 'planCoupleReviewHint')); return {}; }

    const personal = usePrayerStore.getState().prayers;
    if (runningPlanIds(personal, todayKey()).has(plan.id)) {
      toast.success(t(lang, 'planRunning'));
      navigate('/guidance');
      return {};
    }
    const started = await startGuidedPlan({
      plan, startDate: res.startDate, lang, addPrayer: usePrayerStore.getState().addPrayer,
    });
    if (!started.ok && started.reason === 'personalize') {
      navigate('/guidance', { state: { guidedJourneyStart: { planId: plan.id, startDate: res.startDate } } });
      return {};
    }
    if (!started.ok) { toast.error(t(lang, 'errorGeneric')); return {}; }
    toast.success(t(lang, 'planStarted'));
    navigate(`/prayers/${started.prayerId}`);
    return {};
  };

  const handle = async (id, fn) => {
    setBusyId(id);
    const res = await fn();
    if (res?.error) toast.error(t(lang, 'errorGeneric'));
    await reload();
    setBusyId(null);
  };

  // Friend removal gets an Undo affordance instead of a hard confirm dialog.
  const handleRemoveFriend = async (friend) => {
    setBusyId(friend.id);
    const res = await removeFriend(userId, friend.id);
    await reload();
    setBusyId(null);
    if (res?.error) { toast.error(t(lang, 'errorGeneric')); return; }
    toast.success(t(lang, 'friendRemoved'), {
      action: { label: t(lang, 'undo'), onClick: async () => { await addFriendship(userId, friend.id); reload(); } },
    });
  };

  if (loading) {
    return (
      <div className="px-5 md:px-8 py-6 max-w-4xl mx-auto">
        <PrayerListSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="phase-page constellation-community min-h-screen">
      <div className="phase-page__shell">
        {/* Once groups exist they lead the page; joining another group, creating
            one or adding a friend become small header actions instead of a
            second button row. Join stays reachable — invitations arrive by code. */}
        <PageHeader
          className="constellation-community__header"
          title={t(lang, 'together')}
          aside={groups.length > 0 ? (
            <OverflowMenu
              lang={lang}
              ariaLabel={t(lang, 'add')}
              triggerIcon={Plus}
              triggerLabel={t(lang, 'add')}
              triggerStyle={{ background: 'var(--plum)', color: '#fff' }}
              iconColor="#fff"
              items={[
                { key: 'join', icon: DoorOpen, label: t(lang, 'joinGroupCta'), onClick: () => setShowJoinGroup(true) },
                { key: 'create', icon: UsersRound, label: t(lang, 'createGroup'), onClick: () => setShowCreateGroup(true) },
                { key: 'person', icon: UserPlus, label: t(lang, 'addPerson'), onClick: () => setShowAddFriend(true) },
              ]}
            />
          ) : undefined}
        />

        {groups.length > 0 && (
          <div className="constellation-community__hero">
            <div className="constellation-community__hero-copy">
              <h2>{t(lang, 'fromYourGroups')}</h2>
              <p>{t(lang, 'communityEmptyDesc')}</p>
            </div>
            <span className="constellation-community__hero-art" aria-hidden="true">
              <img src="/assets/constellation/community-sky-light-transparent.png" alt="" className="constellation-community__hero-image constellation-community__hero-image--light" />
              <img src="/assets/constellation/community-sky-dark-transparent.png" alt="" className="constellation-community__hero-image constellation-community__hero-image--dark" />
            </span>
          </div>
        )}

        {/* An empty community account gets ONE onboarding card — join first
            (most believers are invited into an existing group), create second,
            add-a-friend as a quiet text link. No second empty state below. */}
        {groups.length === 0 && (
          <div className="phase-card community-empty mb-8 text-center max-w-lg mx-auto">
            <Users size={34} className="mx-auto mb-3" aria-hidden="true" />
            <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{t(lang, 'prayWithOthers')}</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>{t(lang, 'communityEmptyDesc')}</p>
            <button onClick={() => setShowJoinGroup(true)} className="community-empty__primary w-full flex items-center justify-center gap-2 px-5 rounded-xl text-sm font-semibold mb-2.5">
              <CommunityActionIcon action="join" compact /> {t(lang, 'joinGroupCta')}
            </button>
            <button onClick={() => setShowCreateGroup(true)} className="community-empty__secondary w-full flex items-center justify-center gap-2 px-5 rounded-xl text-sm font-medium mb-3">
              <CommunityActionIcon action="create" compact /> {t(lang, 'createGroup')}
            </button>
            <button onClick={() => setShowAddFriend(true)} className="inline-flex items-center gap-1.5 px-3 text-xs font-medium" style={{ color: 'rgba(255,255,255,.8)' }}>
              <CommunityActionIcon action="friend" compact /> {t(lang, 'addFriend')}
            </button>
          </div>
        )}

        {/* Needs attention: ONLY when something actually awaits a decision —
            incoming friend requests and group invitations. Never a permanent
            statistics block. */}
        {(friendRequests.length > 0 || groupInvitations.length > 0 || planInvitations.length > 0) && (
          <Section title={t(lang, 'needsAttention')} icon={<Mail size={18} />}>
            {friendRequests.map(req => (
              <ActionRow key={req.id} label={req.fromName} sublabel={t(lang, 'friendRequests')}
                avatarName={req.fromName} avatar={req.fromAvatar} busy={busyId === req.id}
                primaryText={t(lang, 'accept')} secondaryText={t(lang, 'reject')}
                onPrimary={() => handle(req.id, () => acceptFriendRequest(req.id))}
                onSecondary={() => handle(req.id, () => rejectFriendRequest(req.id))} />
            ))}
            {groupInvitations.map(inv => (
              <ActionRow key={inv.id}
                label={inv.groupName || t(lang, 'groupInviteFallbackTitle')}
                sublabel={inv.inviterName ? `${t(lang, 'invitedBy')} ${inv.inviterName}` : t(lang, 'groupInviteFallbackDesc')}
                avatarName={inv.groupName || t(lang, 'groupInviteFallbackTitle')}
                avatar={inv.groupAvatar} avatarKind="group"
                busy={busyId === inv.id}
                primaryText={t(lang, 'join')} secondaryText={t(lang, 'reject')}
                onPrimary={() => handle(inv.id, () => acceptGroupInvitation(inv.id, userId))}
                onSecondary={() => handle(inv.id, () => rejectGroupInvitation(inv.id))} />
            ))}
            {planInvitations.map(inv => {
              const plan = planById(inv.plan_id);
              const title = plan ? t(lang, plan.titleKey) : t(lang, 'planInviteTitle');
              const from = inv.inviterName ? t(lang, 'planInvitationFrom', { name: inv.inviterName }) : t(lang, 'planInviteSub');
              return (
                <ActionRow key={inv.id}
                  label={title}
                  sublabel={inv.groupName ? `${from} · ${inv.groupName}` : from}
                  avatarName={inv.inviterName || title}
                  busy={busyId === inv.id}
                  primaryText={t(lang, 'planInviteAccept')} secondaryText={t(lang, 'reject')}
                  onPrimary={() => handle(inv.id, () => acceptPlanInvite(inv))}
                  onSecondary={() => handle(inv.id, () => declinePlanInvitation(inv.id))} />
              );
            })}
          </Section>
        )}

        {/* Intercession queue — only for users who explicitly took requests on
            (for someone, or saved from a group); invisible to everyone else. */}
        <IntercessionQueue lang={lang} />

        {/* The onboarding card above IS the empty state — no second "My groups"
            empty section with another Join button. */}
        {groups.length > 0 && (
          <Section title={t(lang, 'myGroups')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groups.map(g => (
                <button key={g.id} onClick={() => onViewGroup(g.id)} className="phase-card community-card p-4 text-left">
                  <div className="flex items-center gap-3">
                    <Avatar kind="group" name={g.name} avatar={avatarConfigFrom(g)} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>{g.name}</p>
                      {g.role === 'admin' && <p className="text-xs" style={{ color: 'var(--accent)' }}>{t(lang, 'admin')}</p>}
                    </div>
                    {unread[g.id] > 0 && (
                      <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--accent)' }}>
                        {t(lang, 'newCount', { n: unread[g.id] })}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Section>
        )}

        {friends.length > 0 && (
          <Section title={`${t(lang, 'peopleView')} (${friends.length})`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {friends.map(f => (
                <div key={f.id} className="phase-card phase-card--quiet flex items-center justify-between gap-3 p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={f.name} avatar={f.avatar} size={36} />
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{f.name}</p>
                  </div>
                  <button onClick={() => handleRemoveFriend(f)} disabled={busyId === f.id} className="px-3 py-1 rounded-lg text-xs disabled:opacity-40 shrink-0" style={SUBTLE_BTN}>
                    {t(lang, 'remove')}
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {showCreateGroup && <CreateGroupModal lang={lang} userId={userId} onClose={() => setShowCreateGroup(false)}
          onDone={(groupId) => { setShowCreateGroup(false); if (groupId) onViewGroup(groupId); }} />}
        {showJoinGroup && <JoinGroupModal lang={lang} userId={userId} onClose={() => setShowJoinGroup(false)} onJoined={(groupId) => { setShowJoinGroup(false); onViewGroup(groupId); }} />}
        {showAddFriend && <AddFriendModal lang={lang} userId={userId} onClose={() => setShowAddFriend(false)} />}
      </div>
    </div>
  );
}

// Maps the stable single-token error messages raised by the role-management
// RPCs (set_group_member_role / remove_group_member) to localized copy. Unknown
// messages fall back to a generic role-change failure.
const ROLE_ERROR_KEYS = {
  cannot_change_own_role: 'cannotChangeOwnRole',
  creator_cannot_be_demoted: 'creatorCannotBeDemoted',
  creator_cannot_be_removed: 'creatorCannotBeRemoved',
  must_retain_admin: 'groupMustRetainAdmin',
  not_group_admin: 'notAuthorizedAdmins',
};
function roleErrorKey(message = '') {
  const hit = Object.keys(ROLE_ERROR_KEYS).find((tok) => message.includes(tok));
  return hit ? ROLE_ERROR_KEYS[hit] : 'roleChangeFailed';
}

// ── Group Admin Modal (invite friends + manage members) ──────────────────────
// `onInviteAction` (optional) fires when a friend invitation is actually sent.
export function GroupAdminModal({ lang, userId, group, onClose, onInviteAction }) {
  const { fetchFriends, fetchGroupMembers, fetchGroupInvitees, inviteToGroup, removeMember, setMemberRole, renameGroup, updateGroupAvatar } = useCommunityStore(
    useShallow((s) => ({
      fetchFriends: s.fetchFriends,
      fetchGroupMembers: s.fetchGroupMembers,
      fetchGroupInvitees: s.fetchGroupInvitees,
      inviteToGroup: s.inviteToGroup,
      removeMember: s.removeMember,
      setMemberRole: s.setMemberRole,
      renameGroup: s.renameGroup,
      updateGroupAvatar: s.updateGroupAvatar,
    }))
  );
  const [friends, setFriends] = useState([]);
  const [members, setMembers] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [invited, setInvited] = useState({});
  const [confirmRemove, setConfirmRemove] = useState(null);
  // { member, nextRole } for the promote/demote confirmation dialog.
  const [confirmRole, setConfirmRole] = useState(null);
  const [name, setName] = useState(group.name);
  const [renaming, setRenaming] = useState(false);
  const canEditAvatar = canEditGroupAvatar(group, userId);

  // The editor owns the toast and the storage lifecycle; this only persists.
  const handleAvatarSave = (config) => updateGroupAvatar(group.id, config);

  const handleRename = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === group.name || renaming) return;
    setRenaming(true);
    const { error } = await renameGroup(group.id, trimmed);
    setRenaming(false);
    if (error) { toast.error(t(lang, 'errorGeneric')); return; }
    toast.success(t(lang, 'groupRenamed'));
  };

  const load = useCallback(async () => {
    const [f, m, inv] = await Promise.all([fetchFriends(userId), fetchGroupMembers(group.id), fetchGroupInvitees(group.id)]);
    setFriends(f.friends || []);
    setMembers(m.members || []);
    setInvited(Object.fromEntries((inv.inviteeIds || []).map(id => [id, true])));
  }, [fetchFriends, fetchGroupInvitees, fetchGroupMembers, userId, group.id]);

  useEffect(() => { load(); }, [load]);

  const memberIds = new Set(members.map(m => m.user_id));
  const invitable = friends.filter(f => !memberIds.has(f.id));

  const handleInvite = async (friendId) => {
    setBusyId(friendId);
    const { error } = await inviteToGroup(group.id, friendId, userId);
    setBusyId(null);
    if (error) { toast.error(t(lang, 'errorGeneric')); return; }
    setInvited(prev => ({ ...prev, [friendId]: true }));
    toast.success(t(lang, 'invited'));
    onInviteAction?.();
  };

  const handleRemove = async (memberId) => {
    setBusyId(memberId);
    const res = await removeMember(group.id, memberId);
    if (res?.error) {
      toast.error(t(lang, roleErrorKey(res.error)));
    } else {
      await load();
    }
    setBusyId(null);
    setConfirmRemove(null);
  };

  // Promote a member to admin / demote a non-owner admin. Authorization is
  // enforced server-side by the RPC; we only reflect the outcome. No optimistic
  // update — we refetch the member list so the badge matches the DB.
  const handleSetRole = async (member, nextRole) => {
    setBusyId(member.user_id);
    const res = await setMemberRole(group.id, member.user_id, nextRole);
    if (res?.error) {
      toast.error(t(lang, roleErrorKey(res.error)));
    } else {
      toast.success(t(lang, nextRole === 'admin' ? 'memberPromoted' : 'adminRemoved'));
      await load();
    }
    setBusyId(null);
    setConfirmRole(null);
  };

  return (
    <Modal title={t(lang, 'manageGroup')} lang={lang} onClose={onClose}>
      {confirmRemove && (
        <ConfirmDialog
          title={t(lang, 'removeMemberConfirm')}
          message={`${confirmRemove.name} — ${t(lang, 'deleteWarning')}`}
          confirmLabel={t(lang, 'remove')}
          cancelLabel={t(lang, 'cancel')}
          loading={busyId === confirmRemove.user_id}
          onConfirm={() => handleRemove(confirmRemove.user_id)}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
      {confirmRole && (
        <ConfirmDialog
          title={t(lang, confirmRole.nextRole === 'admin' ? 'promoteConfirmTitle' : 'demoteConfirmTitle')}
          message={`${confirmRole.member.name} — ${t(lang, confirmRole.nextRole === 'admin' ? 'promoteConfirmDesc' : 'demoteConfirmDesc')}`}
          confirmLabel={t(lang, confirmRole.nextRole === 'admin' ? 'makeAdmin' : 'removeAdminRole')}
          cancelLabel={t(lang, 'cancel')}
          danger={confirmRole.nextRole === 'member'}
          loading={busyId === confirmRole.member.user_id}
          onConfirm={() => handleSetRole(confirmRole.member, confirmRole.nextRole)}
          onCancel={() => setConfirmRole(null)}
        />
      )}
      <div className="max-h-[60vh] overflow-y-auto">
        {/* Only admins and the group's creator can restyle a group — the same
            rule the "Admins can update their group" policy enforces server-side. */}
        {canEditAvatar && (
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>{t(lang, 'groupAvatar')}</p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'groupAvatarHint')}</p>
            <AvatarEditor lang={lang} kind="group" name={group.name} avatar={avatarConfigFrom(group)} ownerId={group.id} onSave={handleAvatarSave} />
          </div>
        )}

        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'renameGroup')}</p>
        <div className="flex gap-2 mb-5">
          <input value={name} onChange={e => setName(e.target.value)} placeholder={t(lang, 'groupName')}
            onKeyDown={e => e.key === 'Enter' && handleRename()}
            className="flex-1 text-sm rounded-xl px-3 py-2 focus:outline-none" style={INPUT_STYLE} />
          <button onClick={handleRename} disabled={!name.trim() || name.trim() === group.name || renaming}
            className="px-4 rounded-xl text-sm font-medium text-white disabled:opacity-40" style={{ background: 'var(--accent)' }}>
            {renaming ? <Loader2 size={14} className="animate-spin" /> : t(lang, 'save')}
          </button>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'inviteFriends')}</p>
        {invitable.length === 0 ? (
          <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>{t(lang, 'noFriendsToInvite')}</p>
        ) : (
          <div className="space-y-2 mb-5">
            {invitable.map(f => (
              <div key={f.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl" style={CARD_STYLE}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={f.name} avatar={f.avatar} size={30} />
                  <p className="text-sm truncate" style={{ color: 'var(--text-1)' }}>{f.name}</p>
                </div>
                <button onClick={() => handleInvite(f.id)} disabled={busyId === f.id || invited[f.id]} className="px-3 py-1 rounded-lg text-xs font-medium text-white disabled:opacity-40 shrink-0" style={{ background: 'var(--accent)' }}>
                  {invited[f.id] ? t(lang, 'invited') : t(lang, 'invite')}
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'members')} ({members.length})</p>
        <div className="space-y-2">
          {members.map(m => {
            const isSelf = m.user_id === userId;
            const isOwner = m.user_id === group.created_by;
            const isMemberAdmin = m.role === 'admin';
            // Owner and self are never managed here; everyone else gets a
            // single labelled overflow menu (not a row of bare icon buttons).
            const roleItem = isMemberAdmin
              ? { key: 'demote', icon: ShieldOff, label: t(lang, 'removeAdminRole'), onClick: () => setConfirmRole({ member: m, nextRole: 'member' }) }
              : { key: 'promote', icon: ShieldCheck, label: t(lang, 'makeAdmin'), onClick: () => setConfirmRole({ member: m, nextRole: 'admin' }) };
            const menuItems = (isSelf || isOwner) ? [] : [
              roleItem,
              { key: 'remove', icon: Trash2, label: t(lang, 'removeFromGroup'), danger: true, onClick: () => setConfirmRemove(m) },
            ];
            return (
              <div key={m.user_id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl" style={CARD_STYLE}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={m.name} avatar={m.avatar} size={30} />
                  <div className="min-w-0">
                    <p className="text-sm truncate" style={{ color: 'var(--text-1)' }}>{m.name}{isSelf ? ` (${t(lang, 'you')})` : ''}</p>
                    {isOwner
                      ? <p className="text-xs" style={{ color: 'var(--accent)' }}>{t(lang, 'owner')}</p>
                      : isMemberAdmin
                        ? <p className="text-xs" style={{ color: 'var(--accent)' }}>{t(lang, 'admin')}</p>
                        : null}
                  </div>
                </div>
                {menuItems.length > 0 && (
                  busyId === m.user_id
                    ? <Loader2 size={16} className="animate-spin shrink-0" style={{ color: 'var(--text-3)' }} />
                    : <OverflowMenu lang={lang} ariaLabel={t(lang, 'memberActions')} items={menuItems}
                        triggerClassName="p-1.5 rounded-lg shrink-0 flex items-center justify-center" triggerStyle={SUBTLE_BTN} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

// Read-only member list, available to every group member. `onInviteAction`
// (optional) fires when an invitation genuinely goes OUT — link shared/copied,
// a share target used, or the QR code displayed — never on merely opening the
// modal, so the leader checklist's Invite step can't tick itself off early.
export function MembersModal({ lang, group, userId, onClose, onInviteAction }) {
  const fetchGroupMembers = useCommunityStore((s) => s.fetchGroupMembers);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  const inviteUrl = `${window.location.origin}/community/join/${group.invite_code}`;

  useEffect(() => {
    fetchGroupMembers(group.id).then(r => { setMembers(r.members || []); setLoading(false); });
  }, [fetchGroupMembers, group.id]);

  const shareInvite = async () => {
    try {
      if (navigator.share) await navigator.share({ title: group.name, text: group.name, url: inviteUrl });
      else { await navigator.clipboard.writeText(inviteUrl); toast.success(t(lang, 'linkCopied')); }
      onInviteAction?.();
    } catch { /* share dismissed */ }
  };

  const revealQR = () => {
    setShowQR(v => !v);
    if (!showQR) onInviteAction?.(); // showing the code to scan IS the invitation
  };

  return (
    <Modal title={`${t(lang, 'members')} (${members.length})`} lang={lang} onClose={onClose}>
      {/* Invite preview: what the person on the other end is being invited to. */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={CARD_STYLE}>
        <Avatar kind="group" name={group.name} avatar={avatarConfigFrom(group)} size={40} />
        <p className="text-sm font-semibold min-w-0 truncate" style={{ color: 'var(--text-1)' }}>{group.name}</p>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={shareInvite} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
          <Share2 size={15} /> {t(lang, 'shareInviteLink')}
        </button>
        {/* Icon-only, so it carries a real accessible name (not just a
            tooltip), a full 44×44 target, and disclosure semantics. */}
        <button
          onClick={revealQR}
          aria-label={t(lang, 'showQrCode')}
          aria-expanded={showQR}
          aria-controls="group-invite-qr"
          className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center focus-visible:ring-2"
          style={{ background: showQR ? 'var(--accent)' : 'var(--accent-soft)', color: showQR ? '#fff' : 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
        >
          <QrCode size={16} aria-hidden="true" />
        </button>
      </div>

      <ShareButtons url={inviteUrl} text={`${t(lang, 'joinMyGroup')} "${group.name}"`} copiedLabel={t(lang, 'linkCopied')} onShared={onInviteAction} />

      {showQR && (
        <div id="group-invite-qr" className="flex flex-col items-center gap-2 mb-4 p-4 rounded-xl" style={{ background: '#ffffff', border: '0.5px solid var(--border)' }}>
          <QRCodeSVG value={inviteUrl} size={170} bgColor="#ffffff" fgColor="#1a0a2e" level="M" />
          <p className="text-xs" style={{ color: '#475569' }}>{t(lang, 'scanToJoin')}</p>
          <p className="text-sm font-mono font-semibold tracking-wider" style={{ color: '#1a0a2e' }}>{group.invite_code}</p>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-3)' }} /></div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {members.map(m => (
            <div key={m.user_id} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={CARD_STYLE}>
              <Avatar name={m.name} avatar={m.avatar} size={32} />
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ color: 'var(--text-1)' }}>{m.name}{m.user_id === userId ? ` (${t(lang, 'you')})` : ''}</p>
                {m.user_id === group.created_by
                  ? <p className="text-xs" style={{ color: 'var(--accent)' }}>{t(lang, 'owner')}</p>
                  : m.role === 'admin'
                    ? <p className="text-xs" style={{ color: 'var(--accent)' }}>{t(lang, 'admin')}</p>
                    : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function Empty({ lang, title }) {
  return (
    <div className="text-center py-12">
      <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>{t(lang, title)}</p>
      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'beFirst')}</p>
    </div>
  );
}

// ── Group View ────────────────────────────────────────────────────────────────
function GroupView({ lang, user, groupId, onBack, onOpenPrayer }) {
  const { addPrayer, leaveGroup, migrateLegacyCommunityContent, communityEncryptionMigration } = useCommunityStore(
    useShallow((s) => ({
      addPrayer: s.addPrayer,
      leaveGroup: s.leaveGroup,
      migrateLegacyCommunityContent: s.migrateLegacyCommunityContent,
      communityEncryptionMigration: s.communityEncryptionMigration,
    }))
  );
  // Shared read-model + live sync (prayers, testimonies, subscription, auto-add).
  const { group, isAdmin, prayers, testimonies, loading, hasPrayedInGroup, handleToggleAutoAdd, avatarFor } = useGroupWall({ groupId, user });
  const categories = usePrayerStore(s => s.categories);
  const tr = useTranslationStore(s => s.tr);
  const [subTab, setSubTab] = useState('requests');
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [search, setSearch] = useState('');
  const [reqFilter, setReqFilter] = useState('all');
  // Bumped when an invite action records a checklist flag, so the checklist
  // behind an open modal re-derives its steps.
  const [, setChecklistVersion] = useState(0);

  // Upgrade this member's own legacy rows once the group wall is available.
  // The store scan is idempotent and exposes progress for slow/retried batches.
  useEffect(() => {
    if (!loading && group?.id && communityEncryptionMigration.groupId !== groupId) {
      migrateLegacyCommunityContent(groupId);
    }
  }, [communityEncryptionMigration.groupId, group?.id, groupId, loading, migrateLegacyCommunityContent]);
  // Group prayer plans (read-model, subscription, join/leave/end/adopt) live in a
  // dedicated hook; the picker/detail/confirm modals below consume its state.
  const {
    groupPlans, adoptedPlanIds,
    showPlanPicker, setShowPlanPicker,
    detailPlan, setDetailPlan,
    confirmEndPlan, setConfirmEndPlan,
    busyPlanId,
    handleJoinGroupPlan, handleLeaveGroupPlan, handleEndGroupPlan, handleAdoptGroupPlan,
  } = useGroupPlans({ groupId, user, lang });

  // An invitation genuinely went out (link shared/copied, QR shown, friend
  // invited) — only then does the checklist's Invite step record itself.
  const recordInviteAction = () => {
    setChecklistFlag(groupId, 'invited');
    setChecklistVersion((v) => v + 1);
  };

  // Search and status filters appear only when the group's data earns them;
  // a hidden control's state is inert so nothing filters invisibly.
  const controls = groupListControls(prayers);
  const effectiveFilter = controls.statusFilter ? reqFilter : 'all';
  const effectiveSearch = controls.search ? search : '';

  const filteredPrayers = prayers.filter(p => {
    if (effectiveFilter === 'active' && p.is_answered) return false;
    if (effectiveFilter === 'answered' && !p.is_answered) return false;
    if (effectiveSearch) {
      const q = effectiveSearch.toLowerCase();
      const hay = `${p.title} ${p.description || ''} ${p.is_anonymous ? '' : p.author_name || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const handleLeave = async () => {
    setLeaving(true);
    const res = await leaveGroup(groupId, user.id);
    setLeaving(false);
    if (res?.error) { toast.error(t(lang, 'errorGeneric')); return; }
    onBack();
  };

  return (
    <div className="phase-page constellation-community constellation-community-group min-h-screen">
      <div className="phase-page__shell pt-3 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 min-h-[44px] px-1 text-sm font-medium" style={{ color: 'var(--accent)' }}>
          <ArrowLeft size={16} /> {t(lang, 'together')}
        </button>
        <OverflowMenu
          lang={lang}
          ariaLabel={t(lang, 'groupOptions')}
          triggerClassName="flex items-center justify-center w-11 h-11 rounded-lg"
          triggerStyle={SUBTLE_BTN}
          items={[
            { key: 'members', icon: Users, label: t(lang, 'members'), onClick: () => setShowMembers(true) },
            { key: 'journey', icon: CalendarPlus, label: t(lang, 'groupJourneyStartCta'), onClick: () => setShowPlanPicker(true) },
            { key: 'settings', icon: SlidersHorizontal, label: t(lang, 'groupSettings'), onClick: () => setShowSettings(true) },
            { key: 'manage', icon: Settings, label: t(lang, 'manageGroup'), onClick: () => setShowAdmin(true), hidden: !isAdmin },
            { key: 'leave', icon: LogOut, label: t(lang, 'leaveGroup'), danger: true, onClick: () => setShowLeave(true) },
          ]}
        />
      </div>

      {showMembers && group && <MembersModal lang={lang} group={group} userId={user.id} onClose={() => setShowMembers(false)} onInviteAction={recordInviteAction} />}

      {showSettings && (
        <Modal title={t(lang, 'groupSettings')} lang={lang} onClose={() => setShowSettings(false)}>
          {/* Real switch semantics (role, checked state, label, keyboard) —
              the description stays plain text beside it, never a fake knob. */}
          <div className="flex items-start justify-between gap-3 w-full p-3 rounded-xl" style={CARD_STYLE}>
            <span className="min-w-0">
              <span className="block text-sm" style={{ color: 'var(--text-1)' }}>{t(lang, 'autoAddRequests')}</span>
              <span className="block text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{t(lang, 'autoAddRequestsSub')}</span>
            </span>
            <Switch checked={!!group?.autoAdd} onChange={handleToggleAutoAdd} label={t(lang, 'autoAddRequests')} />
          </div>
        </Modal>
      )}

      {showLeave && (
        <Modal title={t(lang, 'leaveGroup')} lang={lang} onClose={() => setShowLeave(false)}>
          <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>{t(lang, 'leaveGroupConfirm')}</p>
          <div className="flex gap-2">
            <button onClick={() => setShowLeave(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={SUBTLE_BTN}>{t(lang, 'cancel')}</button>
            <button onClick={handleLeave} disabled={leaving} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40" style={{ background: 'var(--danger)' }}>
              {leaving ? <Loader2 size={14} className="animate-spin mx-auto" /> : t(lang, 'leaveGroup')}
            </button>
          </div>
        </Modal>
      )}

      {showNewRequest && <PrayerForm communityMode onClose={() => setShowNewRequest(false)}
        onCommunitySubmit={async ({ title, description, isAnonymous, categoryIds, contentLanguage }) => {
          // The form's language field already defaults to the active language;
          // an explicit correction arrives here and wins.
          const result = await addPrayer({ groupId, userId: user.id, authorName: getAuthorName(user), title, description, isAnonymous, categoryIds, contentLanguage: contentLanguage || lang });
          if (result?.error) toast.error(t(lang, 'errorGeneric'));
          return result;
        }} />}

      {showAdmin && group && <GroupAdminModal lang={lang} userId={user.id} group={group} onClose={() => setShowAdmin(false)} onInviteAction={recordInviteAction} />}

      {/* Only reviewed journeys appear in the group's chooser. Content awaiting
          theology, safety, language, or editorial review is not a user task. */}
      {showPlanPicker && (
        <Modal title={t(lang, 'groupPlanPickerTitle')} lang={lang} onClose={() => setShowPlanPicker(false)}>
          <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'groupPlanPickerSub')}</p>
          <div className="grid grid-cols-1 gap-2">
            {plansByCategory()
              .map((group) => ({ ...group, plans: group.plans.filter(isPlanReviewed) }))
              .filter((group) => group.plans.length > 0)
              .map((group) => (
              <section key={group.id}>
                <h4 className="mb-2 mt-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                  {t(lang, group.labelKey)}
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {group.plans.map((plan) => {
                    const adopted = adoptedPlanIds.has(plan.id);
                    return (
                      <button
                        key={plan.id}
                        disabled={adopted}
                        onClick={() => { setShowPlanPicker(false); setDetailPlan(plan); }}
                        className="phase-card plan-card p-3 flex items-start gap-3 text-start w-full disabled:opacity-50"
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: 'var(--accent-soft)' }}>{plan.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, plan.titleKey)}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                            {adopted ? t(lang, 'groupPlanAlreadyRunning') : `${t(lang, plan.subKey)} · ${t(lang, 'planDays', { n: plan.count })}`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </Modal>
      )}

      {detailPlan && (
        <PlanDetailModal
          plan={detailPlan}
          lang={lang}
          running={adoptedPlanIds.has(detailPlan.id)}
          runningLabel={t(lang, 'groupPlanAlreadyRunning')}
          ctaLabel={t(lang, 'groupPlanAdoptCta')}
          footnote={t(lang, 'groupPlanAdoptNote')}
          onStart={handleAdoptGroupPlan}
          onClose={() => setDetailPlan(null)}
        />
      )}

      {confirmEndPlan && (
        <ConfirmDialog
          title={t(lang, 'groupPlanEnd')}
          message={`${planById(confirmEndPlan.plan_id) ? t(lang, planById(confirmEndPlan.plan_id).titleKey) : ''} — ${t(lang, 'groupPlanEndConfirm')}`}
          confirmLabel={t(lang, 'groupPlanEnd')}
          cancelLabel={t(lang, 'cancel')}
          danger
          loading={busyPlanId === confirmEndPlan.id}
          onConfirm={() => handleEndGroupPlan(confirmEndPlan)}
          onCancel={() => setConfirmEndPlan(null)}
        />
      )}

      <div className="phase-content max-w-4xl">
        <div className="group-header mb-5 flex items-start gap-3">
          <Avatar kind="group" name={group?.name || ''} avatar={avatarConfigFrom(group)} size={48} className="mt-1" />
          <div className="min-w-0">
            <p className="section-label mb-2">{t(lang, 'together')}</p>
            <h1 className="page-header__title break-words" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', overflowWrap: 'anywhere' }}>{group?.name}</h1>
          </div>
        </div>

        {/* First-group checklist — leaders only, dismissible, retires itself as
            the steps complete. Its rows are shortcuts to actions on this page. */}
        {communityEncryptionMigration.groupId === groupId
          && (communityEncryptionMigration.total > 0 || communityEncryptionMigration.status === 'error')
          && communityEncryptionMigration.status !== 'complete' && (
          <div className="phase-card phase-card--quiet flex items-center gap-3 p-3 mb-4" role="status">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              {communityEncryptionMigration.status === 'migrating'
                ? <Loader2 size={17} className="animate-spin" />
                : <ShieldCheck size={17} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                {communityEncryptionMigration.status === 'error'
                  ? t(lang, 'errorBoundaryTitle')
                  : t(lang, 'vaultMigratePending', { count: communityEncryptionMigration.total })}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                {['partial', 'error'].includes(communityEncryptionMigration.status)
                  ? t(lang, 'vaultMigratePartial')
                  : `${communityEncryptionMigration.completed} / ${communityEncryptionMigration.total}`}
              </p>
            </div>
            {['partial', 'error'].includes(communityEncryptionMigration.status) && (
              <button
                type="button"
                onClick={() => migrateLegacyCommunityContent(groupId)}
                className="px-3 py-2 rounded-lg text-xs font-medium"
                style={SUBTLE_BTN}
              >
                {t(lang, 'retry')}
              </button>
            )}
          </div>
        )}

        {isAdmin && group && !loading && (
          <GroupChecklist
            lang={lang}
            group={group}
            requestCount={prayers.length}
            hasPrayed={hasPrayedInGroup}
            onInvite={() => setShowMembers(true)}
            onAddRequest={() => setShowNewRequest(true)}
            onPray={() => {
              // Open the first request to pray over it. The step completes only
              // through a genuine prayer action ("I'm praying" → hasPrayed) —
              // never because a detail page was merely opened.
              if (prayers[0]) onOpenPrayer(prayers[0].id);
            }}
          />
        )}

        {/* Praying together — plans the whole group is walking through. Persistent
            and shown to every member, so someone who joins the group later sees
            it here and can join in. Placed above the tabs so it's not missed. */}
        {groupPlans.length > 0 && (
          <div className="mb-6">
            <h2 className="phase-section-heading flex items-center gap-2">
              <HeartHandshake size={18} style={{ color: 'var(--accent)' }} /> {t(lang, 'groupPlansHeading')}
            </h2>
            <div className="flex flex-col gap-2">
              {sortGroupPlans(groupPlans, todayKey()).map((gp) => {
                const plan = planById(gp.plan_id);
                if (!plan) return null;
                const status = groupPlanStatus(gp.start_date, todayKey());
                const canEnd = gp.added_by === user.id || isAdmin;
                const count = prayingLabel({ count: gp.participantCount, joinedByMe: gp.joinedByMe });
                const menuItems = [];
                if (gp.joinedByMe) menuItems.push({ key: 'leave', icon: LogOut, label: t(lang, 'groupPlanLeave'), onClick: () => handleLeaveGroupPlan(gp) });
                if (canEnd) menuItems.push({ key: 'end', icon: Trash2, label: t(lang, 'groupPlanEnd'), danger: true, onClick: () => setConfirmEndPlan(gp) });
                return (
                  <div key={gp.id} className="phase-card community-card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'var(--accent-soft)' }}>
                      {plan.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>{t(lang, plan.titleKey)}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>
                        {status === 'running' ? t(lang, 'groupPlanRunningNow') : t(lang, 'groupPlanStartsOn', { date: formatPlanDate(gp.start_date, lang) })}
                        {' · '}{t(lang, count.key, count.vars)}
                      </p>
                    </div>
                    {gp.joinedByMe ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                        <Check size={13} /> {t(lang, 'groupPlanJoinedBadge')}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleJoinGroupPlan(gp)}
                        disabled={busyPlanId === gp.id}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-40"
                        style={{ background: 'var(--accent)' }}
                      >
                        {busyPlanId === gp.id ? <Loader2 size={13} className="animate-spin" /> : t(lang, 'groupPlanJoinCta')}
                      </button>
                    )}
                    {menuItems.length > 0 && (
                      <OverflowMenu lang={lang} ariaLabel={t(lang, 'groupPlansHeading')} items={menuItems}
                        triggerClassName="p-1.5 rounded-lg shrink-0 flex items-center justify-center" triggerStyle={SUBTLE_BTN} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-1 mb-5">
          {['requests', 'testimonies'].map(tab => (
            <button key={tab} onClick={() => setSubTab(tab)} className="px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium transition-all"
              style={{ background: subTab === tab ? 'var(--accent)' : 'var(--input-bg)', color: subTab === tab ? '#fff' : 'var(--text-2)', border: '0.5px solid var(--input-border)' }}>
              {tab === 'requests' ? t(lang, 'prayerRequests') : t(lang, 'testimonies')}
            </button>
          ))}
        </div>

        {subTab === 'requests' && (
          <>
            {/* One visible action keeps the group focused on prayer. Invitations,
                journeys, members, and administration stay in the group menu. */}
            {prayers.length > 0 && (
              <div className="constellation-community-group__actions mb-4">
                <button onClick={() => setShowNewRequest(true)} className="flex w-full items-center gap-2 py-3 rounded-xl text-sm font-medium justify-center text-white" style={{ background: 'var(--accent)' }}>
                  <Plus size={16} /> {t(lang, 'newRequest')}
                </button>
              </div>
            )}

            {/* List tools appear progressively: search once the wall is long
                enough to need it, status filters once both states exist. A
                small young group keeps a clean page. */}
            {(controls.search || controls.statusFilter) && (
              <div className="mb-4 space-y-2.5">
                {controls.search && (
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t(lang, 'searchRequests')}
                      aria-label={t(lang, 'searchRequests')}
                      className="w-full text-sm rounded-xl pl-9 pr-3 py-2.5 focus:outline-none" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }} />
                  </div>
                )}
                {controls.statusFilter && (
                  <div className="flex gap-2">
                    {['all', 'active', 'answered'].map(f => (
                      <button key={f} onClick={() => setReqFilter(f)} aria-pressed={reqFilter === f}
                        className="min-h-[44px] text-xs px-3 py-1.5 rounded-full font-medium"
                        style={reqFilter === f ? { background: 'var(--accent)', color: '#fff' } : SUBTLE_BTN}>
                        {t(lang, f === 'all' ? 'all' : f === 'active' ? 'active' : 'answered')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {loading ? (
              <PrayerListSkeleton />
            ) : prayers.length === 0 ? (
              // ONE contextual action for an empty group — no competing buttons.
              <div className="text-center py-12">
                <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>{t(lang, 'noRequests')}</p>
                <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>{t(lang, 'beFirst')}</p>
                <button onClick={() => setShowNewRequest(true)} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--accent)' }}>
                  <Plus size={16} /> {t(lang, 'newRequest')}
                </button>
              </div>
            ) : filteredPrayers.length === 0 ? (
              <p className="text-center text-sm py-10" style={{ color: 'var(--text-3)' }}>{t(lang, 'noMatch')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredPrayers.map(p => (
                  <button key={p.id} onClick={() => onOpenPrayer(p.id)} className="phase-card community-card constellation-community-prayer p-4 text-left">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={p.is_anonymous ? '?' : p.author_name} avatar={p.is_anonymous ? null : avatarFor(p.user_id)} size={26} anonymous={p.is_anonymous} />
                        <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                          {communityAuthor(p, user.id, lang)} · {timeAgo(p.created_at, lang)}
                        </p>
                      </div>
                      {p.is_answered && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                          <Check size={11} /> {t(lang, 'answered2')}
                        </span>
                      )}
                    </div>
                    {p._locked ? (
                      <p className="text-sm font-medium mb-2"><LockedNotice lang={lang} inline /></p>
                    ) : (
                      <>
                        <p className="constellation-community-prayer__title text-sm font-medium mb-2" style={{ color: 'var(--text-1)', textDecoration: p.is_answered ? 'line-through' : 'none', opacity: p.is_answered ? 0.7 : 1 }}>
                          <Star size={17} strokeWidth={1.7} aria-hidden="true" />
                          <span>{p.title}</span>
                        </p>
                        {p.description && <RichText text={p.description} className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-2)' }} />}
                      </>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={SUBTLE_BTN}>
                        <HandHeart size={13} /> {p.prayer_reactions?.[0]?.count ?? 0}
                      </span>
                      {(p.community_updates?.[0]?.count ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                          <MessageSquare size={13} /> {p.community_updates[0].count}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {subTab === 'testimonies' && (
          testimonies.length === 0 ? (
            <Empty lang={lang} title="noTestimonies" />
          ) : (
            groupByThisMonth(testimonies, tm => tm.created_at).map(g => (
              <div key={g.key} className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
                  {t(lang, g.key)}
                </p>
                <div className="flex flex-col gap-3">
                  {g.items.map(testimony => {
                    const linkedPrayer = testimony.community_prayers;
                    const testimonyCategories = categories.filter(c => (linkedPrayer?.category_ids || []).includes(c.id));
                    return (
                      <button
                        key={testimony.id}
                        onClick={() => onOpenPrayer(testimony.community_prayer_id)}
                        className="phase-card community-card w-full text-left p-4"
                        style={{ borderInlineStart: '3px solid var(--success)' }}
                      >
                        <div className="flex items-center gap-2 mb-1.5 min-w-0">
                          <Avatar name={testimony.is_anonymous ? '?' : testimony.author_name} avatar={testimony.is_anonymous ? null : avatarFor(testimony.user_id)} size={26} anonymous={testimony.is_anonymous} />
                          <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                            {communityAuthor(testimony, user.id, lang)} · {timeAgo(testimony.created_at, lang)}
                          </p>
                        </div>
                        {linkedPrayer?.title && (
                          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-1)' }}>{linkedPrayer.title}</p>
                        )}
                        {testimonyCategories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {testimonyCategories.map(c => (
                              <span key={c.id} className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: c.color }}>
                                {c.emoji} {tr(c.name, lang)}
                              </span>
                            ))}
                          </div>
                        )}
                        {testimony._locked
                          ? <LockedNotice lang={lang} inline />
                          // Preview only — media plays on the prayer's page, so a
                          // media-only testimony shows a 📎 count, not empty quotes.
                          : <p className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>
                              🎉 {testimony.content ? `"${testimony.content}"` : ''}
                              {(testimony.attachments?.length ?? 0) > 0 && ` 📎 ${testimony.attachments.length}`}
                            </p>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

// ── Community prayer detail (/community/group/:groupId/prayer/:prayerId) ───────
function CommunityPrayerView({ lang, user, groupId, prayerId, onBack }) {
  const { prayers, activeGroupId, loading, setActiveGroup, fetchUserReactions } = useCommunityStore(
    useShallow((s) => ({
      prayers: s.prayers,
      activeGroupId: s.activeGroupId,
      loading: s.loading,
      setActiveGroup: s.setActiveGroup,
      fetchUserReactions: s.fetchUserReactions,
    }))
  );

  useEffect(() => { if (groupId && groupId !== activeGroupId) setActiveGroup(groupId); }, [activeGroupId, groupId, setActiveGroup]);
  useEffect(() => { if (groupId && user?.id) fetchUserReactions(groupId, user.id); }, [fetchUserReactions, groupId, user?.id]);

  const prayer = prayers.find(p => p.id === prayerId);
  if (!prayer) {
    if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} /></div>;
    return <Navigate to={`/community/group/${groupId}`} replace />;
  }
  return <PrayerDetail communityPrayer={prayer} onBack={onBack} lang={lang} />;
}

// ── Main Community Tab (URL-driven) ───────────────────────────────────────────
export default function CommunityTab() {
  const settings = usePrayerStore((s) => s.settings);
  const lang = settings.language || 'en';
  const { user } = useAuthStore();
  const fetchGroups = useCommunityStore((s) => s.fetchGroups);
  const { groupId, prayerId } = useParams();
  const navigate = useNavigate();

  useEffect(() => { if (user?.id) fetchGroups(user.id); }, [fetchGroups, user?.id]);

  if (!user) return null;

  if (groupId && prayerId) {
    return <CommunityPrayerView lang={lang} user={user} groupId={groupId} prayerId={prayerId}
      onBack={() => navigate(`/community/group/${groupId}`)} />;
  }
  if (groupId) {
    return <GroupView lang={lang} user={user} groupId={groupId}
      onBack={() => navigate('/community')}
      onOpenPrayer={(pid) => navigate(`/community/group/${groupId}/prayer/${pid}`)} />;
  }
  return (
    <CommunityHub
      lang={lang}
      userId={user.id}
      onViewGroup={(gid) => navigate(`/community/group/${gid}`)}
    />
  );
}
