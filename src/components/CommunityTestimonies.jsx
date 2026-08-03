import { useState } from 'react';
import RemovableText from './rich/RemovableText';
import AttachmentList from './rich/AttachmentList';
import DeleteButton from './rich/DeleteButton';
import EditButton from './rich/EditButton';
import MessageEditor from './rich/MessageEditor';
import { removeAttachmentFiles } from '../lib/attachments';
import { communityAuthor } from '../utils/user';
import { timeAgo } from '../utils/date';
import { t } from '../i18n';

// List of testimonies posted for a community prayer. `loc` localizes each
// testimony on demand via the parent's "See translation" toggle. A testimony's
// TEXT can be edited only by its author (onEdit) — the WhatsApp "edit message"
// gesture. A testimony can be deleted as a whole by its author or a group admin
// (isAdmin) via onDelete — the same trash affordance used on words and prayer
// points. Attachments render read-only.
export default function CommunityTestimonies({ items, loc, lang, userId, isAdmin = false, onDelete, onEdit }) {
  const [editingId, setEditingId] = useState(null);

  if (!items.length) return null;

  const canDelete = (tm) => !!onDelete && !tm._locked && (tm.user_id === userId || isAdmin);
  // Author-only editing (an admin moderates by deleting), and only when there
  // is text to edit.
  const canEdit = (tm) => !!onEdit && !tm._locked && !!tm.content && tm.user_id === userId;

  // Best-effort media cleanup runs only for the author (an admin moderating
  // someone else's testimony can't remove their storage blobs); the id then
  // goes to the parent, which owns the store call.
  const handleDelete = (tm) => {
    if (tm.user_id === userId) removeAttachmentFiles(tm.attachments);
    return onDelete(tm.id);
  };

  const handleSaveEdit = async (tm, content) => {
    const saved = await onEdit(tm.id, content);
    if (saved !== false) setEditingId(null);
  };

  return (
    <div className="prayer-activity-panel">
      <p className="prayer-activity-panel__title">{t(lang, 'testimonies')}</p>
      <div className="prayer-activity-list">
        {items.map((tm) => (
          <div key={tm.id} className="prayer-activity-item prayer-activity-item--testimony group">
            <div className="prayer-activity-item__header">
              <p className="prayer-activity-item__meta">
                🎉 {communityAuthor(tm, userId, lang)} · {timeAgo(tm.created_at, lang)}
              </p>
              {editingId !== tm.id && (canEdit(tm) || canDelete(tm)) && (
                <div className="prayer-activity-item__actions flex items-start gap-1.5 mt-0.5">
                  {canEdit(tm) && (
                    <EditButton onEdit={() => setEditingId(tm.id)} label={t(lang, 'editTestimony')} />
                  )}
                  {canDelete(tm) && (
                    <DeleteButton onDelete={() => handleDelete(tm)} lang={lang} label={t(lang, 'deleteTestimony')} />
                  )}
                </div>
              )}
            </div>
            {editingId === tm.id ? (
              <MessageEditor
                initialText={tm.content}
                onSave={(content) => handleSaveEdit(tm, content)}
                onCancel={() => setEditingId(null)}
                lang={lang}
              />
            ) : (
              <>
                <RemovableText
                  text={loc(tm.content)}
                  lang={lang}
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--text-1)' }}
                />
                <AttachmentList
                  attachments={tm.attachments}
                  lang={lang}
                  className={tm.content ? 'mt-1.5' : ''}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
