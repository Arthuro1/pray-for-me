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
import { Search, SlidersHorizontal, Plus, CheckCircle } from 'lucide-react';
import { t } from '../i18n';
import { getAuthorName } from '../utils/user';
import { prayerPriority } from '../utils/prayer';
import { usePrayerActions } from '../hooks/usePrayerActions';

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
  // Opened from a Home shortcut (e.g. the "Active" stat) with a preset filter.
  const [statusFilter, setStatusFilter] = useState(location.state?.filter || 'all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const STATUS_FILTERS = [
    { id: 'all', label: t(lang, 'all') },
    { id: 'active', label: t(lang, 'active') },
    { id: 'answered', label: t(lang, 'answered') },
  ];

  const filtered = prayers.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
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
    const order = { active: 0, answered: 1 };
    const byStatus = (order[a.status] || 0) - (order[b.status] || 0);
    if (byStatus !== 0) return byStatus;
    return prayerPriority(a, orderById) - prayerPriority(b, orderById);
  });

  return (
    <div>
      <div className="px-4 md:px-8 pt-8 pb-5" style={{ background: 'var(--header)' }}>
        <div className="max-w-2xl mx-auto">
        {/* Persistent entry point to the answered-prayer gallery (otherwise only
            reachable from the Home "Answered" stat tile). */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-white">{t(lang, 'myPrayers')}</h2>
          <button
            onClick={() => navigate('/answered')}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium shrink-0"
            style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', border: '0.5px solid rgba(255,255,255,0.2)' }}
          >
            <CheckCircle size={13} /> {t(lang, 'answeredTitle')}
          </button>
        </div>

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

        <div className="flex gap-2 mt-3">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
              style={statusFilter === f.id
                ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '0.5px solid rgba(255,255,255,0.15)' }}
            >
              {f.label}
            </button>
          ))}
        </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-4 max-w-2xl mx-auto">
        {showFilters && (
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
      </div>
    </div>
  );
}
