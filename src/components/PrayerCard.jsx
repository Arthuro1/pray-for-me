import { useState } from 'react';
import { CheckCircle, Clock, ChevronDown, ChevronUp, Plus, Trash2, Edit2 } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PrayerCard({ prayer, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [newUpdate, setNewUpdate] = useState('');
  const [showTestimony, setShowTestimony] = useState(false);
  const [testimony, setTestimony] = useState('');

  const { categories, markAnswered, markActive, markPending, addUpdate, deletePrayer } = usePrayerStore();
  const category = categories.find((c) => c.id === prayer.categoryId);

  const statusConfig = {
    active: { label: 'Actif', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    answered: { label: 'Exaucé', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    pending: { label: 'En attente', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
  };

  const st = statusConfig[prayer.status] || statusConfig.active;

  const handleAddUpdate = () => {
    if (!newUpdate.trim()) return;
    addUpdate(prayer.id, newUpdate.trim());
    setNewUpdate('');
  };

  const handleMarkAnswered = () => {
    if (showTestimony) {
      markAnswered(prayer.id, testimony);
      setShowTestimony(false);
      setTestimony('');
    } else {
      setShowTestimony(true);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 mb-3 overflow-hidden transition-all ${
      prayer.status === 'answered' ? 'border-green-400' :
      prayer.status === 'pending' ? 'border-slate-300' :
      'border-indigo-400'
    }`}>
      {/* Main row */}
      <div className="p-3">
        <div className="flex items-start gap-2">
          {/* Category emoji */}
          <span className="text-xl mt-0.5">{category?.emoji || '🙏'}</span>

          <div className="flex-1 min-w-0">
            {/* Title + status */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-semibold text-slate-800 text-sm leading-tight ${prayer.status === 'answered' ? 'line-through text-slate-400' : ''}`}>
                {prayer.title}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text}`}>
                {st.label}
              </span>
            </div>

            {/* Person for */}
            {prayer.forOther && prayer.personName && (
              <p className="text-xs text-indigo-500 mt-0.5">Pour: {prayer.personName}</p>
            )}

            {/* Category */}
            {category && (
              <span className="text-xs text-slate-400">{category.name}</span>
            )}
          </div>

          {/* Expand toggle */}
          <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-slate-600 ml-1">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Description preview */}
        {!expanded && prayer.description && (
          <p className="text-xs text-slate-500 mt-1 ml-8 line-clamp-1">{prayer.description}</p>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-100 px-3 pb-3 pt-2">
          {/* Description */}
          {prayer.description && (
            <p className="text-sm text-slate-600 mb-2">{prayer.description}</p>
          )}

          {/* Testimony (if answered) */}
          {prayer.status === 'answered' && prayer.testimony && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
              <p className="text-xs font-semibold text-green-700 mb-0.5">🎉 Témoignage</p>
              <p className="text-xs text-green-600">{prayer.testimony}</p>
            </div>
          )}

          {/* Date */}
          <p className="text-xs text-slate-400 mb-2">
            Ajouté le {format(new Date(prayer.createdAt), 'd MMMM yyyy', { locale: fr })}
            {prayer.answeredAt && ` · Exaucé le ${format(new Date(prayer.answeredAt), 'd MMMM yyyy', { locale: fr })}`}
          </p>

          {/* Updates */}
          {(prayer.updates || []).length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-slate-500 mb-1">Évolutions:</p>
              {prayer.updates.map((u) => (
                <div key={u.id} className="flex gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-600">{u.text}</p>
                    <p className="text-xs text-slate-400">{format(new Date(u.date), 'd MMM yyyy', { locale: fr })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add update */}
          {prayer.status !== 'answered' && (
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                placeholder="Ajouter une évolution..."
                className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                onKeyDown={(e) => e.key === 'Enter' && handleAddUpdate()}
              />
              <button
                onClick={handleAddUpdate}
                className="bg-indigo-100 text-indigo-700 rounded-lg px-2 py-1.5 hover:bg-indigo-200 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          )}

          {/* Testimony input */}
          {showTestimony && (
            <div className="mb-2">
              <textarea
                value={testimony}
                onChange={(e) => setTestimony(e.target.value)}
                placeholder="Comment Dieu a-t-il exaucé cette prière? (facultatif)"
                className="w-full text-xs border border-green-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400 resize-none"
                rows={2}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-1.5 flex-wrap">
            {prayer.status !== 'answered' && (
              <button
                onClick={handleMarkAnswered}
                className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg hover:bg-green-200 transition-colors font-medium"
              >
                <CheckCircle size={12} />
                {showTestimony ? 'Confirmer' : 'Exaucé! 🎉'}
              </button>
            )}
            {prayer.status === 'active' && (
              <button
                onClick={() => markPending(prayer.id)}
                className="flex items-center gap-1 text-xs bg-slate-100 text-slate-500 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Clock size={12} />
                En attente
              </button>
            )}
            {prayer.status !== 'active' && (
              <button
                onClick={() => markActive(prayer.id)}
                className="flex items-center gap-1 text-xs bg-blue-100 text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Remettre en prière
              </button>
            )}
            <button
              onClick={() => onEdit(prayer)}
              className="flex items-center gap-1 text-xs bg-slate-100 text-slate-500 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition-colors ml-auto"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={() => deletePrayer(prayer.id)}
              className="flex items-center gap-1 text-xs bg-red-50 text-red-400 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
