import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';

const INPUT_STYLE = { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' };
const LABEL_CLASS = 'text-xs font-semibold uppercase tracking-widest mb-1.5 block';

function CheckboxToggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <div
        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
        style={{ background: checked ? 'var(--accent)' : 'var(--input-bg)', border: checked ? 'none' : '0.5px solid var(--input-border)' }}
        onClick={onChange}
      >
        {checked && <span className="text-white text-xs font-bold">✓</span>}
      </div>
      <span className="text-sm" style={{ color: 'var(--text-2)' }}>{label}</span>
    </label>
  );
}

function CategorySelector({ categories, selectedIds, onToggle, tr, lang }) {
  if (categories.length === 0) return null;
  return (
    <div>
      <label className={LABEL_CLASS} style={{ color: 'var(--text-3)' }}>
        {t(lang, 'categories')}{' '}
        <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#c5bdd4' }}>
          {t(lang, 'multipleAllowed')}
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const selected = selectedIds.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={selected
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
  );
}

function initialForm(editPrayer) {
  if (!editPrayer) return { title: '', description: '', categoryIds: [], forOther: false, personName: '', phone: '', isAnonymous: false };
  return {
    title: editPrayer.title || '',
    description: editPrayer.description || '',
    categoryIds: editPrayer.category_ids || (editPrayer.prayer_categories || []).map(pc => pc.category_id),
    forOther: editPrayer.for_other || false,
    personName: editPrayer.person_name || '',
    phone: editPrayer.phone || '',
    isAnonymous: editPrayer.is_anonymous || false,
  };
}

// communityMode hides forOther/phone fields and calls onCommunitySubmit instead of prayerStore
export default function PrayerForm({ onClose, editPrayer, communityMode, onCommunitySubmit }) {
  const { categories, addPrayer, updatePrayer, settings } = usePrayerStore();
  const { tr } = useTranslationStore();
  const lang = settings.language || 'fr';
  useEscapeKey(onClose);
  const trapRef = useFocusTrap();

  const [form, setForm] = useState(() => initialForm(editPrayer));
  useEffect(() => { if (editPrayer) setForm(initialForm(editPrayer)); }, [editPrayer]);

  const patch = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const toggleCategory = (id) => patch('categoryIds', form.categoryIds.includes(id)
    ? form.categoryIds.filter(c => c !== id)
    : [...form.categoryIds, id]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (communityMode) {
      onCommunitySubmit({ title: form.title.trim(), description: form.description.trim(), isAnonymous: form.isAnonymous, categoryIds: form.categoryIds });
    } else if (editPrayer) {
      updatePrayer(editPrayer.id, form);
    } else {
      addPrayer(form);
    }
    onClose();
  };

  const title = communityMode
    ? (editPrayer ? t(lang, 'tipEditPrayer') : t(lang, 'newRequest'))
    : (editPrayer ? t(lang, 'editPrayer') : t(lang, 'newPrayer'));

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6" style={{ background: 'rgba(26,10,46,0.6)' }} onClick={onClose}>
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg mx-auto rounded-t-3xl md:rounded-3xl max-h-[92vh] overflow-y-auto md:shadow-2xl"
        style={{ background: 'var(--surface)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text-1)' }}>{title}</h2>
          <button onClick={onClose} title={t(lang, 'tipCloseForm')} className="p-1.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-8 space-y-4">
          <div>
            <label className={LABEL_CLASS} style={{ color: 'var(--text-3)' }}>{t(lang, 'prayerSubject')}</label>
            <input
              type="text"
              required
              autoFocus
              value={form.title}
              onChange={e => patch('title', e.target.value)}
              placeholder={t(lang, 'prayerSubjectPlaceholder')}
              className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none"
              style={INPUT_STYLE}
            />
          </div>

          <div>
            <label className={LABEL_CLASS} style={{ color: 'var(--text-3)' }}>{t(lang, 'details')}</label>
            <textarea
              value={form.description}
              onChange={e => patch('description', e.target.value)}
              placeholder={t(lang, 'detailsPlaceholder')}
              className="w-full text-sm rounded-xl px-4 py-3 resize-none focus:outline-none"
              style={INPUT_STYLE}
              rows={3}
            />
          </div>

          {communityMode && (
            <CheckboxToggle
              checked={form.isAnonymous}
              onChange={() => patch('isAnonymous', !form.isAnonymous)}
              label={t(lang, 'anonymous')}
            />
          )}

          <CategorySelector
            categories={categories}
            selectedIds={form.categoryIds}
            onToggle={toggleCategory}
            tr={tr}
            lang={lang}
          />

          {!communityMode && <>
            <CheckboxToggle
              checked={form.forOther}
              onChange={() => patch('forOther', !form.forOther)}
              label={t(lang, 'forOther')}
            />

            {form.forOther && (
              <div className="space-y-3 pl-3" style={{ borderLeft: '2px solid var(--accent-border)' }}>
                <div>
                  <label className={LABEL_CLASS} style={{ color: 'var(--text-3)' }}>{t(lang, 'personName')}</label>
                  <input type="text" value={form.personName} onChange={e => patch('personName', e.target.value)}
                    placeholder="Prénom Nom" className="w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none" style={INPUT_STYLE} />
                </div>
                <div>
                  <label className={LABEL_CLASS} style={{ color: 'var(--text-3)' }}>{t(lang, 'phone')}</label>
                  <input type="tel" value={form.phone} onChange={e => patch('phone', e.target.value)}
                    placeholder="+237 6xx xxx xxx" className="w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none" style={INPUT_STYLE} />
                </div>
              </div>
            )}
          </>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} title={t(lang, 'tipDiscard')}
              className="flex-1 rounded-xl py-3 text-sm font-medium"
              style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-2)' }}>
              {t(lang, 'cancel')}
            </button>
            <button type="submit" title={editPrayer ? t(lang, 'tipSavePrayer') : t(lang, 'tipAddPrayerForm')}
              className="flex-1 rounded-xl py-3 text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)' }}>
              {editPrayer ? t(lang, 'save') : t(lang, 'add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
