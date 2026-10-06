import { User } from 'lucide-react';
import { resolveAvatar } from '../../lib/avatar';
import { useAvatarPhoto } from '../../hooks/useAvatarPhoto';
import { AVATAR_ICON_COMPONENTS } from './avatarIcons';

// The one place an avatar is drawn. Everything else — group cards, member and
// admin lists, friend requests, "I'm praying" faces — passes a name plus the
// stored config and gets the same tile back.
//
// `kind` decides both the default look (a group is a rounded tile, a person a
// circle) and the fallback (a group falls back to a symbol, a person to their
// initials). Avatars sit beside the display name almost everywhere, so the tile
// is decorative by default; pass `label` where it stands alone and needs a name.
//
// A photo is drawn ON TOP of the preset rather than instead of it: the tile is
// already correct before the image arrives, so there is no skeleton, no layout
// shift, and nothing to undo if the picture never loads.
export default function Avatar({
  name = '?',
  size = 32,
  kind = 'user',
  avatar = null,
  anonymous = false,
  label = null,
  className = '',
}) {
  const box = { width: size, height: size, borderRadius: kind === 'group' ? Math.round(size * 0.3) : '50%' };
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' };

  const { icon, initials, color, photo } = resolveAvatar({ config: anonymous ? null : avatar, name, kind });
  // Hooks run for every tile, anonymous or not, so the order never changes;
  // `photo` is null for an anonymous author, which makes this a no-op.
  const { url, onError } = useAvatarPhoto(anonymous ? null : photo);

  if (anonymous) {
    return (
      <div
        {...a11y}
        className={`avatar avatar--anonymous ${className}`}
        style={{ ...box, background: 'var(--input-bg)', color: 'var(--text-3)' }}
      >
        <User size={Math.round(size * 0.55)} aria-hidden="true" />
      </div>
    );
  }

  const Icon = AVATAR_ICON_COMPONENTS[icon];
  // Two letters in a tiny inline tile would render at ~7px. Below 24px one
  // letter is shown instead, at a size that is still legible.
  const compact = size < 24;
  const text = initials ? (compact ? Array.from(initials)[0] : initials) : '';
  const fontSize = Math.max(Math.round(size * (compact ? 0.5 : 0.4)), 9);

  return (
    <div {...a11y} className={`avatar ${className}`} style={{ ...box, background: color }}>
      {Icon
        ? <Icon size={Math.round(size * 0.5)} strokeWidth={1.9} aria-hidden="true" />
        : <span style={{ fontSize, lineHeight: 1 }}>{text}</span>}
      {url && (
        <img
          // The tile already carries the accessible name (or is hidden
          // outright), so the picture is silent — a member's name is never
          // announced twice just because they have a photo.
          src={url}
          alt=""
          aria-hidden="true"
          draggable={false}
          decoding="async"
          onError={onError}
          // An account picture is fetched from the identity provider; there is
          // no reason to tell them which page the reader is on.
          referrerPolicy="no-referrer"
          className="avatar__photo"
        />
      )}
    </div>
  );
}
