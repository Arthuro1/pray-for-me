import { Users, EyeOff, HandHeart } from 'lucide-react';
import { t } from '../i18n';
import { originAuthor } from '../utils/user';
import { timeAgo } from '../utils/date';
import Avatar from './Avatar';

const CARD = { background: 'var(--surface)', border: '0.5px solid var(--border)' };

// Spacious prayer card used by the personal My Prayers and Home lists,
// matching the look of the community prayer wall (author + date header first).
export default function PrayerListItem({ prayer, categories, lang, tr, shares, currentUserName = '', onClick }) {
  const isAnswered = prayer.status === 'answered';
  const pCatIds = (prayer.prayer_categories || []).map((pc) => pc.category_id);
  const pCats = categories.filter((c) => pCatIds.includes(c.id));
  const oa = originAuthor(prayer);
  const groupShares = shares || [];
  // Author: original author for saved community prayers, otherwise the user ("Me").
  const authorName = oa ? (oa.anonymous ? '?' : oa.name) : currentUserName;
  const authorLabel = oa ? (oa.anonymous ? t(lang, 'anonymous') : oa.name) : t(lang, 'meAuthor');
  const totalPraying = groupShares.reduce((n, s) => n + (s.prayingCount || 0), 0);

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl transition-all hover:scale-[1.01]"
      style={CARD}
    >
      {/* Author + creation date header (matches community cards) */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={authorName} size={26} anonymous={oa?.anonymous} />
          <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
            {authorLabel} · {timeAgo(prayer.created_at, lang)}
            {prayer.origin_group_name ? ` · ${prayer.origin_group_name}` : ''}
          </p>
        </div>
        <span
          className="shrink-0 text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ background: isAnswered ? '#e8f5ed' : 'var(--accent-soft)', color: isAnswered ? '#059669' : 'var(--accent)' }}
        >
          {isAnswered ? t(lang, 'answered2') : t(lang, 'active2')}
        </span>
      </div>

      <p
        className="text-[15px] font-medium leading-snug mb-2"
        style={{ color: 'var(--text-1)', textDecoration: isAnswered ? 'line-through' : 'none', opacity: isAnswered ? 0.6 : 1 }}
      >
        {tr(prayer.title, lang)}
      </p>

      {pCats.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {pCats.map((c) => (
            <span key={c.id} className="text-[11px] px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: c.color }}>
              {c.emoji} {tr(c.name, lang)}
            </span>
          ))}
        </div>
      )}

      {prayer.for_other && prayer.person_name && (
        <p className="text-xs flex items-center gap-1.5 mb-1" style={{ color: 'var(--text-3)' }}>
          <Avatar name={prayer.person_name} size={18} /> {prayer.person_name}
        </p>
      )}

      {groupShares.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <Users size={11} style={{ color: 'var(--accent)' }} />
          {groupShares.map((s) => (
            <span key={s.groupId} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              {s.groupName}
            </span>
          ))}
          {groupShares.some((s) => s.isAnonymous) && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: 'var(--input-bg)', color: 'var(--text-3)' }}>
              <EyeOff size={9} /> {t(lang, 'anonymous')}
            </span>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: 'var(--input-bg)', color: 'var(--text-3)' }}>
            <HandHeart size={10} /> {totalPraying} {t(lang, 'prayingCount')}
          </span>
        </div>
      )}
    </button>
  );
}
