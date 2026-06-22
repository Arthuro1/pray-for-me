import { useState } from 'react';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import PrayerCard from '../components/PrayerCard';
import { Search, SlidersHorizontal } from 'lucide-react';
import { t } from '../i18n';

export default function PrayersTab({ onEdit }) {
  const { prayers, categories, settings } = usePrayerStore();
  const { tr } = useTranslationStore();
  const lang = settings.language || 'fr';
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
      <div className="px-4 pt-8 pb-5" style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b5e 100%)' }}>
        <h2 className="text-xl font-semibold text-white mb-4">{t(lang, 'myPrayers')}</h2>

        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(lang, 'search')}
            className="w-full text-sm rounded-xl pl-9 pr-10 py-2.5 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.15)', color: '#fff' }}
          />
          <button onClick={() => setShowFilters(!showFilters)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: showFilters ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}>
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
                ? { background: '#7c5cfc', color: '#fff' }
                : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(255,255,255,0.15)' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
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

        <p className="text-xs mb-3" style={{ color: '#b0a4c0' }}>
          {sorted.length} {sorted.length !== 1 ? t(lang, 'prayers2') : t(lang, 'prayer')}
        </p>

        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🙏</p>
            <p className="text-sm" style={{ color: '#6b5b8a' }}>{t(lang, 'noPrayersFound')}</p>
            <p className="text-xs mt-1" style={{ color: '#b0a4c0' }}>{t(lang, 'noPrayersFoundSub')}</p>
          </div>
        ) : (
          sorted.map((prayer) => (
            <PrayerCard key={prayer.id} prayer={prayer} onEdit={onEdit} lang={lang} />
          ))
        )}
      </div>
    </div>
  );
}
