import { useState, useEffect } from 'react';
import { Users, Plus, Copy, Check, ChevronDown, HandHeart, MessageSquare, LogOut, Loader2 } from 'lucide-react';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { timeAgo } from '../utils/date';
import { getAuthorName } from '../utils/user';
import PrayerDetail from './PrayerDetail';
import PrayerForm from '../components/PrayerForm';

// ── Group onboarding ──────────────────────────────────────────────────────────
function NoGroupView({ lang, userId, onDone }) {
  const { createGroup, joinGroup } = useCommunityStore();
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setMode(null); setError(''); };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await createGroup(name.trim(), userId);
    setLoading(false);
    if (error) { setError(error); return; }
    onDone();
  };

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    const { error } = await joinGroup(code.trim(), userId);
    setLoading(false);
    if (error === 'notFound') { setError(t(lang, 'groupNotFound')); return; }
    if (error === 'alreadyMember') { setError(t(lang, 'alreadyMember')); return; }
    if (error) { setError(error); return; }
    onDone();
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: 'var(--accent-soft)' }}>
        <Users size={28} style={{ color: 'var(--accent)' }} />
      </div>
      <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-1)' }}>{t(lang, 'noGroups')}</h2>
      <p className="text-sm mb-8 max-w-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'noGroupsDesc')}</p>

      {!mode && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => setMode('create')} className="py-3 rounded-xl font-medium text-sm text-white" style={{ background: 'var(--accent)' }}>
            {t(lang, 'createGroup')}
          </button>
          <button onClick={() => setMode('join')} className="py-3 rounded-xl font-medium text-sm" style={{ background: 'var(--input-bg)', color: 'var(--text-1)', border: '0.5px solid var(--input-border)' }}>
            {t(lang, 'joinGroup')}
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="w-full max-w-xs flex flex-col gap-3">
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={t(lang, 'groupName')}
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
            style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }} />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button onClick={handleCreate} disabled={!name.trim() || loading} className="py-3 rounded-xl font-medium text-sm text-white disabled:opacity-40" style={{ background: 'var(--accent)' }}>
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : t(lang, 'createGroup')}
          </button>
          <button onClick={reset} className="text-sm py-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'cancel')}</button>
        </div>
      )}

      {mode === 'join' && (
        <div className="w-full max-w-xs flex flex-col gap-3">
          <input autoFocus value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder={t(lang, 'inviteCode')}
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none uppercase tracking-widest"
            style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }} />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button onClick={handleJoin} disabled={!code.trim() || loading} className="py-3 rounded-xl font-medium text-sm text-white disabled:opacity-40" style={{ background: 'var(--accent)' }}>
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : t(lang, 'join')}
          </button>
          <button onClick={reset} className="text-sm py-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'cancel')}</button>
        </div>
      )}
    </div>
  );
}

