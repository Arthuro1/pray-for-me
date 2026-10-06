import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Users, Plus, Loader2, ArrowLeft, Settings, SlidersHorizontal, Trash2, LogOut, Search, Share2, QrCode, ShieldCheck, ShieldOff, DoorOpen, UsersRound, UserPlus, CalendarPlus, ChevronRight, Paperclip } from 'lucide-react';
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
import { PLAN_SOURCES } from '../lib/planAnalytics';
import { runningPlanIds } from '../lib/planner';
import { todayKey } from '../lib/prayedLog';
import { plansByCategory } from '../content/prayerPlans';
import PlanDetailModal from '../components/PlanDetailModal';
import { isPlanReviewed } from '../lib/planReview';
import { groupPlanStatus, sortGroupPlans, prayingLabel } from '../lib/groupPlans';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import LockedNotice from '../components/LockedNotice';
import ShareButtons from '../components/shared/ShareButtons';
import Switch from '../components/shared/Switch';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader, PrimaryButton, QuietButton, SecondaryButton, SegmentedControl, StatusLabel } from '../components/shared/Primitives';
import RiseMark from '../components/shared/RiseMark';
import { Modal, CreateGroupModal, JoinGroupModal, AddFriendModal } from './community/GroupFriendModals';
import useCommunityHubData from './community/useCommunityHubData';
import useGroupPlans from './community/useGroupPlans';
import useGroupWall from './community/useGroupWall';
import GroupPrayerRow from './community/GroupPrayerRow';
// Back to Together — the arrow follows the reading direction.
function BackArrow(props) {
  return <ArrowLeft className="rtl-mirror" {...props} />;
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

// Something awaiting a decision (a friend request, an invitation): who, what,
// and the two answers — never more.
function ActionRow({ label, sublabel, avatarName, avatar, avatarKind = 'user', primaryText, onPrimary, onSecondary, secondaryText, busy }) {
  return (
    <li className="together-row together-row--decide">
      {avatarName && <Avatar name={avatarName} avatar={avatar} kind={avatarKind} size={36} />}
      <span className="together-row__body">
        <span className="together-row__name">{label}</span>
        {sublabel && <span className="together-row__meta">{sublabel}</span>}
      </span>
      <span className="together-row__actions">
        <SecondaryButton onClick={onSecondary} disabled={busy}>{secondaryText}</SecondaryButton>
        <PrimaryButton onClick={onPrimary} disabled={busy}>
          {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : primaryText}
        </PrimaryButton>
      </span>
    </li>
  );
}

// A titled list on the page: a small label and rows divided by hairlines.
function Section({ title, split = false, children }) {
  return (
    <section className="together-section">
      <h2 className="section-label">{title}</h2>
      <ul className={`together-list ${split ? 'together-list--split' : ''}`}>{children}</ul>
    </section>
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
      navigate('/plans', { state: { source: PLAN_SOURCES.INVITATION } });
      return {};
    }
    const started = await startGuidedPlan({
      plan, startDate: res.startDate, lang, addPrayer: usePrayerStore.getState().addPrayer,
      source: PLAN_SOURCES.INVITATION,
    });
    if (!started.ok && started.reason === 'personalize') {
      navigate('/plans', { state: { source: PLAN_SOURCES.INVITATION, guidedJourneyStart: { planId: plan.id, startDate: res.startDate } } });
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
      <div className="phase-page">
        <div className="phase-content pt-12"><PrayerListSkeleton count={3} /></div>
      </div>
    );
  }

  return (
    <div className="phase-page together min-h-screen">
      <div className="phase-page__shell">
        {/* Once groups exist they lead the page; joining another group, creating
            one or adding a friend become one quiet header action. Join stays
            reachable — invitations arrive by code. */}
        <PageHeader
          title={t(lang, 'together')}
          aside={groups.length > 0 ? (
            <OverflowMenu
              lang={lang}
              ariaLabel={t(lang, 'add')}
              triggerIcon={Plus}
              triggerClassName="icon-button pressable -me-2"
              items={[
                { key: 'join', icon: DoorOpen, label: t(lang, 'joinGroupCta'), onClick: () => setShowJoinGroup(true) },
                { key: 'create', icon: UsersRound, label: t(lang, 'createGroup'), onClick: () => setShowCreateGroup(true) },
                { key: 'person', icon: UserPlus, label: t(lang, 'addPerson'), onClick: () => setShowAddFriend(true) },
              ]}
            />
          ) : undefined}
        />
      </div>

      <div className="phase-content">
        {/* An empty Together gets ONE invitation — join first (most believers
            are invited into an existing group), create second, add a friend as
            a quiet text action. No second empty state below. */}
        {groups.length === 0 && (
          <div className="together-empty">
            <RiseMark motion="still" size={40} />
            <h2 className="together-empty__title">{t(lang, 'prayWithOthers')}</h2>
            <p className="together-empty__body">{t(lang, 'communityEmptyDesc')}</p>
            <div className="together-empty__actions">
              <PrimaryButton icon={DoorOpen} onClick={() => setShowJoinGroup(true)}>{t(lang, 'joinGroupCta')}</PrimaryButton>
              <SecondaryButton icon={UsersRound} onClick={() => setShowCreateGroup(true)}>{t(lang, 'createGroup')}</SecondaryButton>
              <QuietButton icon={UserPlus} onClick={() => setShowAddFriend(true)}>{t(lang, 'addFriend')}</QuietButton>
            </div>
          </div>
        )}

        {/* Needs attention: ONLY when something actually awaits a decision —
            incoming friend requests and invitations. Never a statistics block. */}
        {(friendRequests.length > 0 || groupInvitations.length > 0 || planInvitations.length > 0) && (
          <Section title={t(lang, 'needsAttention')}>
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

        {groups.length > 0 && (
          <Section title={t(lang, 'myGroups')} split>
            {groups.map(g => (
              <li key={g.id}>
                <button type="button" onClick={() => onViewGroup(g.id)} className="together-row pressable">
                  <Avatar kind="group" name={g.name} avatar={avatarConfigFrom(g)} size={40} />
                  <span className="together-row__body">
                    <span className="together-row__name together-row__name--editorial">{g.name}</span>
                    {g.role === 'admin' && <span className="together-row__meta">{t(lang, 'admin')}</span>}
                  </span>
                  {unread[g.id] > 0 && <StatusLabel tone="royal">{t(lang, 'newCount', { n: unread[g.id] })}</StatusLabel>}
                  <ChevronRight size={16} className="rtl-mirror shrink-0" style={{ color: 'var(--q-text-tertiary)' }} aria-hidden="true" />
                </button>
              </li>
            ))}
          </Section>
        )}

        {friends.length > 0 && (
          <Section title={`${t(lang, 'peopleView')} · ${friends.length}`} split>
            {friends.map(f => (
              <li key={f.id} className="together-row">
                <Avatar name={f.name} avatar={f.avatar} size={32} />
                <span className="together-row__body"><span className="together-row__name">{f.name}</span></span>
                <QuietButton onClick={() => handleRemoveFriend(f)} disabled={busyId === f.id} style={{ color: 'var(--q-text-secondary)' }}>
                  {t(lang, 'remove')}
                </QuietButton>
              </li>
            ))}
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
      {/* Only admins and the group's creator can restyle a group — the same
          rule the "Admins can update their group" policy enforces server-side. */}
      {canEditAvatar && (
        <div className="q-dialog__section">
          <p className="section-label">{t(lang, 'groupAvatar')}</p>
          <p className="q-field__hint mb-3">{t(lang, 'groupAvatarHint')}</p>
          <AvatarEditor lang={lang} kind="group" name={group.name} avatar={avatarConfigFrom(group)} ownerId={group.id} onSave={handleAvatarSave} />
        </div>
      )}

      <div className="q-dialog__section">
        <label htmlFor="group-rename" className="section-label block mb-2">{t(lang, 'renameGroup')}</label>
        <div className="flex gap-2">
          <input id="group-rename" value={name} onChange={e => setName(e.target.value)} placeholder={t(lang, 'groupName')}
            onKeyDown={e => e.key === 'Enter' && handleRename()}
            className="q-input min-w-0 flex-1" />
          <PrimaryButton onClick={handleRename} disabled={!name.trim() || name.trim() === group.name || renaming}>
            {renaming ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : t(lang, 'save')}
          </PrimaryButton>
        </div>
      </div>

      <div className="q-dialog__section">
        <p className="section-label">{t(lang, 'inviteFriends')}</p>
        {invitable.length === 0 ? (
          <p className="q-meta">{t(lang, 'noFriendsToInvite')}</p>
        ) : (
          <ul className="member-list">
            {invitable.map(f => (
              <li key={f.id} className="member-row">
                <Avatar name={f.name} avatar={f.avatar} size={30} />
                <span className="member-row__name">{f.name}</span>
                <SecondaryButton onClick={() => handleInvite(f.id)} disabled={busyId === f.id || invited[f.id]}>
                  {invited[f.id] ? t(lang, 'invited') : t(lang, 'invite')}
                </SecondaryButton>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="q-dialog__section">
        <p className="section-label">{t(lang, 'members')} · {members.length}</p>
        <ul className="member-list">
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
              <li key={m.user_id} className="member-row">
                <Avatar name={m.name} avatar={m.avatar} size={30} />
                <span className="member-row__name">
                  <span className="block truncate">{m.name}{isSelf ? ` (${t(lang, 'you')})` : ''}</span>
                  {isOwner
                    ? <span className="member-row__role">{t(lang, 'owner')}</span>
                    : isMemberAdmin
                      ? <span className="member-row__role">{t(lang, 'admin')}</span>
                      : null}
                </span>
                {menuItems.length > 0 && (
                  busyId === m.user_id
                    ? <Loader2 size={16} className="animate-spin shrink-0" style={{ color: 'var(--q-text-tertiary)' }} />
                    : <OverflowMenu lang={lang} ariaLabel={t(lang, 'memberActions')} items={menuItems} triggerClassName="icon-button pressable shrink-0" />
                )}
              </li>
            );
          })}
        </ul>
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
    <Modal title={`${t(lang, 'members')} · ${members.length}`} lang={lang} onClose={onClose}>
      {/* Invite preview: what the person on the other end is being invited to. */}
      <div className="mb-5 flex items-center gap-3">
        <Avatar kind="group" name={group.name} avatar={avatarConfigFrom(group)} size={40} />
        <p className="together-row__name together-row__name--editorial min-w-0">{group.name}</p>
      </div>
      <div className="mb-2 flex gap-2">
        <PrimaryButton icon={Share2} onClick={shareInvite} className="flex-1">{t(lang, 'shareInviteLink')}</PrimaryButton>
        {/* Icon-only, so it carries a real accessible name (not just a
            tooltip), a full 44×44 target, and disclosure semantics. */}
        <button
          type="button"
          onClick={revealQR}
          aria-label={t(lang, 'showQrCode')}
          aria-expanded={showQR}
          aria-controls="group-invite-qr"
          className="icon-button icon-button--outlined pressable shrink-0"
        >
          <QrCode size={18} aria-hidden="true" />
        </button>
      </div>

      <ShareButtons url={inviteUrl} text={`${t(lang, 'joinMyGroup')} "${group.name}"`} copiedLabel={t(lang, 'linkCopied')} onShared={onInviteAction} />

      {showQR && (
        <div id="group-invite-qr" className="invite-code">
          <QRCodeSVG value={inviteUrl} size={170} bgColor="#ffffff" fgColor="#29213F" level="M" />
          <p className="invite-code__hint">{t(lang, 'scanToJoin')}</p>
          <p className="invite-code__value">{group.invite_code}</p>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--q-text-tertiary)' }} /></div>
      ) : (
        <ul className="member-list mt-2">
          {members.map(m => (
            <li key={m.user_id} className="member-row">
              <Avatar name={m.name} avatar={m.avatar} size={32} />
              <span className="member-row__name">
                <span className="block truncate">{m.name}{m.user_id === userId ? ` (${t(lang, 'you')})` : ''}</span>
                {m.user_id === group.created_by
                  ? <span className="member-row__role">{t(lang, 'owner')}</span>
                  : m.role === 'admin'
                    ? <span className="member-row__role">{t(lang, 'admin')}</span>
                    : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function Empty({ lang, title }) {
  return (
    <div className="journal__no-match">
      <p className="mb-1 text-sm" style={{ color: 'var(--q-text-secondary)' }}>{t(lang, title)}</p>
      <p className="q-meta">{t(lang, 'beFirst')}</p>
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
    <div className="phase-page together together-group min-h-screen">
      <div className="phase-page__shell together-bar">
        <QuietButton onClick={onBack} icon={BackArrow} iconSize={16} className="-ms-3">
          {t(lang, 'together')}
        </QuietButton>
        <OverflowMenu
          lang={lang}
          ariaLabel={t(lang, 'groupOptions')}
          triggerClassName="icon-button pressable -me-2"
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
          <div className="flex w-full items-start justify-between gap-4">
            <span className="min-w-0">
              <span className="block text-[0.9375rem]" style={{ color: 'var(--q-text)' }}>{t(lang, 'autoAddRequests')}</span>
              <span className="q-field__hint mt-1 block">{t(lang, 'autoAddRequestsSub')}</span>
            </span>
            <Switch checked={!!group?.autoAdd} onChange={handleToggleAutoAdd} label={t(lang, 'autoAddRequests')} />
          </div>
        </Modal>
      )}

      {showLeave && (
        <Modal title={t(lang, 'leaveGroup')} lang={lang} onClose={() => setShowLeave(false)}>
          <p className="text-[0.9375rem] leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>{t(lang, 'leaveGroupConfirm')}</p>
          <div className="q-dialog__actions">
            <SecondaryButton onClick={() => setShowLeave(false)}>{t(lang, 'cancel')}</SecondaryButton>
            <PrimaryButton danger onClick={handleLeave} disabled={leaving}>
              {leaving ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : t(lang, 'leaveGroup')}
            </PrimaryButton>
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
          <p className="q-field__hint mb-4">{t(lang, 'groupPlanPickerSub')}</p>
          {plansByCategory()
            .map((category) => ({ ...category, plans: category.plans.filter(isPlanReviewed) }))
            .filter((category) => category.plans.length > 0)
            .map((category) => (
            <section key={category.id} className="q-dialog__section">
              <h3 className="section-label">{t(lang, category.labelKey)}</h3>
              <ul className="together-list">
                {category.plans.map((plan) => {
                  const adopted = adoptedPlanIds.has(plan.id);
                  return (
                    <li key={plan.id}>
                      <button
                        type="button"
                        disabled={adopted}
                        onClick={() => { setShowPlanPicker(false); setDetailPlan(plan); }}
                        className="together-row pressable disabled:opacity-50"
                      >
                        <span className="together-row__body">
                          <span className="together-row__name together-row__name--editorial">{t(lang, plan.titleKey)}</span>
                          <span className="together-row__meta">
                            {adopted ? t(lang, 'groupPlanAlreadyRunning') : `${t(lang, plan.subKey)} · ${t(lang, 'planDays', { n: plan.count })}`}
                          </span>
                        </span>
                        <ChevronRight size={16} className="rtl-mirror shrink-0" style={{ color: 'var(--q-text-tertiary)' }} aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
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

      <div className="phase-content">
        <header className="together-group-header">
          <Avatar kind="group" name={group?.name || ''} avatar={avatarConfigFrom(group)} size={56} />
          <div className="min-w-0">
            <p className="section-label mb-2">{t(lang, 'together')}</p>
            <h1 className="together-group-header__title">{group?.name}</h1>
          </div>
        </header>

        {communityEncryptionMigration.groupId === groupId
          && (communityEncryptionMigration.total > 0 || communityEncryptionMigration.status === 'error')
          && communityEncryptionMigration.status !== 'complete' && (
          <div className="together-status" role="status">
            {communityEncryptionMigration.status === 'migrating'
              ? <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              : <ShieldCheck size={18} aria-hidden="true" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--q-text)' }}>
                {communityEncryptionMigration.status === 'error'
                  ? t(lang, 'errorBoundaryTitle')
                  : t(lang, 'vaultMigratePending', { count: communityEncryptionMigration.total })}
              </p>
              <p className="q-meta">
                {['partial', 'error'].includes(communityEncryptionMigration.status)
                  ? t(lang, 'vaultMigratePartial')
                  : `${communityEncryptionMigration.completed} / ${communityEncryptionMigration.total}`}
              </p>
            </div>
            {['partial', 'error'].includes(communityEncryptionMigration.status) && (
              <QuietButton onClick={() => migrateLegacyCommunityContent(groupId)}>{t(lang, 'retry')}</QuietButton>
            )}
          </div>
        )}

        {/* First-group checklist — leaders only, dismissible, retires itself as
            the steps complete. Its rows are shortcuts to actions on this page. */}
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
              // through a genuine prayer action ("Carry this prayer" →
              // hasPrayed) — never because a detail page was merely opened.
              if (prayers[0]) onOpenPrayer(prayers[0].id);
            }}
          />
        )}

        {/* Praying together — plans the whole group is walking through. Persistent
            and shown to every member, so someone who joins the group later sees
            it here and can join in. Placed above the tabs so it's not missed. */}
        {groupPlans.length > 0 && (
          <section className="together-plans">
            <h2 className="section-label mb-2">{t(lang, 'groupPlansHeading')}</h2>
            <ul className="together-list">
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
                  <li key={gp.id} className="together-row">
                    <span className="together-row__body">
                      <span className="together-row__name together-row__name--editorial">{t(lang, plan.titleKey)}</span>
                      <span className="together-row__meta">
                        {status === 'running' ? t(lang, 'groupPlanRunningNow') : t(lang, 'groupPlanStartsOn', { date: formatPlanDate(gp.start_date, lang) })}
                        {' · '}{t(lang, count.key, count.vars)}
                      </span>
                    </span>
                    <span className="together-row__actions">
                      {gp.joinedByMe ? (
                        <StatusLabel tone="royal">{t(lang, 'groupPlanJoinedBadge')}</StatusLabel>
                      ) : (
                        <SecondaryButton onClick={() => handleJoinGroupPlan(gp)} disabled={busyPlanId === gp.id}>
                          {busyPlanId === gp.id ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : t(lang, 'groupPlanJoinCta')}
                        </SecondaryButton>
                      )}
                      {menuItems.length > 0 && (
                        <OverflowMenu lang={lang} ariaLabel={t(lang, 'groupPlansHeading')} items={menuItems} triggerClassName="icon-button pressable shrink-0" />
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <SegmentedControl
          className="together-tabs"
          label={group?.name || t(lang, 'together')}
          value={subTab}
          onChange={setSubTab}
          options={[
            { value: 'requests', label: t(lang, 'prayerRequests') },
            { value: 'testimonies', label: t(lang, 'testimonies') },
          ]}
        />

        {subTab === 'requests' && (
          <>
            {/* One visible action keeps the group focused on prayer. Invitations,
                journeys, members, and administration stay in the group menu. */}
            {prayers.length > 0 && (
              <PrimaryButton icon={Plus} onClick={() => setShowNewRequest(true)} className="together-new">
                {t(lang, 'newRequest')}
              </PrimaryButton>
            )}

            {/* List tools appear progressively: search once the wall is long
                enough to need it, status filters once both states exist. A
                small young group keeps a clean page. */}
            {(controls.search || controls.statusFilter) && (
              <div className="together-tools">
                {controls.search && (
                  <div className="journal-search">
                    <Search size={16} className="journal-search__icon" aria-hidden="true" />
                    <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t(lang, 'searchRequests')}
                      aria-label={t(lang, 'searchRequests')}
                      className="q-input" />
                  </div>
                )}
                {controls.statusFilter && (
                  <div className="journal__tool-row" role="group" aria-label={t(lang, 'prayerRequests')}>
                    {['all', 'active', 'answered'].map((value) => (
                      <button key={value} type="button" onClick={() => setReqFilter(value)} aria-pressed={reqFilter === value} className="journal__tool pressable">
                        {t(lang, value)}
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
              <div className="journal__no-match">
                <p className="mb-1 text-sm" style={{ color: 'var(--q-text-secondary)' }}>{t(lang, 'noRequests')}</p>
                <p className="q-meta mb-6">{t(lang, 'beFirst')}</p>
                <PrimaryButton icon={Plus} onClick={() => setShowNewRequest(true)}>{t(lang, 'newRequest')}</PrimaryButton>
              </div>
            ) : filteredPrayers.length === 0 ? (
              <p className="journal__no-match q-meta">{t(lang, 'noMatch')}</p>
            ) : (
              <ul className="together-wall">
                {filteredPrayers.map(p => (
                  <GroupPrayerRow key={p.id} prayer={p} user={user} lang={lang} avatar={avatarFor(p.user_id)} onOpen={() => onOpenPrayer(p.id)} />
                ))}
              </ul>
            )}
          </>
        )}

        {/* Testimonies — remembrance, kept with honour: the prayer it answers,
            the words of the one who testifies, a gold line. No emoji, no
            celebration; the app records, it never declares. */}
        {subTab === 'testimonies' && (
          testimonies.length === 0 ? (
            <Empty lang={lang} title="noTestimonies" />
          ) : (
            groupByThisMonth(testimonies, tm => tm.created_at).map(g => (
              <section key={g.key}>
                <h2 className="section-label together-month">{t(lang, g.key)}</h2>
                {g.items.map(testimony => {
                  const linkedPrayer = testimony.community_prayers;
                  const testimonyCategories = categories.filter(c => (linkedPrayer?.category_ids || []).includes(c.id));
                  const attachmentCount = testimony.attachments?.length ?? 0;
                  return (
                    <button
                      key={testimony.id}
                      type="button"
                      onClick={() => onOpenPrayer(testimony.community_prayer_id)}
                      className="together-testimony"
                    >
                      {linkedPrayer?.title && <span className="together-testimony__for" dir="auto">{linkedPrayer.title}</span>}
                      {testimony._locked
                        ? <LockedNotice lang={lang} inline />
                        // Preview only — media plays on the prayer's page.
                        : testimony.content && <span className="together-testimony__text" dir="auto">{testimony.content}</span>}
                      <span className="together-testimony__meta">
                        <Avatar name={testimony.is_anonymous ? '?' : testimony.author_name} avatar={testimony.is_anonymous ? null : avatarFor(testimony.user_id)} size={20} anonymous={testimony.is_anonymous} />
                        <span>{communityAuthor(testimony, user.id, lang)} · {timeAgo(testimony.created_at, lang)}</span>
                        {attachmentCount > 0 && (
                          <span className="inline-flex items-center gap-1"><Paperclip size={12} aria-hidden="true" />{attachmentCount}</span>
                        )}
                        {testimonyCategories.map(c => <span key={c.id}>{tr(c.name, lang)}</span>)}
                      </span>
                    </button>
                  );
                })}
              </section>
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
    if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--q-text-tertiary)' }} /></div>;
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
