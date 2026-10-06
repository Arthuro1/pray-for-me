import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { CATEGORY_COLORS, categoryTint } from '../lib/categoryColor';
import { confirm } from '../store/confirmStore';
import { Field, Input, PrimaryButton, SecondaryButton } from './shared/Primitives';

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
      <div className="q-dialog__header">
        <div className="min-w-0">
          <h2 id="labels-manager-title" className="q-dialog__title">{t(lang, 'labelsTitle')}</h2>
          <p className="q-meta mt-2">{t(lang, 'labelsSub')}</p>
        </div>
        {onDone && (
          <button type="button" onClick={onDone} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 -mt-2 shrink-0">
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <ul className="label-list">
          {categories.map((category) => (
            <li key={category.id} className="label-list__row">
              {/* The reader's own colour and emoji: their content, kept as chosen. */}
              <span className="label-chip" style={{ background: categoryTint(category.color, 16), borderColor: category.color }}>
                <span aria-hidden="true">{category.emoji}</span>
                <span className="label-chip__name">{tr(category.name, lang)}</span>
              </span>
              <span className="flex shrink-0">
                <button type="button" onClick={() => edit(category)} aria-label={`${t(lang, 'editLabel')} ${tr(category.name, lang)}`} className="icon-button pressable">
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => remove(category)} aria-label={`${t(lang, 'delete')} ${tr(category.name, lang)}`} className="icon-button icon-button--danger pressable">
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {!formOpen ? (
        <SecondaryButton icon={Plus} iconSize={16} onClick={() => { setDraft(emptyDraft()); setEditingId(null); setFormOpen(true); }}>
          {t(lang, 'addLabel')}
        </SecondaryButton>
      ) : (
        <div className="label-form">
          <Field label={t(lang, editingId ? 'editLabel' : 'newLabel')}>
            {(field) => (
              <Input
                autoFocus
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder={t(lang, 'labelNamePlaceholder')}
                {...field}
              />
            )}
          </Field>
          <div className="label-form__options" role="group" aria-label={t(lang, 'emojiLabel')}>
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setDraft((current) => ({ ...current, emoji }))}
                aria-pressed={draft.emoji === emoji}
                className="emoji-option pressable"
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="label-form__options" role="group" aria-label={t(lang, 'colorLabel')}>
            {CATEGORY_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setDraft((current) => ({ ...current, color }))}
                aria-label={color}
                aria-pressed={draft.color === color}
                className="color-swatch pressable"
                style={{ background: color }}
              >
                {draft.color === color && <Check size={16} strokeWidth={2.5} aria-hidden="true" />}
              </button>
            ))}
          </div>
          <div className="q-dialog__actions mt-0">
            <SecondaryButton onClick={reset}>{t(lang, 'cancel')}</SecondaryButton>
            <PrimaryButton onClick={save} disabled={!draft.name.trim()}>{t(lang, 'saveBtn')}</PrimaryButton>
          </div>
        </div>
      )}
    </section>
  );
}
