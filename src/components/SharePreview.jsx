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
    <div className="share-preview">
      <p className="section-label">{t(lang, 'sharePreviewLabel')}</p>
      <div className="share-preview__who">
        <Avatar name={isAnonymous ? '?' : (authorName || '?')} anonymous={!!isAnonymous} size={30} />
        <div className="min-w-0">
          <p className="q-meta truncate">{label}</p>
          {title && <p className="truncate font-[family-name:var(--q-font-editorial)] text-[1.0625rem] leading-snug" style={{ color: 'var(--q-text)' }}>{title}</p>}
        </div>
      </div>
    </div>
  );
}
