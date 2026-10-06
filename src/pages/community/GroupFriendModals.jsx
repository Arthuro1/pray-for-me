// The Community tab's create-group / join-group / add-friend dialogs, extracted
// from CommunityTab.jsx to keep that file focused on layout + routing. Each modal
// owns its own small form state and talks to the community store directly; the
// shared Modal / ModalActions shells and the add-friend flow (suggestions,
// pending sent requests, email, share link + QR) live here together because
// nothing outside this file uses them.
import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Check, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import useCommunityStore from '../../store/communityStore';
import { t } from '../../i18n';
import { toast } from '../../store/toastStore';
import Avatar from '../../components/shared/Avatar';
import ShareButtons from '../../components/shared/ShareButtons';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { CARD_STYLE, SUBTLE_BTN, INPUT_STYLE, MODAL_INPUT_CLASS } from './ui';

// The shared modal shell (Esc-to-close + focus trap). Exported because GroupView
// in CommunityTab builds its own group dialogs on the same shell.
export function Modal({ title, onClose, lang, children }) {
  useEscapeKey(onClose);
  const trapRef = useFocusTrap();
  return (
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div ref={trapRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="editorial-dialog w-full max-w-md flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 pb-4 shrink-0">
          <h3 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>{title}</h3>
          <button
            onClick={onClose}
            aria-label={t(lang, 'close')}
            className="w-11 h-11 -m-2 shrink-0 flex items-center justify-center rounded-full focus-visible:ring-2"
            style={{ color: 'var(--text-3)' }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="px-5 pb-5 overflow-y-auto">{children}</div>
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
export function CreateGroupModal({ lang, userId, onClose, onDone }) {
  const createGroup = useCommunityStore((s) => s.createGroup);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { error: err, group } = await createGroup(name.trim(), userId);
    setLoading(false);
    if (err) { setError(err); return; }
    // Land the new leader inside their group, where the first-group checklist
    // (invite → first request → pray) is waiting — no settings détour.
    onDone(group?.id || null);
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

// ── Join Group Modal ────────────────────────────────────────────────────────
// Joining happens through an invite link or code shared by a member; this modal
// accepts either (a full URL just contributes its last path segment) and reuses
// the same joinGroup flow as the /community/join/:code deep link.
export function JoinGroupModal({ lang, userId, onClose, onJoined }) {
  const joinGroup = useCommunityStore((s) => s.joinGroup);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const code = input.trim().split(/[/\s]+/).filter(Boolean).pop() || '';

  const handleJoin = async () => {
    if (!code || loading) return;
    setLoading(true);
    const res = await joinGroup(code, userId);
    setLoading(false);
    if (res.group) {
      toast.success(t(lang, 'joinedGroup'));
      onJoined(res.group.id);
    } else {
      setError(t(lang, res.error === 'alreadyMember' ? 'alreadyMember' : 'groupNotFound'));
    }
  };

  return (
    <Modal title={t(lang, 'joinGroupCta')} lang={lang} onClose={onClose}>
      <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-3)' }}>{t(lang, 'joinGroupHint')}</p>
      <input autoFocus value={input} onChange={e => { setInput(e.target.value); setError(''); }}
        placeholder={t(lang, 'joinGroupPlaceholder')}
        className={MODAL_INPUT_CLASS} style={INPUT_STYLE} />
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      <ModalActions lang={lang} onCancel={onClose} onSubmit={handleJoin}
        disabled={!code || loading} loading={loading} submitLabel={t(lang, 'join')} />
    </Modal>
  );
}

// ── Add Friend Modal ────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AddFriendModal({ lang, userId, onClose }) {
  const sendFriendRequest = useCommunityStore((s) => s.sendFriendRequest);
  const sendFriendRequestToId = useCommunityStore((s) => s.sendFriendRequestToId);
  const fetchFriendSuggestions = useCommunityStore((s) => s.fetchFriendSuggestions);
  const fetchSentFriendRequests = useCommunityStore((s) => s.fetchSentFriendRequests);
  const rejectFriendRequest = useCommunityStore((s) => s.rejectFriendRequest);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState(null); // null = loading
  const [sent, setSent] = useState([]); // outgoing requests still awaiting a response
  const [addedIds, setAddedIds] = useState(new Set());
  const [busyId, setBusyId] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const friendUrl = `${window.location.origin}/community/add-friend/${userId}`;

  const loadSent = useCallback(
    () => fetchSentFriendRequests(userId).then((r) => setSent(r.requests || [])),
    [fetchSentFriendRequests, userId],
  );

  useEffect(() => {
    fetchFriendSuggestions(userId).then((r) => setSuggestions(r.suggestions || []));
    loadSent();
  }, [userId, loadSent, fetchFriendSuggestions]);

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
    setEmail('');
    loadSent();
    toast.success(t(lang, 'requestSent'));
  };

  const handleAddSuggestion = async (id) => {
    setBusyId(id);
    const { error: err } = await sendFriendRequestToId(id, userId);
    setBusyId(null);
    if (err) { toast.error(errorText[err] || t(lang, 'errorGeneric')); return; }
    setAddedIds((prev) => new Set([...prev, id]));
    loadSent();
    toast.success(t(lang, 'requestSent'));
  };

  const handleCancel = async (req) => {
    setCancelingId(req.id);
    const { error: err } = await rejectFriendRequest(req.id);
    setCancelingId(null);
    if (err) { toast.error(t(lang, 'errorGeneric')); return; }
    setSent((prev) => prev.filter((r) => r.id !== req.id));
    toast.success(t(lang, 'requestCanceled'));
  };

  return (
    <Modal title={t(lang, 'addFriend')} lang={lang} onClose={onClose}>
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
                        <Avatar name={s.name} avatar={s.avatar} size={32} />
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

          {/* Pending requests you've sent that haven't been accepted yet */}
          {sent.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'sentRequests')}</p>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {sent.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 p-2 rounded-xl" style={CARD_STYLE}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={r.toName} avatar={r.toAvatar} size={32} />
                      <div className="min-w-0">
                        <span className="block text-sm truncate" style={{ color: 'var(--text-1)' }}>{r.toName}</span>
                        <span className="block text-xs truncate" style={{ color: 'var(--text-3)' }}>{t(lang, 'awaitingResponse')}</span>
                      </div>
                    </div>
                    <button onClick={() => handleCancel(r)} disabled={cancelingId === r.id}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50" style={SUBTLE_BTN}>
                      {cancelingId === r.id ? <Loader2 size={13} className="animate-spin" /> : t(lang, 'cancel')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add by email */}
          <div>
            <input value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="email@example.com" type="email"
              onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
              className={MODAL_INPUT_CLASS} style={INPUT_STYLE} />
            {error && (
              <p className="text-xs mb-3" style={{ color: 'var(--danger)' }}>
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
    </Modal>
  );
}
