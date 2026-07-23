import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Avatar from './shared/Avatar';
import AnonymousToggle from './AnonymousToggle';
import UpdateComposer from './rich/UpdateComposer';
import RemovableText from './rich/RemovableText';
import AttachmentList from './rich/AttachmentList';
import DeleteButton from './rich/DeleteButton';
import EditButton from './rich/EditButton';
import MessageEditor from './rich/MessageEditor';
import { removeAttachmentFiles } from '../lib/attachments';
import { communityAuthor } from '../utils/user';
import { timeAgo } from '../utils/date';
import { t } from '../i18n';

// Member updates on a community prayer — encouragements, verses, words, now
// with light formatting and media (photos / voice notes / video / links). The
// list lives in the parent (which also feeds it to the translation toggle);
// posting a word is delegated through onSend(text, attachments, isAnonymous) so
// the parent stays the source of truth. A word's TEXT can be edited only by its
// author (onEdit) — the WhatsApp "edit message" gesture. A word can be removed
// as a whole by its author or a group admin (isAdmin) via onDelete — the same
// trash affordance used on prayer points. Attachments render read-only.
export default function CommunityUpdates({ updates, loading, loc, lang, userId, isAdmin = false, onSend, onDelete, onEdit }) {
  const [anon, setAnon] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const canDelete = (u) => !!onDelete && !u._locked && (u.user_id === userId || isAdmin);
  // Editing is strictly the author's own — an admin moderates by deleting, and
  // could not re-encrypt someone else's word anyway. Only rows with text to edit.
  const canEdit = (u) => !!onEdit && !u._locked && !!u.text && u.user_id === userId;

  // Best-effort media cleanup runs only for the author (storage objects belong
  // to them; an admin moderating someone else's word can't remove their blobs);
  // the id then goes to the parent, which owns the store call + optimistic list.
  const handleDelete = (u) => {
    if (u.user_id === userId) removeAttachmentFiles(u.attachments);
    return onDelete(u.id);
  };

  const handleSaveEdit = async (u, text) => {
    await onEdit(u.id, text);
    setEditingId(null);
  };

  return (
    <div className="prayer-activity-panel">
      <p className="prayer-activity-panel__title">{t(lang, 'memberUpdates')}</p>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-3)' }} /></div>
      ) : (
        <div className="prayer-activity-list">
          {updates.map((u) => (
            <div key={u.id} className="prayer-activity-item prayer-activity-item--community group flex gap-2.5">
              <Avatar name={u.is_anonymous ? '?' : u.author_name} size={28} anonymous={u.is_anonymous} />
              <div className="prayer-activity-item__body min-w-0 flex-1">
                <p className="prayer-activity-item__meta">
                  {communityAuthor(u, userId, lang)}{' · '}{timeAgo(u.created_at, lang)}
                </p>
                {u._locked ? (
                  <p className="text-sm italic leading-snug" style={{ color: 'var(--text-3)' }}>{t(lang, 'updateSyncing')}</p>
                ) : editingId === u.id ? (
                  <MessageEditor
                    initialText={u.text}
                    onSave={(text) => handleSaveEdit(u, text)}
                    onCancel={() => setEditingId(null)}
                    lang={lang}
                  />
                ) : (
                  <>
                    <RemovableText
                      text={loc(u.text)}
                      lang={lang}
                      className="text-sm leading-snug"
                      style={{ color: 'var(--text-1)' }}
                    />
                    <AttachmentList
                      attachments={u.attachments}
                      lang={lang}
                      className={u.text ? 'mt-1.5' : ''}
                    />
                  </>
                )}
              </div>
              {editingId !== u.id && (canEdit(u) || canDelete(u)) && (
                <div className="prayer-activity-item__actions flex items-start gap-1.5 self-start mt-0.5">
                  {canEdit(u) && (
                    <EditButton onEdit={() => setEditingId(u.id)} label={t(lang, 'editWord')} />
                  )}
                  {canDelete(u) && (
                    <DeleteButton onDelete={() => handleDelete(u)} lang={lang} label={t(lang, 'deleteWord')} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="prayer-activity-composer">
        <UpdateComposer
          lang={lang}
          rows={1}
          placeholder={t(lang, 'newUpdate')}
          onSend={(text, attachments) => onSend(text, attachments, anon)}
        />
      </div>
      <AnonymousToggle checked={anon} onChange={setAnon} lang={lang} className="mt-2" />
    </div>
  );
}
