import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import PrayerListSkeleton from '../components/Skeleton';
import Avatar from '../components/Avatar';
import { Search, SlidersHorizontal, Users, EyeOff } from 'lucide-react';
import { t } from '../i18n';
import { originAuthor } from '../utils/user';

export default function PrayersTab() {
  const navigate = useNavigate();
  const { prayers, categories, settings, loading } = usePrayerStore();
  const { tr } = useTranslationStore();
  const { user } = useAuthStore();
  const { prayerShares, fetchPrayerShares } = useCommunityStore();
  const lang = settings.language || 'fr';

  useEffect(() => { if (user?.id) fetchPrayerShares(user.id); }, [user?.id]);
  const [statusFilter, setStatusFilter] = useState('all');
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

  const sorted = [...filtered].sort((a, b) => {
    const order = { active: 0, answered: 1 };
    return (order[a.status] || 0) - (order[b.status] || 0);
  });

  return (
    <div>
      <div className="px-4 md:px-8 pt-8 pb-5" style={{ background: 'var(--header)' }}>
        <h2 className="text-xl font-semibold mb-4 text-white">{t(lang, 'myPrayers')}</h2>

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

      <div className="px-4 md:px-8 pt-4">
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
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🙏</p>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>{t(lang, 'noPrayersFound')}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{t(lang, 'noPrayersFoundSub')}</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '0.5px solid var(--border)' }}>
            {sorted.map((prayer, idx) => {
              const isAnswered = prayer.status === 'answered';
              const pCatIds = (prayer.prayer_categories || []).map(pc => pc.category_id);
              const pCats = categories.filter(c => pCatIds.includes(c.id));
              return (
                <button
                  key={prayer.id}
                  onClick={() => navigate(`/prayers/${prayer.id}`)}
                  className="w-full text-left flex items-center gap-3 px-4 py-3.5 transition-colors"
                  style={{
                    background: 'var(--surface)',
                    borderBottom: idx < sorted.length - 1 ? '0.5px solid var(--border)' : 'none',
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: isAnswered ? '#059669' : 'var(--accent)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)', textDecoration: isAnswered ? 'line-through' : 'none', opacity: isAnswered ? 0.6 : 1 }}>
                      {tr(prayer.title, lang)}
                    </p>
                    {pCats.length > 0 && (
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-3)' }}>
                        {pCats.map(c => `${c.emoji} ${tr(c.name, lang)}`).join(' · ')}
                      </p>
                    )}
                    {prayer.for_other && prayer.person_name && (
                      <p className="text-xs truncate mt-1 flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
                        <Avatar name={prayer.person_name} size={18} /> {prayer.person_name}
                      </p>
                    )}
                    {(() => {
                      const oa = originAuthor(prayer);
                      return oa ? (
                        <p className="text-xs truncate mt-1 flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
                          <Avatar name={oa.anonymous ? '?' : oa.name} size={18} anonymous={oa.anonymous} /> {oa.anonymous ? t(lang, 'anonymous') : oa.name}
                        </p>
                      ) : null;
                    })()}
                    {(prayerShares[prayer.id] || []).length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        <Users size={11} style={{ color: 'var(--accent)' }} />
                        {prayerShares[prayer.id].map(s => (
                          <span key={s.groupId} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                            {s.groupName}
                          </span>
                        ))}
                        {prayerShares[prayer.id].some(s => s.isAnonymous) && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: 'var(--input-bg)', color: 'var(--text-3)' }}>
                            <EyeOff size={9} /> {t(lang, 'anonymous')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-xs px-2 py-0.5 rounded-full" style={{ background: isAnswered ? '#e8f5ed' : 'var(--accent-soft)', color: isAnswered ? '#059669' : 'var(--accent)' }}>
                    {isAnswered ? t(lang, 'answered2') : t(lang, 'active2')}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
