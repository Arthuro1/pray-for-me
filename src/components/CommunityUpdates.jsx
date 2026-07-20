import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import Avatar from './shared/Avatar';
import AnonymousToggle from './AnonymousToggle';
import EmptyState from './shared/EmptyState';
import ConfirmDialog from './shared/ConfirmDialog';
import UpdateComposer from './rich/UpdateComposer';
import RichText from './rich/RichText';
import AttachmentList from './rich/AttachmentList';
import { removeAttachmentFiles } from '../lib/attachments';
import { communityAuthor } from '../utils/user';
import { timeAgo } from '../utils/date';
import { t } from '../i18n';

// Member updates on a community prayer — encouragements, verses, words, now
// with light formatting and media (photos / voice notes / video / links). The
// list lives in the parent (which also feeds it to the translation toggle);
// posting a word is delegated through onSend(text, attachments, isAnonymous) so
// the parent stays the source of truth. A word can be removed by its author or
// a group admin (isAdmin) via onDelete; a single attachment on the viewer's
// OWN word via onRemoveAttachment(update, att) — author-only, since removal
// re-encrypts the row and deletes a storage object only the author owns.
export default function CommunityUpdates({ updates, loading, loc, lang, userId, isAdmin = false, onSend, onDelete, onRemoveAttachment }) {
  const [anon, setAnon] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canDelete = (u) => !!onDelete && !u._locked && (u.user_id === userId || isAdmin);

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    // Best-effort media cleanup — only the author owns the storage objects.
    if (confirmDelete.user_id === userId) removeAttachmentFiles(confirmDelete.attachments);
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
                  <>
                    {u.text && <RichText text={loc(u.text)} className="text-sm leading-snug" style={{ color: 'var(--text-1)' }} />}
                    <AttachmentList
                      attachments={u.attachments}
                      lang={lang}
                      className={u.text ? 'mt-1.5' : ''}
                      onRemove={onRemoveAttachment && u.user_id === userId ? (att) => onRemoveAttachment(u, att) : null}
                    />
                  </>
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

      <div className="mt-2">
        <UpdateComposer
          lang={lang}
          rows={1}
          placeholder={t(lang, 'wordPlaceholder')}
          onSend={(text, attachments) => onSend(text, attachments, anon)}
        />
      </div>
      <AnonymousToggle checked={anon} onChange={setAnon} lang={lang} className="mt-2" />
    </div>
  );
}
