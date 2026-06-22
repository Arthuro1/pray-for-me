import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';

export default function PrayerForm({ onClose, editPrayer }) {
  const { categories, addPrayer, updatePrayer } = usePrayerStore();

  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: categories[0]?.id || '',
    forOther: false,
    personName: '',
    phone: '',
  });

  useEffect(() => {
    if (editPrayer) {
      setForm({
        title: editPrayer.title || '',
        description: editPrayer.description || '',
        categoryId: editPrayer.category_id || '',
        forOther: editPrayer.for_other || false,
        personName: editPrayer.person_name || '',
        phone: editPrayer.phone || '',
      });
    }
  }, [editPrayer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editPrayer) {
      updatePrayer(editPrayer.id, form);
    } else {
      addPrayer(form);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg mx-auto rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-slate-800">
            {editPrayer ? 'Modifier la prière' : 'Nouvelle prière'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sujet de prière *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="ex: Guérison de ma mère..."
              className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Détails (facultatif)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Décrivez votre sujet de prière en détail..."
              className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Catégorie</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="">-- Sans catégorie --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="forOther"
              checked={form.forOther}
              onChange={(e) => setForm({ ...form, forOther: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label htmlFor="forOther" className="text-sm text-slate-700">C'est pour quelqu'un d'autre</label>
          </div>

          {form.forOther && (
            <div className="space-y-2 pl-2 border-l-2 border-indigo-200">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nom de la personne</label>
                <input
                  type="text"
                  value={form.personName}
                  onChange={(e) => setForm({ ...form, personName: e.target.value })}
                  placeholder="Prénom Nom"
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Téléphone (pour rappel d'appel)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+237 6xx xxx xxx"
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-500 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              {editPrayer ? 'Enregistrer' : 'Ajouter la prière 🙏'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
