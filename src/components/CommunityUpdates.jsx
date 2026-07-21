import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Avatar from './shared/Avatar';
import AnonymousToggle from './AnonymousToggle';
import EmptyState from './shared/EmptyState';
import UpdateComposer from './rich/UpdateComposer';
import RemovableText from './rich/RemovableText';
import AttachmentList from './rich/AttachmentList';
import DeleteButton from './rich/DeleteButton';
import { removeAttachmentFiles } from '../lib/attachments';
import { communityAuthor } from '../utils/user';
import { timeAgo } from '../utils/date';
import { t } from '../i18n';

// Member updates on a community prayer — encouragements, verses, words, now
// with light formatting and media (photos / voice notes / video / links). The
// list lives in the parent (which also feeds it to the translation toggle);
// posting a word is delegated through onSend(text, attachments, isAnonymous) so
// the parent stays the source of truth. A word can be removed as a whole by its
// author or a group admin (isAdmin) via onDelete — the same trash affordance
// used on prayer points; a single attachment or the text on the viewer's OWN
// word via onRemoveAttachment(update, att) / onRemoveText(update) — author-only,
// since removal re-encrypts the row and deletes storage objects only the
// author owns.
export default function CommunityUpdates({ updates, loading, loc, lang, userId, isAdmin = false, onSend, onDelete, onRemoveAttachment, onRemoveText }) {
  const [anon, setAnon] = useState(false);

  const canDelete = (u) => !!onDelete && !u._locked && (u.user_id === userId || isAdmin);

  // Best-effort media cleanup runs only for the author (storage objects belong
  // to them; an admin moderating someone else's word can't remove their blobs);
  // the id then goes to the parent, which owns the store call + optimistic list.
  const handleDelete = (u) => {
    if (u.user_id === userId) removeAttachmentFiles(u.attachments);
    return onDelete(u.id);
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'memberUpdates')}</p>

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
                    <RemovableText
                      text={loc(u.text)}
                      lang={lang}
                      className="text-sm leading-snug"
                      style={{ color: 'var(--text-1)' }}
                      onRemove={onRemoveText && u.user_id === userId ? () => onRemoveText(u) : null}
                    />
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
                <DeleteButton
                  onDelete={() => handleDelete(u)}
                  lang={lang}
                  label={t(lang, 'deleteWord')}
                  className="self-start mt-0.5"
                />
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
