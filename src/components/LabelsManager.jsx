import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { CATEGORY_COLORS, categoryTint } from '../lib/categoryColor';
import { confirm } from '../store/confirmStore';

const EMOJIS = ['🙏', '✝️', '⛪', '👨‍👩‍👧‍👦', '💼', '🌍', '❤️', '🏥', '📖', '🕊️'];

const emptyDraft = () => ({ name: '', emoji: '🙏', color: CATEGORY_COLORS[0] });

// Label administration belongs beside the Journal filters that use labels.
// This is deliberately an inline editor rather than a new top-level route.
export default function LabelsManager({ lang, tr, onDone }) {
  const categories = usePrayerStore((state) => state.categories);
  const addCategory = usePrayerStore((state) => state.addCategory);
  const updateCategory = usePrayerStore((state) => state.updateCategory);
  const deleteCategory = usePrayerStore((state) => state.deleteCategory);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [formOpen, setFormOpen] = useState(categories.length === 0);

  const reset = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setFormOpen(false);
  };

  const edit = (category) => {
    setEditingId(category.id);
    setDraft({ name: category.name, emoji: category.emoji, color: category.color });
    setFormOpen(true);
  };

  const save = () => {
    if (!draft.name.trim()) return;
    if (editingId) updateCategory(editingId, { ...draft, name: draft.name.trim() });
    else addCategory({ ...draft, name: draft.name.trim() });
    reset();
  };

  const remove = (category) => {
    confirm({
      title: t(lang, 'deleteCategoryConfirm'),
      message: `${category.emoji} ${tr(category.name, lang)} — ${t(lang, 'deleteWarning')}`,
      confirmLabel: t(lang, 'delete'),
      cancelLabel: t(lang, 'cancel'),
      danger: true,
      onConfirm: () => deleteCategory(category.id),
    });
  };

  return (
    <section aria-labelledby="labels-manager-title">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id="labels-manager-title" className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>
            {t(lang, 'labelsTitle')}
          </h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'labelsSub')}</p>
        </div>
        {onDone && (
          <button type="button" onClick={onDone} aria-label={t(lang, 'close')} className="phase-icon-button shrink-0">
            <X size={17} aria-hidden="true" />
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full py-1 ps-3 pe-1"
              style={{ background: categoryTint(category.color, 16), border: `1px solid ${category.color}` }}
            >
              <span aria-hidden="true">{category.emoji}</span>
              <span className="max-w-40 truncate text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                {tr(category.name, lang)}
              </span>
              <button type="button" onClick={() => edit(category)} aria-label={`${t(lang, 'editLabel')} ${tr(category.name, lang)}`} className="flex h-9 w-9 items-center justify-center rounded-full">
                <Pencil size={13} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => remove(category)} aria-label={`${t(lang, 'delete')} ${tr(category.name, lang)}`} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ color: 'var(--danger)' }}>
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!formOpen ? (
        <button
          type="button"
          onClick={() => { setDraft(emptyDraft()); setEditingId(null); setFormOpen(true); }}
          className="quiet-button inline-flex min-h-11 items-center justify-center gap-2 px-4"
        >
          <Plus size={15} aria-hidden="true" /> {t(lang, 'addLabel')}
        </button>
      ) : (
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface-soft)', border: '0.5px solid var(--border)' }}>
          <label className="grid gap-1.5 text-xs font-medium" style={{ color: 'var(--text-2)' }}>
            {t(lang, editingId ? 'editLabel' : 'newLabel')}
            <input
              autoFocus
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder={t(lang, 'labelNamePlaceholder')}
              className="min-h-11 w-full rounded-xl px-3 text-sm focus:outline-none"
              style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2" aria-label={t(lang, 'emojiLabel')}>
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setDraft((current) => ({ ...current, emoji }))}
                aria-pressed={draft.emoji === emoji}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-lg"
                style={{ background: 'var(--input-bg)', outline: draft.emoji === emoji ? '2px solid var(--accent)' : 'none' }}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3" aria-label={t(lang, 'colorLabel')}>
            {CATEGORY_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setDraft((current) => ({ ...current, color }))}
                aria-label={color}
                aria-pressed={draft.color === color}
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: color }}
              >
                {draft.color === color && <Check size={15} color="#fff" aria-hidden="true" />}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={reset} className="quiet-button flex-1 px-4">{t(lang, 'cancel')}</button>
            <button type="button" onClick={save} disabled={!draft.name.trim()} className="primary-button flex-1 px-4 disabled:opacity-50">
              {t(lang, 'saveBtn')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
