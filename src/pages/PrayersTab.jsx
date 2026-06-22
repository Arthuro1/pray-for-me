import { useState } from 'react';
import usePrayerStore from '../store/prayerStore';
import PrayerCard from '../components/PrayerCard';
import { Search, Filter } from 'lucide-react';

const STATUS_FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'active', label: 'Actives' },
  { id: 'answered', label: 'Exaucées' },
];

export default function PrayersTab({ onEdit }) {
  const { prayers, categories } = usePrayerStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = prayers.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q) && !(p.person_name || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Sort: active first, then pending, then answered
  const sorted = [...filtered].sort((a, b) => {
    const order = { active: 0, answered: 1 };
    return (order[a.status] || 0) - (order[b.status] || 0);
  });

  return (
    <div className="p-4">
      {/* Search */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une prière..."
          className="w-full border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${showFilters ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <Filter size={15} />
        </button>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-2 pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              statusFilter === f.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      {showFilters && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3 pb-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              categoryFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            Toutes catégories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                categoryFilter === c.id ? 'text-white' : 'bg-white text-slate-500 border border-slate-200'
              }`}
              style={categoryFilter === c.id ? { backgroundColor: c.color } : {}}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-slate-400 mb-3">{sorted.length} prière{sorted.length !== 1 ? 's' : ''}</p>

      {/* Prayer list */}
      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">🙏</p>
          <p className="text-slate-500 text-sm">Aucune prière trouvée</p>
          <p className="text-slate-400 text-xs mt-1">Ajoutez votre première prière avec le bouton +</p>
        </div>
      ) : (
        sorted.map((prayer) => (
          <PrayerCard key={prayer.id} prayer={prayer} onEdit={onEdit} />
        ))
      )}
    </div>
  );
}
