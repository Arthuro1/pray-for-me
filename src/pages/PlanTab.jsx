import { useState } from 'react';
import usePrayerStore from '../store/prayerStore';
import { Plus, Trash2, X, Check } from 'lucide-react';

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAYS_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const EMOJIS = ['🙏', '✝️', '⛪', '👨‍👩‍👧‍👦', '💼', '🌍', '❤️', '🏥', '📖', '🕊️', '⚡', '🌟', '💰', '🎓', '👶'];

const COLORS = ['#4f46e5', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#db2777', '#ea580c', '#16a34a'];

export default function PlanTab() {
  const { categories, addCategory, updateCategory, deleteCategory } = usePrayerStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', emoji: '🙏', color: '#4f46e5', weekDays: [] });

  const toggleDay = (day, catId) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    const days = cat.week_days || [];
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    updateCategory(catId, { weekDays: next });
  };

  const handleAdd = () => {
    if (!form.name.trim()) return;
    if (editId) {
      updateCategory(editId, form);
      setEditId(null);
    } else {
      addCategory(form);
    }
    setForm({ name: '', emoji: '🙏', color: '#4f46e5', weekDays: [] });
    setShowAddForm(false);
  };

  const startEdit = (cat) => {
    setForm({ name: cat.name, emoji: cat.emoji, color: cat.color, weekDays: cat.week_days || [] });
    setEditId(cat.id);
    setShowAddForm(true);
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="font-bold text-slate-800 text-lg">Plan de prière hebdomadaire</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Assignez chaque catégorie à un ou plusieurs jours de la semaine
        </p>
      </div>

      {/* Day overview */}
      <div className="bg-white rounded-2xl shadow-sm p-3 mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Vue par jour</p>
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((day, idx) => {
            const dayCats = categories.filter((c) => (c.week_days || []).includes(idx));
            return (
              <div key={idx} className="text-center">
                <p className="text-xs font-bold text-slate-500 mb-1">{day}</p>
                <div className="space-y-0.5">
                  {dayCats.length === 0 ? (
                    <div className="h-5 rounded bg-slate-100" />
                  ) : (
                    dayCats.map((c) => (
                      <div key={c.id} className="h-5 rounded text-white text-xs flex items-center justify-center" style={{ backgroundColor: c.color }}>
                        {c.emoji}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-700">Catégories</h3>
        <button
          onClick={() => { setShowAddForm(true); setEditId(null); setForm({ name: '', emoji: '🙏', color: '#4f46e5', weekDays: [] }); }}
          className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={12} /> Ajouter
        </button>
      </div>

      {/* Add/Edit form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-700 text-sm">{editId ? 'Modifier' : 'Nouvelle catégorie'}</h4>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400"><X size={16} /></button>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nom de la catégorie"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              autoFocus
            />

            {/* Emoji picker */}
            <div>
              <p className="text-xs text-slate-500 mb-1">Emoji</p>
              <div className="flex gap-2 flex-wrap">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setForm({ ...form, emoji: e })}
                    className={`text-lg p-1 rounded-lg ${form.emoji === e ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'hover:bg-slate-100'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <p className="text-xs text-slate-500 mb-1">Couleur</p>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: c }}
                  >
                    {form.color === c && <Check size={12} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Days */}
            <div>
              <p className="text-xs text-slate-500 mb-1">Jours de prière</p>
              <div className="flex gap-1">
                {DAYS.map((day, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const days = form.weekDays || [];
                      setForm({ ...form, weekDays: days.includes(idx) ? days.filter((d) => d !== idx) : [...days, idx] });
                    }}
                    className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                      (form.weekDays || []).includes(idx)
                        ? 'text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                    style={(form.weekDays || []).includes(idx) ? { backgroundColor: form.color } : {}}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              {editId ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Category list with day assignment */}
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl shadow-sm p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{cat.emoji}</span>
              <span
                className="text-sm font-semibold"
                style={{ color: cat.color }}
              >
                {cat.name}
              </span>
              <div className="ml-auto flex gap-1">
                <button
                  onClick={() => startEdit(cat)}
                  className="text-xs text-slate-400 hover:text-indigo-600 px-2 py-1 rounded"
                >
                  Modifier
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Day toggles */}
            <div className="flex gap-1">
              {DAYS.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleDay(idx, cat.id)}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                    (cat.week_days || []).includes(idx)
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                  style={(cat.week_days || []).includes(idx) ? { backgroundColor: cat.color } : {}}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
