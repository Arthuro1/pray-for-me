import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, EyeOff, HandHeart, Pin, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import useAuthStore from '../store/authStore';
import useCommunityStore from '../store/communityStore';
import { dateLocale, timeAgo, groupByThisMonth } from '../utils/date';
import { testimonyList } from '../utils/prayer';
import { originAuthor, getAuthorName } from '../utils/user';
import { bibleLink } from '../utils/bibleLink';
import { faithfulnessPassage } from '../lib/prayerMovements';
import { t } from '../i18n';
import Avatar from '../components/Avatar';
import SwipeableRow from '../components/SwipeableRow';
import EmptyState from '../components/EmptyState';
import Encouragement from '../components/Encouragement';
import { usePrayerActions } from '../hooks/usePrayerActions';

// A reflective "God's faithfulness" view of all answered prayers.
export default function AnsweredTab() {
  const navigate = useNavigate();
  const { prayers, categories, settings } = usePrayerStore(
    useShallow((s) => ({ prayers: s.prayers, categories: s.categories, settings: s.settings }))
  );
  const { tr } = useTranslationStore();
  const { user } = useAuthStore();
  const prayerShares = useCommunityStore((s) => s.prayerShares);
  const fetchPrayerShares = useCommunityStore((s) => s.fetchPrayerShares);
  const lang = settings.language || 'fr';
  const locale = dateLocale(lang);
  const currentUserName = getAuthorName(user);
  const { swipeActions } = usePrayerActions(lang);

  useEffect(() => { if (user?.id) fetchPrayerShares(user.id); }, [user?.id]);

  const answered = prayers
    .filter(p => p.status === 'answered')
    .sort((a, b) => {
      const byPin = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      if (byPin !== 0) return byPin;
      return new Date(b.answered_at || b.updated_at || 0) - new Date(a.answered_at || a.updated_at || 0);
    });

  // Split into "this month" and "earlier" for a sense of remembrance over time
  // (not a score). Order within each group keeps the pinned-first / recent-first sort.
  const groups = groupByThisMonth(answered, (p) => p.answered_at || p.updated_at);

  const faithfulnessRef = faithfulnessPassage(lang);

  const renderCard = (prayer) => {
    const pCatIds = (prayer.prayer_categories || []).map(pc => pc.category_id);
    const pCats = categories.filter(c => pCatIds.includes(c.id));
    const testimonies = testimonyList(prayer);
    const lastTestimony = testimonies.slice(-1)[0];
    const oa = originAuthor(prayer);
    const authorName = oa ? (oa.anonymous ? '?' : oa.name) : currentUserName;
    const authorLabel = oa ? (oa.anonymous ? t(lang, 'anonymous') : oa.name) : t(lang, 'meAuthor');
    const groupShares = prayerShares[prayer.id] || [];
    const totalPraying = groupShares.reduce((n, s) => n + (s.prayingCount || 0), 0);
    return (
      <SwipeableRow key={prayer.id} actions={swipeActions(prayer)}>
        <button onClick={() => navigate(`/prayers/${prayer.id}`)}
          className="w-full text-left rounded-2xl p-4 transition-all hover:scale-[1.01]"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderLeft: '3px solid var(--success)' }}>
          {/* Author + creation date header (matches community cards) */}
          <div className="flex items-center gap-2 mb-1.5 min-w-0">
            <Avatar name={authorName} size={26} anonymous={oa?.anonymous} />
            <p className="text-xs truncate flex-1" style={{ color: 'var(--text-3)' }}>
              {authorLabel} · {timeAgo(prayer.created_at, lang)}
              {prayer.origin_group_name ? ` · ${prayer.origin_group_name}` : ''}
            </p>
            {prayer.pinned && <Pin size={13} fill="currentColor" className="shrink-0" style={{ color: 'var(--accent)' }} />}
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{tr(prayer.title, lang)}</p>
          {lastTestimony && (
            <p className="text-sm italic leading-relaxed mb-2" style={{ color: 'var(--text-2)' }}>"{tr(lastTestimony.content, lang)}"</p>
          )}
          {/* Gentle gratitude nudge when no testimony has been recorded yet */}
          {testimonies.length === 0 && (
            <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
              🙏 {t(lang, 'thanksPrompt')}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {prayer.answered_at && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#e8f5ed', color: '#059669' }}>
                🙌 {format(new Date(prayer.answered_at), 'd MMM yyyy', { locale })}
              </span>
            )}
            {pCats.map(c => (
              <span key={c.id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                {c.emoji} {tr(c.name, lang)}
              </span>
            ))}
          </div>
          {groupShares.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <Users size={11} style={{ color: 'var(--accent)' }} />
              {groupShares.map(s => (
                <span key={s.groupId} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  {s.groupName}
                </span>
              ))}
              {groupShares.some(s => s.isAnonymous) && (
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
      </SwipeableRow>
    );
  };

  return (
    <div>
      <div className="px-4 md:px-8 pt-8 pb-6" style={{ background: 'var(--header)' }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
          <ArrowLeft size={16} /> {t(lang, 'today')}
        </button>
        <h2 className="text-xl font-semibold text-white">🎉 {t(lang, 'answeredTitle')}</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>{t(lang, 'faithfulness')}</p>
      </div>

      <div className="px-4 md:px-8 pt-5 max-w-2xl mx-auto">
        {answered.length === 0 ? (
          <>
            <EmptyState
              emoji="🙏"
              title={t(lang, 'noAnsweredYet')}
              subtitle={t(lang, 'noAnsweredSub')}
              actionLabel={t(lang, 'today')}
              onAction={() => navigate('/')}
            />
            <Encouragement lang={lang} className="text-center mt-4" />
          </>
        ) : (
          <>
            {/* Remembrance: a Psalm of God's faithfulness, read in full */}
            {faithfulnessRef && (
              <a
                href={bibleLink(faithfulnessRef, lang)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-2xl p-4 mb-4"
                style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}
              >
                <span className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                  <BookOpen size={15} /> {faithfulnessRef}
                </span>
                <span className="text-xs shrink-0" style={{ color: 'var(--accent)' }}>{t(lang, 'readWholeChapter')}</span>
              </a>
            )}

            <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
              {answered.length} {answered.length !== 1 ? t(lang, 'prayers2') : t(lang, 'prayer')}
            </p>

            {groups.map(g => (
              <div key={g.key} className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
                  {t(lang, g.key)}
                </p>
                <div className="flex flex-col gap-3">
                  {g.items.map(renderCard)}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