// ── Prayer card ───────────────────────────────────────────────────────────────
function PrayerCard({ prayer, lang, userId, onOpen }) {
  const { userReactions, toggleReaction } = useCommunityStore();
  const hasReacted = userReactions.has(prayer.id);
  const reactionCount = prayer.prayer_reactions?.[0]?.count ?? 0;
  const updateCount = prayer.community_updates?.[0]?.count ?? 0;

  return (
    <div className="rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01]"
      style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
      onClick={onOpen}
    >
      <p className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>
        {prayer.is_anonymous ? t(lang, 'anonymous') : prayer.author_name}
        {' · '}{timeAgo(prayer.created_at, lang)}
      </p>
      <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-1)' }}>{prayer.title}</p>
      {prayer.description && (
        <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-2)' }}>{prayer.description}</p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={e => { e.stopPropagation(); toggleReaction(prayer.id, userId); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
          style={{ background: hasReacted ? 'var(--accent)' : 'var(--input-bg)', color: hasReacted ? '#fff' : 'var(--text-3)', border: '0.5px solid var(--input-border)' }}
        >
          <HandHeart size={13} />
          {reactionCount > 0 && <span>{reactionCount}</span>}
          <span>{t(lang, 'iAmPraying')}</span>
        </button>
        {updateCount > 0 && (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
            <MessageSquare size={13} /> {updateCount}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Testimony card ────────────────────────────────────────────────────────────
function TestimonyCard({ testimony, lang }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
      <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>
        🎉 {testimony.is_anonymous ? t(lang, 'anonymous') : testimony.author_name}
        {' · '}{timeAgo(testimony.created_at, lang)}
      </p>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>{testimony.content}</p>
    </div>
  );
}

// ── Group header ──────────────────────────────────────────────────────────────
function GroupHeader({ lang, userId }) {
  const { groups, activeGroupId, setActiveGroup, leaveGroup } = useCommunityStore();
  const activeGroup = groups.find(g => g.id === activeGroupId);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!activeGroup) return null;

  const handleCopy = async (e) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(activeGroup.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative px-5 md:px-8 pt-6 pb-3">
      <div className="flex items-center justify-between">
        <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--text-1)' }}>
          {activeGroup.name}
          {groups.length > 1 && <ChevronDown size={16} style={{ color: 'var(--text-3)' }} />}
        </button>
        <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
          style={{ background: 'var(--input-bg)', color: 'var(--text-3)', border: '0.5px solid var(--input-border)' }}>
          {copied ? <Check size={13} style={{ color: 'var(--accent)' }} /> : <Copy size={13} />}
          {copied ? t(lang, 'codeCopied') : activeGroup.invite_code}
        </button>
      </div>

      {showMenu && groups.length > 1 && (
        <div className="absolute left-5 top-14 z-30 rounded-xl overflow-hidden shadow-lg"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', minWidth: 180 }}>
          {groups.map(g => (
            <button key={g.id} onClick={() => { setActiveGroup(g.id); setShowMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm transition-colors hover:opacity-80"
              style={{ color: g.id === activeGroupId ? 'var(--accent)' : 'var(--text-1)', fontWeight: g.id === activeGroupId ? 600 : 400 }}>
              {g.name}
            </button>
          ))}
          <div style={{ borderTop: '0.5px solid var(--border)' }}>
            <button onClick={() => { leaveGroup(activeGroupId, userId); setShowMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm flex items-center gap-2" style={{ color: '#ef4444' }}>
              <LogOut size={14} /> {t(lang, 'leaveGroup')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Requests sub-tab ──────────────────────────────────────────────────────────
function RequestsTab({ lang, userId, activeGroupId, prayers, loading, addPrayer }) {
  const [showForm, setShowForm] = useState(false);
  const [, setSelectedPrayer] = useState(null); // handled by parent

  return (
    <>
      {showForm && (
        <PrayerForm
          communityMode
          onClose={() => setShowForm(false)}
          onCommunitySubmit={async ({ title, description, isAnonymous, categoryIds }) => {
            const { user } = useAuthStore.getState();
            await addPrayer({ groupId: activeGroupId, userId, authorName: getAuthorName(user), title, description, isAnonymous, categoryIds });
          }}
        />
      )}

      <button onClick={() => setShowForm(true)}
        className="flex items-center gap-2 w-full py-3 rounded-xl text-sm font-medium mb-5 justify-center"
        style={{ background: 'var(--accent)', color: '#fff' }}>
        <Plus size={16} /> {t(lang, 'newRequest')}
      </button>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} /></div>
      ) : prayers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>{t(lang, 'noRequests')}</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'beFirst')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {prayers.map(p => (
            <PrayerCard key={p.id} prayer={p} lang={lang} userId={userId} onOpen={() => setSelectedPrayer(p)} />
          ))}
        </div>
      )}
    </>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function CommunityTab() {
  const { settings } = usePrayerStore();
  const lang = settings.language || 'en';
  const { user } = useAuthStore();
  const { groups, activeGroupId, prayers, testimonies, loading, fetchGroups, fetchUserReactions, addPrayer } = useCommunityStore();
  const [subTab, setSubTab] = useState('requests');
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [showJoinCreate, setShowJoinCreate] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);

  useEffect(() => { if (user?.id) fetchGroups(user.id); }, [user?.id]);
  useEffect(() => { if (activeGroupId && user?.id) fetchUserReactions(activeGroupId, user.id); }, [activeGroupId, user?.id]);

  if (!user) return null;

  if (selectedPrayer) {
    return <PrayerDetail communityPrayer={selectedPrayer} onBack={() => setSelectedPrayer(null)} lang={lang} />;
  }

  if (!groups.length || showJoinCreate) {
    return <NoGroupView lang={lang} userId={user.id} onDone={() => setShowJoinCreate(false)} />;
  }

  return (
    <div>
      {showNewRequest && (
        <PrayerForm
          communityMode
          onClose={() => setShowNewRequest(false)}
          onCommunitySubmit={async ({ title, description, isAnonymous, categoryIds }) => {
            await addPrayer({ groupId: activeGroupId, userId: user.id, authorName: getAuthorName(user), title, description, isAnonymous, categoryIds });
          }}
        />
      )}

      <GroupHeader lang={lang} userId={user.id} />

      <div className="flex gap-1 px-5 md:px-8 mb-5 mt-3">
        {['requests', 'testimonies'].map(tab => (
          <button key={tab} onClick={() => setSubTab(tab)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: subTab === tab ? 'var(--accent)' : 'var(--input-bg)', color: subTab === tab ? '#fff' : 'var(--text-2)', border: '0.5px solid var(--input-border)' }}>
            {tab === 'requests' ? t(lang, 'prayerRequests') : t(lang, 'testimonies')}
          </button>
        ))}
        <button onClick={() => setShowJoinCreate(true)} className="ml-auto px-3 py-2 rounded-xl text-xs"
          style={{ background: 'var(--input-bg)', color: 'var(--text-3)', border: '0.5px solid var(--input-border)' }}>
          + {t(lang, 'joinGroup')}
        </button>
      </div>

      <div className="px-5 md:px-8">
        {subTab === 'requests' && (
          <>
            <button onClick={() => setShowNewRequest(true)}
              className="flex items-center gap-2 w-full py-3 rounded-xl text-sm font-medium mb-5 justify-center"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              <Plus size={16} /> {t(lang, 'newRequest')}
            </button>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-3)' }} /></div>
            ) : prayers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>{t(lang, 'noRequests')}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'beFirst')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {prayers.map(p => (
                  <PrayerCard key={p.id} prayer={p} lang={lang} userId={user.id} onOpen={() => setSelectedPrayer(p)} />
                ))}
              </div>
            )}
          </>
        )}

        {subTab === 'testimonies' && (
          testimonies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>{t(lang, 'noTestimonies')}</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'beFirst')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {testimonies.map(testimony => (
                <TestimonyCard key={testimony.id} testimony={testimony} lang={lang} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
