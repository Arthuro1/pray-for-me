import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, HandHeart, MessageSquare, Loader2, ArrowLeft, X, UserPlus, Mail, Settings, Trash2 } from 'lucide-react';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { timeAgo } from '../utils/date';
import { getAuthorName } from '../utils/user';
import PrayerDetail from './PrayerDetail';
import PrayerForm from '../components/PrayerForm';

const CARD_STYLE = { background: 'var(--surface)', border: '0.5px solid var(--border)' };
const SUBTLE_BTN = { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' };
const INPUT_STYLE = { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' };
const MODAL_INPUT_CLASS = 'w-full px-4 py-3 rounded-xl text-sm focus:outline-none mb-3';

// ── Reusable request/invitation row ──────────────────────────────────────────
function ActionRow({ label, sublabel, primaryText, onPrimary, onSecondary, secondaryText, busy }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl gap-3" style={CARD_STYLE}>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{label}</p>
        {sublabel && <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{sublabel}</p>}
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
  const { groups, fetchFriends, fetchFriendRequests, fetchGroupInvitations, acceptFriendRequest, rejectFriendRequest, acceptGroupInvitation, rejectGroupInvitation, removeFriend, fetchPendingCount } = useCommunityStore();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [groupInvitations, setGroupInvitations] = useState([]);
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
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handle = async (id, fn) => {
    setBusyId(id);
    await fn();
    await load();
    setBusyId(null);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} /></div>;
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
              <ActionRow key={req.id} label={req.fromName} busy={busyId === req.id}
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
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t(lang, 'noGroups')}</p>
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
                <div key={f.id} className="flex items-center justify-between p-3 rounded-xl" style={CARD_STYLE}>
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{f.name}</p>
                  <button onClick={() => handle(f.id, () => removeFriend(userId, f.id))} disabled={busyId === f.id} className="px-3 py-1 rounded-lg text-xs disabled:opacity-40" style={SUBTLE_BTN}>
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
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-5" style={CARD_STYLE} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>{title}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-3)' }}><X size={18} /></button>
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
  const { createGroup } = useCommunityStore();
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
    <Modal title={t(lang, 'createGroup')} onClose={onClose}>
      <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={t(lang, 'groupName')}
        className={MODAL_INPUT_CLASS} style={INPUT_STYLE} />
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      <ModalActions lang={lang} onCancel={onClose} onSubmit={handleCreate}
        disabled={!name.trim() || loading} loading={loading} submitLabel={t(lang, 'createGroup')} />
    </Modal>
  );
}

// ── Add Friend Modal ────────────────────────────────────────────────────────
function AddFriendModal({ lang, userId, onClose }) {
  const { sendFriendRequest } = useCommunityStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const errorText = {
    notFound: t(lang, 'userNotFound'),
    self: t(lang, 'cannotAddSelf'),
    exists: t(lang, 'requestExists'),
  };

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error: err } = await sendFriendRequest(email.trim(), userId);
    setLoading(false);
    if (err) { setError(errorText[err] || err); return; }
    setDone(true);
  };

  return (
    <Modal title={t(lang, 'addFriend')} onClose={onClose}>
      {done ? (
        <div className="text-center py-4">
          <p className="text-sm mb-4" style={{ color: 'var(--text-1)' }}>{t(lang, 'requestSent')}</p>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--accent)' }}>{t(lang, 'close')}</button>
        </div>
      ) : (
        <>
          <input autoFocus value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" type="email"
            className={MODAL_INPUT_CLASS} style={INPUT_STYLE} />
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          <ModalActions lang={lang} onCancel={onClose} onSubmit={handleSend}
            disabled={!email.trim() || loading} loading={loading} submitLabel={t(lang, 'send')} />
        </>
      )}
    </Modal>
  );
}

