import { useState } from 'react';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import { Plus, Trash2, X, Check } from 'lucide-react';
import { t } from '../i18n';
const EMOJIS = ['🙏', '✝️', '⛪', '👨‍👩‍👧‍👦', '💼', '🌍', '❤️', '🏥', '📖', '🕊️', '⚡', '🌟', '💰', '🎓', '👶'];
const COLORS = ['#7c5cfc', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777', '#ea580c', '#16a34a', '#2d1b5e'];

export default function PlanTab() {
  const { categories, addCategory, updateCategory, deleteCategory, settings } = usePrayerStore();
  const { tr } = useTranslationStore();
  const lang = settings.language || 'fr';
  const DAYS = t(lang, 'days');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', emoji: '🙏', color: '#7c5cfc', weekDays: [] });

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
    setForm({ name: '', emoji: '🙏', color: '#7c5cfc', weekDays: [] });
    setShowAddForm(false);
  };

  const startEdit = (cat) => {
    setForm({ name: cat.name, emoji: cat.emoji, color: cat.color, weekDays: cat.week_days || [] });
    setEditId(cat.id);
    setShowAddForm(true);
  };

  return (
    <div>
      {/* Header */}
      <div
        className="px-4 md:px-8 pt-8 pb-5"
        style={{ background: 'var(--header)' }}
      >
        <h2 className="text-xl font-semibold mb-1 text-white">{t(lang, 'weeklyPlan')}</h2>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{t(lang, 'weeklyPlanSub')}</p>

        {/* Weekly overview */}
        <div className="mt-4 grid grid-cols-7 gap-1">
          {DAYS.map((day, idx) => {
            const dayCats = categories.filter((c) => (c.week_days || []).includes(idx));
            return (
              <div key={idx} className="text-center">
                <p className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{day}</p>
                <div className="space-y-0.5">
                  {dayCats.length === 0 ? (
                    <div className="h-6 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  ) : (
                    dayCats.map((c) => (
                      <div
                        key={c.id}
                        className="h-6 rounded-lg flex items-center justify-center text-xs"
                        style={{ backgroundColor: c.color }}
                      >
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

      <div className="px-4 md:px-8 pt-4">
        {/* Add button */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>Catégories</h3>
          <button
            onClick={() => { setShowAddForm(true); setEditId(null); setForm({ name: '', emoji: '🙏', color: '#7c5cfc', weekDays: [] }); }}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium"
            style={{ background: '#7c5cfc', color: '#fff' }}
          >
            <Plus size={13} /> {t(lang, 'addCategory')}
          </button>
        </div>

        {/* Add/Edit form */}
        {showAddForm && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{editId ? 'Modifier' : 'Nouvelle catégorie'}</h4>
              <button onClick={() => setShowAddForm(false)} style={{ color: '#b0a4c0' }}><X size={16} /></button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nom de la catégorie"
                className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none"
                style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                autoFocus
              />

              <div>
                <p className="text-xs mb-2" style={{ color: '#9b8cb0' }}>Emoji</p>
                <div className="flex gap-1.5 flex-wrap">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setForm({ ...form, emoji: e })}
                      className="text-lg p-1.5 rounded-lg transition-colors"
                      style={form.emoji === e ? { background: '#f3eff9', outline: '2px solid #7c5cfc' } : { background: '#f7f4ef' }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs mb-2" style={{ color: '#9b8cb0' }}>Couleur</p>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: c, outline: form.color === c ? '2px solid #1a0f2e' : 'none', outlineOffset: '2px' }}
                    >
                      {form.color === c && <Check size={12} color="#fff" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs mb-2" style={{ color: '#9b8cb0' }}>Jours de prière</p>
                <div className="flex gap-1">
                  {DAYS.map((day, idx) => {
                    const active = (form.weekDays || []).includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          const days = form.weekDays || [];
                          setForm({ ...form, weekDays: days.includes(idx) ? days.filter((d) => d !== idx) : [...days, idx] });
                        }}
                        className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors"
                        style={active ? { backgroundColor: form.color, color: '#fff' } : { background: '#f3eff9', color: '#9b8cb0' }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleAdd}
                className="w-full text-white rounded-xl py-2.5 text-sm font-semibold"
                style={{ background: '#7c5cfc' }}
              >
                {editId ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        )}

        {/* Category list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: cat.color + '22' }}
                >
                  {cat.emoji}
                </div>
                <span className="text-sm font-semibold" style={{ color: cat.color }}>{tr(cat.name, lang)}</span>
                <div className="ml-auto flex gap-1">
                  <button
                    onClick={() => startEdit(cat)}
                    className="text-xs px-2.5 py-1 rounded-lg"
                    style={{ background: '#f3eff9', color: '#7c5cfc' }}
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="p-1.5 rounded-lg"
                    style={{ background: '#fdf0f0', color: '#c04040' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="flex gap-1">
                {DAYS.map((day, idx) => {
                  const active = (cat.week_days || []).includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleDay(idx, cat.id)}
                      className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors"
                      style={active ? { backgroundColor: cat.color, color: '#fff' } : { background: '#f3eff9', color: '#b0a4c0' }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
