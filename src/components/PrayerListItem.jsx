import { ChevronRight, EyeOff, HandHeart, Pin, Search, Sparkles, Users } from 'lucide-react';
import { t } from '../i18n';
import { originAuthor } from '../utils/user';
import { timeAgo } from '../utils/date';
import { scheduleEnded } from '../lib/planner';
import { todayKey } from '../lib/prayedLog';
import { scheduleSummary } from '../lib/scheduleDraft';
import Avatar from './shared/Avatar';

const CARD = { background: 'var(--surface)', border: '0.5px solid var(--border)' };

// Spacious prayer card used by the personal My Prayers and Home lists,
// matching the look of the community prayer wall (author + date header first).
export default function PrayerListItem({ prayer, categories, lang, tr, shares, currentUserName = '', onClick, variant = 'card', searchMatch = null }) {
  const isAnswered = prayer.status === 'answered';
  // A finished series reads "Series ended", never "Active" — the plan is over
  // even though the prayer stays in the journal.
  const isEnded = !isAnswered && scheduleEnded(prayer, todayKey());
  const pCatIds = (prayer.prayer_categories || []).map((pc) => pc.category_id);
  const pCats = categories.filter((c) => pCatIds.includes(c.id));
  const oa = originAuthor(prayer);
  const groupShares = shares || [];
  // Author: original author for saved community prayers, otherwise the user ("Me").
  const authorName = oa ? (oa.anonymous ? '?' : oa.name) : currentUserName;
  const authorLabel = oa ? (oa.anonymous ? t(lang, 'anonymous') : oa.name) : t(lang, 'meAuthor');
  const totalPraying = groupShares.reduce((n, s) => n + (s.prayingCount || 0), 0);

  if (variant === 'constellation') {
    const rhythm = isAnswered
      ? t(lang, 'answered')
      : isEnded
        ? t(lang, 'seriesEnded')
        : scheduleSummary(prayer.schedule, lang) || t(lang, 'sentDaily');

    return (
      <button
        type="button"
        onClick={onClick}
        className={`constellation-journal-row pressable ${isAnswered ? 'constellation-journal-row--answered' : ''}`}
      >
        <Sparkles
          size={18}
          strokeWidth={1.7}
          aria-hidden="true"
          className="constellation-journal-row__star"
        />
        <span className="constellation-journal-row__body">
          <span className="constellation-journal-row__title">
            {tr(prayer.title, lang)}
          </span>
          <span className="constellation-journal-row__meta">
            <span className={isAnswered ? 'constellation-journal-row__answered' : ''}>
              {rhythm}
            </span>
            {totalPraying > 0 && (
              <span className="constellation-journal-row__shared">
                {totalPraying} {t(lang, 'prayingCount')}
              </span>
            )}
          </span>
          {searchMatch?.text && !['title', 'person'].includes(searchMatch.field) && (
            <span className="constellation-journal-row__match">
              <Search size={12} aria-hidden="true" />
              <span>{tr(searchMatch.text, lang)}</span>
            </span>
          )}
        </span>
        <ChevronRight
          size={22}
          strokeWidth={1.65}
          aria-hidden="true"
          className="constellation-journal-row__chevron"
        />
      </button>
    );
  }

  // Today uses a journal row: title first, only the person/source when useful.
  // Full authorship, schedule and sharing metadata remain available in Journal
  // and on the detail page, where that context belongs.
  if (variant === 'journal') {
    const context = prayer.for_other && prayer.person_name
      ? prayer.person_name
      : prayer.origin_group_name || '';
    return (
      <button
        type="button"
        onClick={onClick}
        className="journal-row constellation-today-row pressable flex min-h-[76px] w-full items-center gap-3 px-1 py-4 text-left"
      >
        <Sparkles
          size={16}
          strokeWidth={1.7}
          aria-hidden="true"
          className="constellation-today-row__star shrink-0"
        />
        <span className="min-w-0 flex-1">
          <span className="editorial block text-lg leading-snug" style={{ color: 'var(--text-1)' }}>
            {tr(prayer.title, lang)}
          </span>
          {context && <span className="mt-1 block truncate text-xs" style={{ color: 'var(--text-3)' }}>{context}</span>}
        </span>
        <ChevronRight size={20} strokeWidth={1.65} aria-hidden="true" style={{ color: 'var(--text-3)' }} />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="prayer-card w-full text-left p-4 rounded-2xl transition-all hover:scale-[1.01]"
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
        <div className="shrink-0 flex items-center gap-1.5">
          {prayer.pinned && <Pin size={13} fill="currentColor" style={{ color: 'var(--accent)' }} />}
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={isAnswered
              ? { background: 'var(--answered-pill-bg)', color: 'var(--answered-pill-text)' }
              : isEnded
                ? { background: 'var(--input-bg)', color: 'var(--text-3)' }
                : { background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {t(lang, isAnswered ? 'answered2' : isEnded ? 'seriesEnded' : 'active2')}
          </span>
        </div>
      </div>

      <p
        className="prayer-card__title text-[15px] font-medium leading-snug mb-2"
        style={{ color: 'var(--text-1)', textDecoration: isAnswered ? 'line-through' : 'none', opacity: isAnswered ? 0.6 : 1 }}
      >
        {tr(prayer.title, lang)}
      </p>

      {searchMatch?.text && !['title', 'person'].includes(searchMatch.field) && (
        <p className="mb-2 flex items-start gap-1.5 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
          <Search size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span className="line-clamp-2">{tr(searchMatch.text, lang)}</span>
        </p>
      )}

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
        <div className="text-xs flex items-center gap-1.5 mb-1" style={{ color: 'var(--text-3)' }}>
          <Avatar name={prayer.person_name} size={18} /> {prayer.person_name}
        </div>
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
