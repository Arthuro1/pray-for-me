import { MessageSquare } from 'lucide-react';
import { t } from '../../i18n';
import { timeAgo } from '../../utils/date';
import { communityAuthor, getAuthorName } from '../../utils/user';
import Avatar from '../../components/shared/Avatar';
import CarryButton from '../../components/shared/CarryButton';
import CarryPlacement from '../../components/circles/CarryPlacement';
import LockedNotice from '../../components/LockedNotice';
import RichText from '../../components/rich/RichText';
import { StatusLabel } from '../../components/shared/Primitives';
import useCommunityPrayerActions from '../prayerDetail/useCommunityPrayerActions';

// One request on a group's wall, read as intercession rather than a post: who
// asked, what they asked, and the one thing to do with it — carry it. The
// count of those carrying stays secondary; nothing here is a like, a rank or a
// reaction. Carrying from the list is the same act as on the prayer's page
// (it joins "Prayers you're carrying"); right after carrying, a quiet "Place on
// your altar" follows, and a placed request names the carrier's own circle —
// seen by the carrier alone. An answered request shows that it was
// answered instead, and is never struck through. What a member wrote keeps
// its own direction (dir="auto"), whatever the interface language.
export default function GroupPrayerRow({ prayer, user, lang, avatar, onOpen }) {
  const { communityHasReacted, togglingPraying, handleTogglePraying, carriedCopy, justCarried } = useCommunityPrayerActions({
    communityPrayer: prayer,
    isCommunity: true,
    user,
    authorName: getAuthorName(user),
    lang,
  });
  const carrying = prayer.prayer_reactions?.[0]?.count ?? 0;
  const updates = prayer.community_updates?.[0]?.count ?? 0;
  const titleId = `group-prayer-${prayer.id}`;

  return (
    <li className="together-prayer">
      <p className="together-prayer__author">
        <Avatar name={prayer.is_anonymous ? '?' : prayer.author_name} avatar={prayer.is_anonymous ? null : avatar} size={24} anonymous={prayer.is_anonymous} />
        <span className="min-w-0 truncate">{communityAuthor(prayer, user.id, lang)} · {timeAgo(prayer.created_at, lang)}</span>
      </p>

      {prayer._locked ? (
        <button type="button" onClick={onOpen} className="together-prayer__open together-prayer__open--locked">
          <LockedNotice lang={lang} inline />
        </button>
      ) : (
        <>
          <button type="button" id={titleId} onClick={onOpen} className="together-prayer__open">
            <span className="together-prayer__title" dir="auto">{prayer.title}</span>
          </button>
          {prayer.description && (
            <div dir="auto"><RichText text={prayer.description} className="together-prayer__description line-clamp-2" /></div>
          )}
        </>
      )}

      <div className="together-prayer__foot">
        {prayer.is_answered ? (
          <StatusLabel tone="answered">{t(lang, 'answered')}</StatusLabel>
        ) : !prayer._locked && (
          <>
            <CarryButton
              variant="quiet"
              carrying={communityHasReacted}
              busy={togglingPraying}
              onToggle={handleTogglePraying}
              lang={lang}
              className="together-prayer__carry"
              aria-describedby={titleId}
            />
            {communityHasReacted && (
              <CarryPlacement copy={carriedCopy} offer={justCarried} lang={lang} className="together-prayer__placement" />
            )}
          </>
        )}
        <span className="together-prayer__meta">
          {carrying > 0 && <span>{carrying} {t(lang, 'prayingCount')}</span>}
          {updates > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare size={13} aria-hidden="true" />
              <span className="sr-only">{t(lang, 'memberUpdates')}</span>
              {updates}
            </span>
          )}
        </span>
      </div>
    </li>
  );
}
