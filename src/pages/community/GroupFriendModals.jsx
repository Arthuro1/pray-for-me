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
import { PrimaryButton, QuietButton, SecondaryButton } from '../../components/shared/Primitives';

// The shared modal shell (Esc-to-close + focus trap). Exported because GroupView
// in CommunityTab builds its own group dialogs on the same shell.
export function Modal({ title, onClose, lang, children }) {
  useEscapeKey(onClose);
  const trapRef = useFocusTrap();
  return (
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div ref={trapRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="q-dialog flex max-h-[85vh] w-full max-w-md flex-col" onClick={e => e.stopPropagation()}>
        <div className="q-dialog__header mb-0 shrink-0 px-6 pb-4 pt-6 sm:px-8 sm:pt-8">
          <h2 className="q-dialog__title">{title}</h2>
          <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 -mt-2 shrink-0">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6 sm:px-8 sm:pb-8">{children}</div>
      </div>
    </div>
  );
}

// Cancel + primary action footer shared by the form modals.
function ModalActions({ lang, onCancel, onSubmit, disabled, loading, submitLabel }) {
  return (
    <div className="q-dialog__actions">
      <SecondaryButton onClick={onCancel}>{t(lang, 'cancel')}</SecondaryButton>
      <PrimaryButton onClick={onSubmit} disabled={disabled}>
        {loading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : submitLabel}
      </PrimaryButton>
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
        aria-label={t(lang, 'groupName')} className="q-input" />
      {error && <p className="q-field__hint q-field__hint--error mt-2" role="alert">{error}</p>}
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
      <p className="q-field__hint mb-3">{t(lang, 'joinGroupHint')}</p>
      <input autoFocus value={input} onChange={e => { setInput(e.target.value); setError(''); }}
        placeholder={t(lang, 'joinGroupPlaceholder')}
        aria-label={t(lang, 'joinGroupPlaceholder')}
        className="q-input" />
      {error && <p className="q-field__hint q-field__hint--error mt-2" role="alert">{error}</p>}
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
      {/* Suggestions from shared groups */}
      {suggestions && suggestions.length > 0 && (
        <div className="q-dialog__section">
          <p className="section-label">{t(lang, 'fromYourGroups')}</p>
          <ul className="member-list max-h-56 overflow-y-auto">
            {suggestions.map((s) => {
              const added = addedIds.has(s.id);
              return (
                <li key={s.id} className="member-row">
                  <Avatar name={s.name} avatar={s.avatar} size={32} />
                  <span className="member-row__name">{s.name}</span>
                  <SecondaryButton onClick={() => handleAddSuggestion(s.id)} disabled={added || busyId === s.id} className="shrink-0">
                    {busyId === s.id
                      ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                      : added ? <Check size={14} aria-label={t(lang, 'requestSent')} /> : t(lang, 'addBtn')}
                  </SecondaryButton>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Pending requests you've sent that haven't been accepted yet */}
      {sent.length > 0 && (
        <div className="q-dialog__section">
          <p className="section-label">{t(lang, 'sentRequests')}</p>
          <ul className="member-list max-h-56 overflow-y-auto">
            {sent.map((r) => (
              <li key={r.id} className="member-row">
                <Avatar name={r.toName} avatar={r.toAvatar} size={32} />
                <span className="member-row__name">
                  <span className="block truncate">{r.toName}</span>
                  <span className="q-meta block">{t(lang, 'awaitingResponse')}</span>
                </span>
                <QuietButton onClick={() => handleCancel(r)} disabled={cancelingId === r.id} className="shrink-0" style={{ color: 'var(--q-text-secondary)' }}>
                  {cancelingId === r.id ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : t(lang, 'cancel')}
                </QuietButton>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add by email */}
      <div className="q-dialog__section">
        <input value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="email@example.com" type="email"
          aria-label={t(lang, 'addFriend')}
          onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
          className="q-input" />
        {error && (
          <p className="q-field__hint q-field__hint--error mt-2" role="alert">
            {error}
            {error === t(lang, 'userNotFound') && <> — {t(lang, 'friendLinkHint')}</>}
          </p>
        )}
        <PrimaryButton onClick={handleSendEmail} disabled={!email.trim() || loading} className="mt-3 w-full">
          {loading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : t(lang, 'send')}
        </PrimaryButton>
      </div>

      {/* Share your friend link */}
      <div className="q-dialog__section border-t pt-5" style={{ borderColor: 'var(--q-border)' }}>
        <p className="section-label">{t(lang, 'shareFriendLink')}</p>
        <p className="q-field__hint mb-1">{t(lang, 'friendLinkHint')}</p>
        <ShareButtons url={friendUrl} text={t(lang, 'addMeFriend')} copiedLabel={t(lang, 'linkCopied')} />
        <SecondaryButton icon={QrCode} onClick={() => setShowQR(v => !v)} aria-expanded={showQR} className="w-full">
          {t(lang, 'showQrCode')}
        </SecondaryButton>
        {showQR && (
          <div className="invite-code">
            <QRCodeSVG value={friendUrl} size={150} bgColor="#ffffff" fgColor="#29213F" level="M" />
          </div>
        )}
      </div>
    </Modal>
  );
}
