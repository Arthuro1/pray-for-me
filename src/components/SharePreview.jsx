import Avatar from './shared/Avatar';
import { communityAuthor } from '../utils/user';
import { t } from '../i18n';

// A faithful preview of how a shared prayer will appear to GROUP MEMBERS, so the
// user sees exactly what attribution they're publishing before they share.
// Mirrors the community feed: sharing anonymously hides the name behind the "?"
// avatar and the anonymous label; otherwise the sharer's name is shown. Rendered
// from a member's perspective (no user id passed) so it never shows the "Me"
// shortcut the author themselves would see.
export default function SharePreview({ authorName, isAnonymous, title, lang = 'en' }) {
  const label = communityAuthor({ is_anonymous: isAnonymous, author_name: authorName }, null, lang);
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
        {t(lang, 'sharePreviewLabel')}
      </p>
      <div className="flex items-center gap-2.5">
        <Avatar name={isAnonymous ? '?' : (authorName || '?')} anonymous={!!isAnonymous} size={30} />
        <div className="min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-2)' }}>{label}</p>
          {title && <p className="text-sm leading-snug truncate" style={{ color: 'var(--text-1)' }}>{title}</p>}
        </div>
      </div>
    </div>
  );
}
