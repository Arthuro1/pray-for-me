import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Users, Plus, HandHeart, MessageSquare, Loader2, ArrowLeft, X, UserPlus, Mail, Settings, SlidersHorizontal, Trash2, Check, LogOut, Search, Share2, QrCode } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import OverflowMenu from '../components/OverflowMenu';
import EmptyState from '../components/EmptyState';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import { t } from '../i18n';
import { toast } from '../store/toastStore';
import { timeAgo, groupByThisMonth } from '../utils/date';
import { getAuthorName, communityAuthor } from '../utils/user';
import { unreadCounts } from '../utils/community';
import PrayerDetail from './PrayerDetail';
import PrayerForm from '../components/PrayerForm';
import PrayerListSkeleton from '../components/Skeleton';
import Avatar from '../components/Avatar';
import ConfirmDialog from '../components/ConfirmDialog';
import ShareButtons from '../components/ShareButtons';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { QRCodeSVG } from 'qrcode.react';

const CARD_STYLE = { background: 'var(--surface)', border: '0.5px solid var(--border)' };
const SUBTLE_BTN = { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' };
const INPUT_STYLE = { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' };
const MODAL_INPUT_CLASS = 'w-full px-4 py-3 rounded-xl text-sm focus:outline-none mb-3';

// ── Reusable request/invitation row ──────────────────────────────────────────
// Per-group "last visited" timestamps, kept locally to compute unread badges.
const SEEN_KEY = 'pfm_group_seen';
const readSeen = () => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch { return {}; } };
const markGroupSeen = (groupId) => {
  const m = readSeen();
  m[groupId] = new Date().toISOString();
  localStorage.setItem(SEEN_KEY, JSON.stringify(m));
};

function ActionRow({ label, sublabel, avatarName, primaryText, onPrimary, onSecondary, secondaryText, busy }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl gap-3" style={CARD_STYLE}>
      <div className="flex items-center gap-3 min-w-0">
        {avatarName && <Avatar name={avatarName} size={36} />}
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
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
        {icon} {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ── Community Hub Home ──────────────────────────────────────────────────────
function CommunityHub({ lang, userId, onViewGroup }) {
  const { groups, fetchFriends, fetchFriendRequests, fetchGroupInvitations, acceptFriendRequest, rejectFriendRequest, acceptGroupInvitation, rejectGroupInvitation, removeFriend, addFriendship, fetchPendingCount, fetchGroupActivity } = useCommunityStore(
    useShallow((s) => ({
      groups: s.groups,
      fetchFriends: s.fetchFriends,
      fetchFriendRequests: s.fetchFriendRequests,
      fetchGroupInvitations: s.fetchGroupInvitations,
      acceptFriendRequest: s.acceptFriendRequest,
      rejectFriendRequest: s.rejectFriendRequest,
      acceptGroupInvitation: s.acceptGroupInvitation,
      rejectGroupInvitation: s.rejectGroupInvitation,
      removeFriend: s.removeFriend,
      addFriendship: s.addFriendship,
      fetchPendingCount: s.fetchPendingCount,
      fetchGroupActivity: s.fetchGroupActivity,
    }))
  );
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [groupInvitations, setGroupInvitations] = useState([]);
  const [unread, setUnread] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);

  const load = useCallback(async () => {
    const [f, fr, gi] = await Promise.all([
      fetchFriends(userId),
      fetchFriendRequests(userId),
      fetchGroupInvitations(userId),
    ]);
    setFriends(f.friends || []);
    setFriendRequests(fr.requests || []);
    setGroupInvitations(gi.invitations || []);
    setLoading(false);
    fetchPendingCount(userId);
    fetchGroupActivity().then((rows) => setUnread(unreadCounts(rows, readSeen(), userId)));
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handle = async (id, fn) => {
    setBusyId(id);
    const res = await fn();
    if (res?.error) toast.error(t(lang, 'errorGeneric'));
    await load();
    setBusyId(null);
  };

  // Friend removal gets an Undo affordance instead of a hard confirm dialog.
  const handleRemoveFriend = async (friend) => {
    setBusyId(friend.id);
    const res = await removeFriend(userId, friend.id);
    await load();
    setBusyId(null);
    if (res?.error) { toast.error(t(lang, 'errorGeneric')); return; }
    toast.success(t(lang, 'friendRemoved'), {
      action: { label: t(lang, 'undo'), onClick: async () => { await addFriendship(userId, friend.id); load(); } },
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
    <div style={{ background: 'var(--bg)' }} className="min-h-screen">
      <div className="px-5 md:px-8 py-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-1)' }}>{t(lang, 'community')}</h1>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <button onClick={() => setShowCreateGroup(true)} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--accent)' }}>
            <Plus size={16} /> {t(lang, 'createGroup')}
          </button>
          <button onClick={() => setShowAddFriend(true)} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium" style={SUBTLE_BTN}>
            <UserPlus size={16} /> {t(lang, 'addFriend')}
          </button>
        </div>

        {friendRequests.length > 0 && (
          <Section title={`${t(lang, 'friendRequests')} (${friendRequests.length})`} icon={<Mail size={18} />}>
            {friendRequests.map(req => (
              <ActionRow key={req.id} label={req.fromName} avatarName={req.fromName} busy={busyId === req.id}
                primaryText={t(lang, 'accept')} secondaryText={t(lang, 'reject')}
                onPrimary={() => handle(req.id, () => acceptFriendRequest(req.id))}
                onSecondary={() => handle(req.id, () => rejectFriendRequest(req.id))} />
            ))}
          </Section>
        )}

        {groupInvitations.length > 0 && (
          <Section title={`${t(lang, 'groupInvitations')} (${groupInvitations.length})`} icon={<Mail size={18} />}>
            {groupInvitations.map(inv => (
              <ActionRow key={inv.id} label={inv.groupName} sublabel={`${t(lang, 'invitedBy')} ${inv.inviterName}`} busy={busyId === inv.id}
                primaryText={t(lang, 'join')} secondaryText={t(lang, 'reject')}
                onPrimary={() => handle(inv.id, () => acceptGroupInvitation(inv.id, userId))}
                onSecondary={() => handle(inv.id, () => rejectGroupInvitation(inv.id))} />
            ))}
          </Section>
        )}

        <Section title={t(lang, 'myGroups')}>
          {groups.length === 0 ? (
            <EmptyState
              emoji="👥"
              title={t(lang, 'noGroups')}
              actionLabel={t(lang, 'createGroup')}
              actionIcon={Plus}
              onAction={() => setShowCreateGroup(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groups.map(g => (
                <button key={g.id} onClick={() => onViewGroup(g.id)} className="p-4 rounded-2xl text-left transition-all hover:scale-[1.02]" style={CARD_STYLE}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                      <Users size={18} />
                    </div>
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
          )}
        </Section>

        {friends.length > 0 && (
          <Section title={`${t(lang, 'friends')} (${friends.length})`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {friends.map(f => (
                <div key={f.id} className="flex items-center justify-between gap-3 p-3 rounded-xl" style={CARD_STYLE}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={f.name} size={36} />
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

        {showCreateGroup && <CreateGroupModal lang={lang} userId={userId} onClose={() => setShowCreateGroup(false)} onDone={() => { setShowCreateGroup(false); }} />}
        {showAddFriend && <AddFriendModal lang={lang} userId={userId} onClose={() => setShowAddFriend(false)} />}
      </div>
    </div>
  );
}

// ── Modal shell ──────────────────────────────────────────────────────────────
function Modal({ title, onClose, lang, children }) {
  useEscapeKey(onClose);
  const trapRef = useFocusTrap();
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div ref={trapRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-2xl p-5" style={CARD_STYLE} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>{title}</h3>
          <button onClick={onClose} aria-label={t(lang, 'close')} style={{ color: 'var(--text-3)' }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Cancel + primary action footer shared by the form modals.
function ModalActions({ lang, onCancel, onSubmit, disabled, loading, submitLabel }) {
  return (
    <div className="flex gap-2">
      <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm" style={SUBTLE_BTN}>{t(lang, 'cancel')}</button>
      <button onClick={onSubmit} disabled={disabled} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40" style={{ background: 'var(--accent)' }}>
        {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : submitLabel}
      </button>
    </div>
  );
}

// ── Create Group Modal ──────────────────────────────────────────────────────
function CreateGroupModal({ lang, userId, onClose, onDone }) {
  const createGroup = useCommunityStore((s) => s.createGroup);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { error: err } = await createGroup(name.trim(), userId);
    setLoading(false);
    if (err) { setError(err); return; }
    onDone();
  };

  return (
    <Modal title={t(lang, 'createGroup')} lang={lang} onClose={onClose}>
      <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={t(lang, 'groupName')}
        className={MODAL_INPUT_CLASS} style={INPUT_STYLE} />
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      <ModalActions lang={lang} onCancel={onClose} onSubmit={handleCreate}
        disabled={!name.trim() || loading} loading={loading} submitLabel={t(lang, 'createGroup')} />
    </Modal>
  );
}

// ── Add Friend Modal ────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AddFriendModal({ lang, userId, onClose }) {
  const sendFriendRequest = useCommunityStore((s) => s.sendFriendRequest);
  const sendFriendRequestToId = useCommunityStore((s) => s.sendFriendRequestToId);
  const fetchFriendSuggestions = useCommunityStore((s) => s.fetchFriendSuggestions);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [suggestions, setSuggestions] = useState(null); // null = loading
  const [addedIds, setAddedIds] = useState(new Set());
  const [busyId, setBusyId] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const friendUrl = `${window.location.origin}/community/add-friend/${userId}`;

  useEffect(() => {
    fetchFriendSuggestions(userId).then((r) => setSuggestions(r.suggestions || []));
  }, [userId]);

  const errorText = {
    notFound: t(lang, 'userNotFound'),
    self: t(lang, 'cannotAddSelf'),
    exists: t(lang, 'requestExists'),
    alreadyFriends: t(lang, 'alreadyFriends'),
  };

  const handleSendEmail = async () => {
    const value = email.trim();
    if (!EMAIL_RE.test(value)) { setError(t(lang, 'invalidEmail')); return; }
    setLoading(true);
    setError('');
    const { error: err } = await sendFriendRequest(value, userId);
    setLoading(false);
    if (err) { setError(errorText[err] || err); return; }
    setDone(true);
  };

  const handleAddSuggestion = async (id) => {
    setBusyId(id);
    const { error: err } = await sendFriendRequestToId(id, userId);
    setBusyId(null);
    if (err) { toast.error(errorText[err] || t(lang, 'errorGeneric')); return; }
    setAddedIds((prev) => new Set([...prev, id]));
    toast.success(t(lang, 'requestSent'));
  };

  return (
    <Modal title={t(lang, 'addFriend')} lang={lang} onClose={onClose}>
      {done ? (
        <div className="text-center py-4">
          <p className="text-sm mb-4" style={{ color: 'var(--text-1)' }}>{t(lang, 'requestSent')}</p>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--accent)' }}>{t(lang, 'close')}</button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Suggestions from shared groups */}
          {suggestions && suggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'fromYourGroups')}</p>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {suggestions.map((s) => {
                  const added = addedIds.has(s.id);
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-3 p-2 rounded-xl" style={CARD_STYLE}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={s.name} size={32} />
                        <span className="text-sm truncate" style={{ color: 'var(--text-1)' }}>{s.name}</span>
                      </div>
                      <button onClick={() => handleAddSuggestion(s.id)} disabled={added || busyId === s.id}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                        style={added ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : { background: 'var(--accent)', color: '#fff' }}>
                        {busyId === s.id ? <Loader2 size={13} className="animate-spin" /> : added ? <Check size={13} /> : t(lang, 'addBtn')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add by email */}
          <div>
            <input value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="email@example.com" type="email"
              onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
              className={MODAL_INPUT_CLASS} style={INPUT_STYLE} />
            {error && (
              <p className="text-xs mb-3" style={{ color: '#e53e3e' }}>
                {error}
                {error === t(lang, 'userNotFound') && <> — {t(lang, 'friendLinkHint')}</>}
              </p>
            )}
            <button onClick={handleSendEmail} disabled={!email.trim() || loading}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40" style={{ background: 'var(--accent)' }}>
              {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : t(lang, 'send')}
            </button>
          </div>

          {/* Share your friend link */}
          <div className="pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mt-3 mb-1" style={{ color: 'var(--text-3)' }}>{t(lang, 'shareFriendLink')}</p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'friendLinkHint')}</p>
            <ShareButtons url={friendUrl} text={t(lang, 'addMeFriend')} copiedLabel={t(lang, 'linkCopied')} />
            <button onClick={() => setShowQR(v => !v)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
              <QrCode size={14} /> {t(lang, 'showQrCode')}
            </button>
            {showQR && (
              <div className="flex flex-col items-center gap-2 mt-3 p-4 rounded-xl bg-white">
                <QRCodeSVG value={friendUrl} size={150} bgColor="#ffffff" fgColor="#1a0a2e" level="M" />
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Group Admin Modal (invite friends + manage members) ──────────────────────
function GroupAdminModal({ lang, userId, group, onClose }) {
  const { fetchFriends, fetchGroupMembers, fetchGroupInvitees, inviteToGroup, removeMember, renameGroup } = useCommunityStore(
    useShallow((s) => ({
      fetchFriends: s.fetchFriends,
      fetchGroupMembers: s.fetchGroupMembers,
      fetchGroupInvitees: s.fetchGroupInvitees,
      inviteToGroup: s.inviteToGroup,
      removeMember: s.removeMember,
      renameGroup: s.renameGroup,
    }))
  );
  const [friends, setFriends] = useState([]);
  const [members, setMembers] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [invited, setInvited] = useState({});
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [name, setName] = useState(group.name);
  const [renaming, setRenaming] = useState(false);

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
  }, [userId, group.id]);

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
  };

  const handleRemove = async (memberId) => {
    setBusyId(memberId);
    const res = await removeMember(group.id, memberId);
    if (res?.error) toast.error(t(lang, 'errorGeneric'));
    await load();
    setBusyId(null);
    setConfirmRemove(null);
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
      <div className="max-h-[60vh] overflow-y-auto">
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
                  <Avatar name={f.name} size={30} />
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
          {members.map(m => (
            <div key={m.user_id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl" style={CARD_STYLE}>
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={m.name} size={30} />
                <div className="min-w-0">
                  <p className="text-sm truncate" style={{ color: 'var(--text-1)' }}>{m.name}{m.user_id === userId ? ` (${t(lang, 'you')})` : ''}</p>
                  {m.role === 'admin' && <p className="text-xs" style={{ color: 'var(--accent)' }}>{t(lang, 'admin')}</p>}
                </div>
              </div>
              {m.user_id !== userId && (
                <button onClick={() => setConfirmRemove(m)} disabled={busyId === m.user_id} aria-label={t(lang, 'remove')} className="p-1.5 rounded-lg disabled:opacity-40 shrink-0" style={SUBTLE_BTN}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// Read-only member list, available to every group member.
function MembersModal({ lang, group, userId, onClose }) {
  const fetchGroupMembers = useCommunityStore((s) => s.fetchGroupMembers);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  const inviteUrl = `${window.location.origin}/community/join/${group.invite_code}`;

  useEffect(() => {
    fetchGroupMembers(group.id).then(r => { setMembers(r.members || []); setLoading(false); });
  }, [group.id]);

  const shareInvite = async () => {
    try {
      if (navigator.share) await navigator.share({ title: group.name, text: group.name, url: inviteUrl });
      else { await navigator.clipboard.writeText(inviteUrl); toast.success(t(lang, 'linkCopied')); }
    } catch { /* share dismissed */ }
  };

  return (
    <Modal title={`${t(lang, 'members')} (${members.length})`} lang={lang} onClose={onClose}>
      <div className="flex gap-2 mb-4">
        <button onClick={shareInvite} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
          <Share2 size={15} /> {t(lang, 'shareInviteLink')}
        </button>
        <button onClick={() => setShowQR(v => !v)} title={t(lang, 'showQrCode')} className="px-3 rounded-xl flex items-center justify-center" style={{ background: showQR ? 'var(--accent)' : 'var(--accent-soft)', color: showQR ? '#fff' : 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
          <QrCode size={16} />
        </button>
      </div>

      <ShareButtons url={inviteUrl} text={`${t(lang, 'joinMyGroup')} "${group.name}"`} copiedLabel={t(lang, 'linkCopied')} />

      {showQR && (
        <div className="flex flex-col items-center gap-2 mb-4 p-4 rounded-xl" style={{ background: '#ffffff', border: '0.5px solid var(--border)' }}>
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
              <Avatar name={m.name} size={32} />
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ color: 'var(--text-1)' }}>{m.name}{m.user_id === userId ? ` (${t(lang, 'you')})` : ''}</p>
                {m.role === 'admin' && <p className="text-xs" style={{ color: 'var(--accent)' }}>{t(lang, 'admin')}</p>}
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
  const { groups, prayers, testimonies, loading, setActiveGroup, addPrayer, setGroupAutoAdd, subscribeGroupPrayers, leaveGroup } = useCommunityStore(
    useShallow((s) => ({
      groups: s.groups,
      prayers: s.prayers,
      testimonies: s.testimonies,
      loading: s.loading,
      setActiveGroup: s.setActiveGroup,
      addPrayer: s.addPrayer,
      setGroupAutoAdd: s.setGroupAutoAdd,
      subscribeGroupPrayers: s.subscribeGroupPrayers,
      leaveGroup: s.leaveGroup,
    }))
  );
  const addFromCommunity = usePrayerStore(s => s.addFromCommunity);
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
  const reconciledRef = useRef(null);

  // Always (re)fetch on entering a group so freshly synced points/updates from
  // the personal side show up, even if this group was already the active one.
  useEffect(() => {
    if (groupId) { setActiveGroup(groupId); markGroupSeen(groupId); }
  }, [groupId]);

  // Live prayer wall: reflect new/edited/answered requests from other members.
  useEffect(() => {
    if (!groupId) return;
    return subscribeGroupPrayers(groupId);
  }, [groupId]);

  const group = groups.find(g => g.id === groupId);
  const isAdmin = group?.role === 'admin';

  const filteredPrayers = prayers.filter(p => {
    if (reqFilter === 'active' && p.is_answered) return false;
    if (reqFilter === 'answered' && !p.is_answered) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${p.title} ${p.description || ''} ${p.is_anonymous ? '' : p.author_name || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Copy group requests (not mine, not already linked) into the personal list.
  const reconcileAutoAdd = async () => {
    const mine = new Set(usePrayerStore.getState().prayers.map(p => p.id));
    const groupName = groups.find(g => g.id === groupId)?.name || null;
    for (const p of prayers) {
      if (p.user_id === user.id) continue;
      if (p.source_prayer_id && mine.has(p.source_prayer_id)) continue;
      await addFromCommunity(p, groupName); // idempotent: deduped by community_origin_id
    }
  };

  // When auto-add is on, reconcile once per group entry (after prayers load).
  useEffect(() => {
    if (group?.autoAdd && !loading && prayers.length && reconciledRef.current !== groupId) {
      reconciledRef.current = groupId;
      reconcileAutoAdd();
    }
  }, [group?.autoAdd, loading, prayers, groupId]);

  const handleToggleAutoAdd = async () => {
    const next = !group?.autoAdd;
    await setGroupAutoAdd(groupId, user.id, next);
    if (next) await reconcileAutoAdd();
  };

  const handleLeave = async () => {
    setLeaving(true);
    const res = await leaveGroup(groupId, user.id);
    setLeaving(false);
    if (res?.error) { toast.error(t(lang, 'errorGeneric')); return; }
    onBack();
  };

  return (
    <div style={{ background: 'var(--bg)' }}>
      <div className="px-5 md:px-8 pt-4 pb-2 flex items-center justify-between max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--accent)' }}>
          <ArrowLeft size={16} /> {t(lang, 'community')}
        </button>
        <OverflowMenu
          lang={lang}
          ariaLabel={t(lang, 'groupOptions')}
          triggerClassName="flex items-center justify-center w-9 h-9 rounded-lg"
          triggerStyle={SUBTLE_BTN}
          items={[
            { key: 'members', icon: Users, label: t(lang, 'members'), onClick: () => setShowMembers(true) },
            { key: 'settings', icon: SlidersHorizontal, label: t(lang, 'groupSettings'), onClick: () => setShowSettings(true) },
            { key: 'manage', icon: Settings, label: t(lang, 'manageGroup'), onClick: () => setShowAdmin(true), hidden: !isAdmin },
            { key: 'leave', icon: LogOut, label: t(lang, 'leaveGroup'), danger: true, onClick: () => setShowLeave(true) },
          ]}
        />
      </div>

      {showMembers && group && <MembersModal lang={lang} group={group} userId={user.id} onClose={() => setShowMembers(false)} />}

      {showSettings && (
        <Modal title={t(lang, 'groupSettings')} lang={lang} onClose={() => setShowSettings(false)}>
          <button onClick={handleToggleAutoAdd} className="flex items-start justify-between gap-3 w-full p-3 rounded-xl text-left" style={CARD_STYLE}>
            <span className="min-w-0">
              <span className="block text-sm" style={{ color: 'var(--text-1)' }}>{t(lang, 'autoAddRequests')}</span>
              <span className="block text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{t(lang, 'autoAddRequestsSub')}</span>
            </span>
            <span className="shrink-0 w-10 h-6 rounded-full p-0.5 transition-colors mt-0.5" style={{ background: group?.autoAdd ? 'var(--accent)' : 'var(--input-border)' }}>
              <span className="block w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: group?.autoAdd ? 'translateX(16px)' : 'translateX(0)' }} />
            </span>
          </button>
        </Modal>
      )}

      {showLeave && (
        <Modal title={t(lang, 'leaveGroup')} lang={lang} onClose={() => setShowLeave(false)}>
          <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>{t(lang, 'leaveGroupConfirm')}</p>
          <div className="flex gap-2">
            <button onClick={() => setShowLeave(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={SUBTLE_BTN}>{t(lang, 'cancel')}</button>
            <button onClick={handleLeave} disabled={leaving} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40" style={{ background: '#e53e3e' }}>
              {leaving ? <Loader2 size={14} className="animate-spin mx-auto" /> : t(lang, 'leaveGroup')}
            </button>
          </div>
        </Modal>
      )}

      {showNewRequest && <PrayerForm communityMode onClose={() => setShowNewRequest(false)}
        onCommunitySubmit={async ({ title, description, isAnonymous, categoryIds }) => {
          await addPrayer({ groupId, userId: user.id, authorName: getAuthorName(user), title, description, isAnonymous, categoryIds });
        }} />}

      {showAdmin && group && <GroupAdminModal lang={lang} userId={user.id} group={group} onClose={() => setShowAdmin(false)} />}

      <div className="px-5 md:px-8 py-4 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-5" style={{ color: 'var(--text-1)' }}>{group?.name}</h2>

        <div className="flex gap-1 mb-5">
          {['requests', 'testimonies'].map(tab => (
            <button key={tab} onClick={() => setSubTab(tab)} className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: subTab === tab ? 'var(--accent)' : 'var(--input-bg)', color: subTab === tab ? '#fff' : 'var(--text-2)', border: '0.5px solid var(--input-border)' }}>
              {tab === 'requests' ? t(lang, 'prayerRequests') : t(lang, 'testimonies')}
            </button>
          ))}
        </div>

        {subTab === 'requests' && (
          <>
            <button onClick={() => setShowNewRequest(true)} className="flex items-center gap-2 w-full py-3 rounded-xl text-sm font-medium mb-4 justify-center text-white" style={{ background: 'var(--accent)' }}>
              <Plus size={16} /> {t(lang, 'newRequest')}
            </button>

            {prayers.length > 0 && (
              <div className="mb-4 space-y-2.5">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t(lang, 'searchRequests')}
                    className="w-full text-sm rounded-xl pl-9 pr-3 py-2.5 focus:outline-none" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }} />
                </div>
                <div className="flex gap-2">
                  {['all', 'active', 'answered'].map(f => (
                    <button key={f} onClick={() => setReqFilter(f)} className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={reqFilter === f ? { background: 'var(--accent)', color: '#fff' } : SUBTLE_BTN}>
                      {t(lang, f === 'all' ? 'all' : f === 'active' ? 'active' : 'answered')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <PrayerListSkeleton />
            ) : prayers.length === 0 ? (
              <Empty lang={lang} title="noRequests" />
            ) : filteredPrayers.length === 0 ? (
              <p className="text-center text-sm py-10" style={{ color: 'var(--text-3)' }}>{t(lang, 'noMatch')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredPrayers.map(p => (
                  <button key={p.id} onClick={() => onOpenPrayer(p.id)} className="p-4 rounded-2xl text-left transition-all hover:scale-[1.01]" style={CARD_STYLE}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={p.is_anonymous ? '?' : p.author_name} size={26} anonymous={p.is_anonymous} />
                        <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                          {communityAuthor(p, user.id, lang)} · {timeAgo(p.created_at, lang)}
                        </p>
                      </div>
                      {p.is_answered && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: '#e8f5ed', color: '#059669' }}>
                          <Check size={11} /> {t(lang, 'answered2')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-1)', textDecoration: p.is_answered ? 'line-through' : 'none', opacity: p.is_answered ? 0.7 : 1 }}>{p.title}</p>
                    {p.description && <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-2)' }}>{p.description}</p>}
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
                        className="w-full text-left rounded-2xl p-4 transition-all hover:scale-[1.01]"
                        style={{ ...CARD_STYLE, borderLeft: '3px solid var(--success)' }}
                      >
                        <div className="flex items-center gap-2 mb-1.5 min-w-0">
                          <Avatar name={testimony.is_anonymous ? '?' : testimony.author_name} size={26} anonymous={testimony.is_anonymous} />
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
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>🎉 "{testimony.content}"</p>
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

  useEffect(() => { if (groupId && groupId !== activeGroupId) setActiveGroup(groupId); }, [groupId]);
  useEffect(() => { if (groupId && user?.id) fetchUserReactions(groupId, user.id); }, [groupId, user?.id]);

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

  useEffect(() => { if (user?.id) fetchGroups(user.id); }, [user?.id]);

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
  return <CommunityHub lang={lang} userId={user.id} onViewGroup={(gid) => navigate(`/community/group/${gid}`)} />;
}
