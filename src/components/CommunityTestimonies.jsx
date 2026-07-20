import RichText from './rich/RichText';
import AttachmentList from './rich/AttachmentList';
import { communityAuthor } from '../utils/user';
import { timeAgo } from '../utils/date';
import { t } from '../i18n';

// List of testimonies posted for a community prayer. `loc` localizes each
// testimony on demand via the parent's "See translation" toggle. The viewer
// can delete an attachment from their OWN testimony via
// onRemoveAttachment(testimony, att) — author-only, since removal re-encrypts
// the row and deletes a storage object only the author owns.
export default function CommunityTestimonies({ items, loc, lang, userId, onRemoveAttachment }) {
  if (!items.length) return null;
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'testimonies')}</p>
      <div className="space-y-3">
        {items.map((tm) => (
          <div key={tm.id} className="rounded-xl p-3" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>
              🎉 {communityAuthor(tm, userId, lang)} · {timeAgo(tm.created_at, lang)}
            </p>
            {tm.content && <RichText text={loc(tm.content)} className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }} />}
            <AttachmentList
              attachments={tm.attachments}
              lang={lang}
              className={tm.content ? 'mt-1.5' : ''}
              onRemove={onRemoveAttachment && tm.user_id === userId && !tm._locked ? (att) => onRemoveAttachment(tm, att) : null}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
