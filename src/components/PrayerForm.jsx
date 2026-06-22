import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import { t } from '../i18n';

export default function PrayerForm({ onClose, editPrayer }) {
  const { categories, addPrayer, updatePrayer, settings } = usePrayerStore();
  const { tr } = useTranslationStore();
  const lang = settings.language || 'fr';

  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryIds: [],
    forOther: false,
    personName: '',
    phone: '',
  });

  useEffect(() => {
    if (editPrayer) {
      setForm({
        title: editPrayer.title || '',
        description: editPrayer.description || '',
        categoryIds: (editPrayer.prayer_categories || []).map((pc) => pc.category_id),
        forOther: editPrayer.for_other || false,
        personName: editPrayer.person_name || '',
        phone: editPrayer.phone || '',
      });
    }
  }, [editPrayer]);

  const toggleCategory = (id) => {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter((c) => c !== id)
        : [...f.categoryIds, id],
    }));
  };

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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6" style={{ background: 'rgba(26,10,46,0.6)' }} onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto rounded-t-3xl md:rounded-3xl max-h-[92vh] overflow-y-auto md:shadow-2xl"
        style={{ background: 'var(--surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        {/* Title bar */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text-1)' }}>
            {editPrayer ? t(lang, 'editPrayer') : t(lang, 'newPrayer')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-8 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'prayerSubject')}
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={t(lang, 'prayerSubjectPlaceholder')}
              className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none"
              style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'details')}
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t(lang, 'detailsPlaceholder')}
              className="w-full text-sm rounded-xl px-4 py-3 resize-none focus:outline-none"
              style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
              rows={3}
            />
          </div>

          {/* Categories */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'categories')} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#c5bdd4' }}>{t(lang, 'multipleAllowed')}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const selected = form.categoryIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={
                      selected
                        ? { backgroundColor: c.color, color: '#fff', border: `1.5px solid ${c.color}` }
                        : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }
                    }
                  >
                    {c.emoji} {tr(c.name, lang)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* For other */}
          <div>
            <button
              type="button"
              onClick={() => setForm({ ...form, forOther: !form.forOther })}
              className="flex items-center gap-2.5 w-full text-left"
            >
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                style={{ background: form.forOther ? 'var(--accent)' : 'var(--input-bg)', border: form.forOther ? 'none' : '0.5px solid var(--input-border)' }}
              >
                {form.forOther && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>{t(lang, 'forOther')}</span>
            </button>
          </div>

          {form.forOther && (
            <div className="space-y-3 pl-3" style={{ borderLeft: '2px solid var(--accent-border)' }}>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t(lang, 'personName')}</label>
                <input
                  type="text"
                  value={form.personName}
                  onChange={(e) => setForm({ ...form, personName: e.target.value })}
                  placeholder="Prénom Nom"
                  className="w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none"
                  style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t(lang, 'phone')}</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+237 6xx xxx xxx"
                  className="w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none"
                  style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl py-3 text-sm font-medium"
              style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-2)' }}
            >
              {t(lang, 'cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl py-3 text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)' }}
            >
              {editPrayer ? t(lang, 'save') : t(lang, 'add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
