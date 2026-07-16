import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import PrayerListSkeleton from '../components/shared/Skeleton';
import PrayerListItem from '../components/PrayerListItem';
import SwipeableRow from '../components/shared/SwipeableRow';
import EmptyState from '../components/shared/EmptyState';
import AnsweredGallery from '../components/AnsweredGallery';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { t } from '../i18n';
import { getAuthorName } from '../utils/user';
import { prayerPriority } from '../utils/prayer';
import { weeklyRecap } from '../utils/recap';
import { usePrayerActions } from '../hooks/usePrayerActions';

// The Journal: every request and its history, in two simple segments — Active
// and Answered. The answered segment IS the remembrance gallery (no separate
// page, no duplicate shortcuts), and the at-a-glance stats moved here from Home
// so Today stays purely about praying.
export default function PrayersTab({ onAdd }) {
  const navigate = useNavigate();
  const { prayers, categories, settings, loading } = usePrayerStore(
    useShallow((s) => ({ prayers: s.prayers, categories: s.categories, settings: s.settings, loading: s.loading }))
  );
  const { tr } = useTranslationStore();
  const { user } = useAuthStore();
  const prayerShares = useCommunityStore((s) => s.prayerShares);
  const fetchPrayerShares = useCommunityStore((s) => s.fetchPrayerShares);
  const lang = settings.language || 'fr';
  const { swipeActions } = usePrayerActions(lang);
  const location = useLocation();

  useEffect(() => { if (user?.id) fetchPrayerShares(user.id); }, [user?.id]);
  // Opened from a shortcut (e.g. Home once linked here) with a preset segment.
  const [segment, setSegment] = useState(location.state?.filter === 'answered' ? 'answered' : 'active');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const SEGMENTS = [
    { id: 'active', label: t(lang, 'active') },
    { id: 'answered', label: t(lang, 'answered') },
  ];

  const activeCount = prayers.filter((p) => p.status === 'active').length;
  const answeredCount = prayers.filter((p) => p.status === 'answered').length;
  const recap = weeklyRecap(prayers, new Date());

  const filtered = prayers.filter((p) => {
    if (p.status !== 'active') return false;
    if (categoryFilter !== 'all') {
      const pCatIds = (p.prayer_categories || []).map((pc) => pc.category_id);
      if (!pCatIds.includes(categoryFilter)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q) && !(p.person_name || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const orderById = Object.fromEntries(categories.map((c, i) => [c.id, i]));
  const sorted = [...filtered].sort((a, b) => {
    const byPin = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
    if (byPin !== 0) return byPin;
    return prayerPriority(a, orderById) - prayerPriority(b, orderById);
  });

  return (
    <div>
      <div className="px-4 md:px-8 pt-8 pb-5" style={{ background: 'var(--header)' }}>
        <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-white mb-4">{t(lang, 'journal')}</h2>

        {/* At-a-glance stats (moved here from Home): active / answered / +this week */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {[
            { value: activeCount, label: t(lang, 'activePrayers'), onClick: () => setSegment('active') },
            { value: answeredCount, label: t(lang, 'answeredPrayers'), onClick: () => setSegment('answered') },
            { value: `+${recap.answered}`, label: t(lang, 'thisWeek'), onClick: () => setSegment('answered') },
          ].map(({ value, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.2)' }}
            >
              <p className="text-xl font-semibold text-white">{value}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</p>
            </button>
          ))}
        </div>

        {/* Two simple segments: Active | Answered */}
        <div className="flex gap-1 p-1 rounded-2xl mb-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
          {SEGMENTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSegment(s.id)}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
              style={segment === s.id
                ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                : { color: 'rgba(255,255,255,0.7)' }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {segment === 'active' && (
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.5)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(lang, 'search')}
              className="w-full text-sm rounded-xl pl-9 pr-10 py-2.5 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.2)', color: '#fff' }}
            />
            <button onClick={() => setShowFilters(!showFilters)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <SlidersHorizontal size={15} />
            </button>
          </div>
        )}
        </div>
      </div>

      <div className="px-4 md:px-8 pt-4 max-w-2xl mx-auto">
        {segment === 'answered' ? (
          <AnsweredGallery />
        ) : (
          <>
            {showFilters && categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setCategoryFilter('all')}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-full font-medium"
                  style={categoryFilter === 'all' ? { background: '#2d1b5e', color: '#fff' } : { background: '#fff', color: '#6b5b8a', border: '0.5px solid #ede8f5' }}
                >
                  {t(lang, 'allCategories')}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryFilter(c.id)}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-full font-medium"
                    style={categoryFilter === c.id ? { backgroundColor: c.color, color: '#fff' } : { background: '#fff', color: '#6b5b8a', border: '0.5px solid #ede8f5' }}
                  >
                    {c.emoji} {tr(c.name, lang)}
                  </button>
                ))}
              </div>
            )}

            {!(loading && prayers.length === 0) && (
              <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>
                {sorted.length} {sorted.length !== 1 ? t(lang, 'prayers2') : t(lang, 'prayer')}
              </p>
            )}

            {loading && prayers.length === 0 ? (
              <PrayerListSkeleton count={5} />
            ) : sorted.length === 0 ? (
              <EmptyState
                emoji="🙏"
                title={t(lang, 'noPrayersFound')}
                subtitle={t(lang, 'noPrayersFoundSub')}
                actionLabel={onAdd ? t(lang, 'emptyAddManual') : undefined}
                actionIcon={Plus}
                onAction={onAdd}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {sorted.map((prayer) => (
                  <SwipeableRow key={prayer.id} actions={swipeActions(prayer)}>
                    <PrayerListItem
                      prayer={prayer}
                      categories={categories}
                      lang={lang}
                      tr={tr}
                      shares={prayerShares[prayer.id]}
                      currentUserName={getAuthorName(user)}
                      onClick={() => navigate(`/prayers/${prayer.id}`)}
                    />
                  </SwipeableRow>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
