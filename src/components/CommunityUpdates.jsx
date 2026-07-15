import { useState } from 'react';
import { Loader2, Send, Trash2 } from 'lucide-react';
import Avatar from './shared/Avatar';
import AnonymousToggle from './AnonymousToggle';
import EmptyState from './shared/EmptyState';
import ConfirmDialog from './shared/ConfirmDialog';
import { communityAuthor } from '../utils/user';
import { timeAgo } from '../utils/date';
import { t } from '../i18n';

// Member updates on a community prayer — encouragements, verses, words. The list
// lives in the parent (which also feeds it to the translation toggle); posting a
// word is delegated through onSend so the parent stays the source of truth.
// A word can be removed by its author or a group admin (isAdmin) via onDelete.
export default function CommunityUpdates({ updates, loading, loc, lang, userId, isAdmin = false, onSend, onDelete }) {
  const [text, setText] = useState('');
  const [anon, setAnon] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await onSend(text.trim(), anon);
    setText('');
    setSending(false);
  };

  const canDelete = (u) => !!onDelete && !u._locked && (u.user_id === userId || isAdmin);

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    await onDelete(confirmDelete.id);
    setDeleting(false);
    setConfirmDelete(null);
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'memberUpdates')}</p>

      {confirmDelete && (
        <ConfirmDialog
          title={t(lang, 'deleteWord')}
          message={t(lang, 'deleteWarning')}
          confirmLabel={t(lang, 'delete')}
          cancelLabel={t(lang, 'cancel')}
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-3)' }} /></div>
      ) : updates.length === 0 ? (
        <EmptyState compact emoji="💬" title={t(lang, 'beFirst')} />
      ) : (
        <div className="space-y-3 mb-3">
          {updates.map((u) => (
            <div key={u.id} className="group flex gap-2.5">
              <Avatar name={u.is_anonymous ? '?' : u.author_name} size={28} anonymous={u.is_anonymous} />
              <div className="min-w-0 flex-1">
                <p className="text-xs mb-0.5 font-medium" style={{ color: 'var(--text-3)' }}>
                  {communityAuthor(u, userId, lang)}{' · '}{timeAgo(u.created_at, lang)}
                </p>
                {u._locked ? (
                  <p className="text-sm italic leading-snug" style={{ color: 'var(--text-3)' }}>{t(lang, 'updateSyncing')}</p>
                ) : (
                  <p className="text-sm leading-snug" style={{ color: 'var(--text-1)' }}>{loc(u.text)}</p>
                )}
              </div>
              {canDelete(u) && (
                <button
                  onClick={() => setConfirmDelete(u)}
                  title={t(lang, 'deleteWord')}
                  aria-label={t(lang, 'deleteWord')}
                  className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity self-start mt-0.5"
                  style={{ color: 'var(--text-3)' }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t(lang, 'wordPlaceholder')}
          className="flex-1 text-sm rounded-xl px-3 py-2 focus:outline-none"
          style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={send} disabled={!text.trim() || sending} aria-label={t(lang, 'addWord')} className="rounded-xl px-4 flex items-center justify-center text-white text-sm font-medium disabled:opacity-40" style={{ background: 'var(--accent)' }}>
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
      <AnonymousToggle checked={anon} onChange={setAnon} lang={lang} className="mt-2" />
    </div>
  );
}