// ── Group Admin Modal (invite friends + manage members) ──────────────────────
function GroupAdminModal({ lang, userId, group, onClose }) {
  const { fetchFriends, fetchGroupMembers, inviteToGroup, removeMember } = useCommunityStore();
  const [friends, setFriends] = useState([]);
  const [members, setMembers] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [invited, setInvited] = useState({});

  const load = useCallback(async () => {
    const [f, m] = await Promise.all([fetchFriends(userId), fetchGroupMembers(group.id)]);
    setFriends(f.friends || []);
    setMembers(m.members || []);
  }, [userId, group.id]);

  useEffect(() => { load(); }, [load]);

  const memberIds = new Set(members.map(m => m.user_id));
  const invitable = friends.filter(f => !memberIds.has(f.id));

  const handleInvite = async (friendId) => {
    setBusyId(friendId);
    const { error } = await inviteToGroup(group.id, friendId, userId);
    setBusyId(null);
    if (!error) setInvited(prev => ({ ...prev, [friendId]: true }));
  };

  const handleRemove = async (memberId) => {
    setBusyId(memberId);
    await removeMember(group.id, memberId);
    await load();
    setBusyId(null);
  };

  return (
    <Modal title={t(lang, 'manageGroup')} onClose={onClose}>
      <div className="max-h-[60vh] overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'inviteFriends')}</p>
        {invitable.length === 0 ? (
          <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>{t(lang, 'noFriendsToInvite')}</p>
        ) : (
          <div className="space-y-2 mb-5">
            {invitable.map(f => (
              <div key={f.id} className="flex items-center justify-between p-2.5 rounded-xl" style={CARD_STYLE}>
                <p className="text-sm truncate" style={{ color: 'var(--text-1)' }}>{f.name}</p>
                <button onClick={() => handleInvite(f.id)} disabled={busyId === f.id || invited[f.id]} className="px-3 py-1 rounded-lg text-xs font-medium text-white disabled:opacity-40" style={{ background: 'var(--accent)' }}>
                  {invited[f.id] ? t(lang, 'invited') : t(lang, 'invite')}
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'members')} ({members.length})</p>
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.user_id} className="flex items-center justify-between p-2.5 rounded-xl" style={CARD_STYLE}>
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ color: 'var(--text-1)' }}>{m.name}{m.user_id === userId ? ` (${t(lang, 'you')})` : ''}</p>
                {m.role === 'admin' && <p className="text-xs" style={{ color: 'var(--accent)' }}>{t(lang, 'admin')}</p>}
              </div>
              {m.user_id !== userId && (
                <button onClick={() => handleRemove(m.user_id)} disabled={busyId === m.user_id} className="p-1.5 rounded-lg disabled:opacity-40" style={SUBTLE_BTN}>
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

function Empty({ lang, title }) {
  return (
    <div className="text-center py-12">
      <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>{t(lang, title)}</p>
      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'beFirst')}</p>
    </div>
  );
}

// ── Group View ────────────────────────────────────────────────────────────────
function GroupView({ lang, user, groupId, onBack }) {
  const { groups, activeGroupId, prayers, testimonies, loading, setActiveGroup, addPrayer } = useCommunityStore();
  const [subTab, setSubTab] = useState('requests');
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    if (groupId && groupId !== activeGroupId) setActiveGroup(groupId);
  }, [groupId]);

  const group = groups.find(g => g.id === groupId);
  const isAdmin = group?.role === 'admin';

  if (selectedPrayer) {
    return <PrayerDetail communityPrayer={selectedPrayer} onBack={() => setSelectedPrayer(null)} lang={lang} />;
  }

  return (
    <div style={{ background: 'var(--bg)' }}>
      <div className="px-5 md:px-8 pt-4 pb-2 flex items-center justify-between max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--accent)' }}>
          <ArrowLeft size={16} /> {t(lang, 'community')}
        </button>
        {isAdmin && (
          <button onClick={() => setShowAdmin(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={SUBTLE_BTN}>
            <Settings size={14} /> {t(lang, 'manageGroup')}
          </button>
        )}
      </div>

      {showNewRequest && <PrayerForm communityMode onClose={() => setShowNewRequest(false)}
        onCommunitySubmit={async ({ title, description, isAnonymous, categoryIds }) => {
          await addPrayer({ groupId, userId: user.id, authorName: getAuthorName(user), title, description, isAnonymous, categoryIds });
        }} />}

      {showAdmin && group && <GroupAdminModal lang={lang} userId={user.id} group={group} onClose={() => setShowAdmin(false)} />}

      <div className="px-5 md:px-8 py-4 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-1)' }}>{group?.name}</h2>

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
            <button onClick={() => setShowNewRequest(true)} className="flex items-center gap-2 w-full py-3 rounded-xl text-sm font-medium mb-5 justify-center text-white" style={{ background: 'var(--accent)' }}>
              <Plus size={16} /> {t(lang, 'newRequest')}
            </button>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} /></div>
            ) : prayers.length === 0 ? (
              <Empty lang={lang} title="noRequests" />
            ) : (
              <div className="flex flex-col gap-3">
                {prayers.map(p => (
                  <button key={p.id} onClick={() => setSelectedPrayer(p)} className="p-4 rounded-2xl text-left transition-all hover:scale-[1.01]" style={CARD_STYLE}>
                    <p className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>
                      {p.is_anonymous ? t(lang, 'anonymous') : p.author_name} · {timeAgo(p.created_at, lang)}
                    </p>
                    <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-1)' }}>{p.title}</p>
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
            <div className="flex flex-col gap-3">
              {testimonies.map(testimony => (
                <div key={testimony.id} className="rounded-2xl p-4" style={CARD_STYLE}>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>
                    🎉 {testimony.is_anonymous ? t(lang, 'anonymous') : testimony.author_name} · {timeAgo(testimony.created_at, lang)}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>{testimony.content}</p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── Main Community Tab ──────────────────────────────────────────────────────
export default function CommunityTab() {
  const { settings } = usePrayerStore();
  const lang = settings.language || 'en';
  const { user } = useAuthStore();
  const { fetchGroups, fetchUserReactions } = useCommunityStore();
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  useEffect(() => { if (user?.id) fetchGroups(user.id); }, [user?.id]);
  useEffect(() => { if (selectedGroupId && user?.id) fetchUserReactions(selectedGroupId, user.id); }, [selectedGroupId, user?.id]);

  if (!user) return null;

  return selectedGroupId ? (
    <GroupView lang={lang} user={user} groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} />
  ) : (
    <CommunityHub lang={lang} userId={user.id} onViewGroup={setSelectedGroupId} />
  );
}
