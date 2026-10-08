import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { t } from '../i18n';

// Toggle-style category chips for the prayer form's Categories row. The chosen
// ones come first, filled with their own colour — tap to take one off. The rest
// wait behind "+ Add" so a long list of labels never crowds the form; with
// nothing chosen yet there is nothing to hide them behind, so they all show.
export default function CategorySelector({ categories, selectedIds, onToggle, tr, lang, labelledBy }) {
  // Opened with nothing chosen, the whole list shows — and stays, so the first
  // choice doesn't fold the rest away under the finger.
  const [adding, setAdding] = useState(() => selectedIds.length === 0);
  if (categories.length === 0) return null;

  const chosen = categories.filter((c) => selectedIds.includes(c.id));
  const rest = categories.filter((c) => !selectedIds.includes(c.id));
  const showRest = adding || chosen.length === 0;

  const chip = (c, selected) => (
    <button
      key={c.id}
      type="button"
      aria-pressed={selected}
      onClick={() => onToggle(c.id)}
      className={`category-chip pressable ${selected ? 'category-chip--selected' : ''}`}
      style={selected ? { '--category-color': c.color } : undefined}
    >
      <span aria-hidden="true">{c.emoji}</span>
      <span>{tr(c.name, lang)}</span>
      {selected && <X size={13} aria-hidden="true" />}
    </button>
  );

  return (
    <div role="group" aria-labelledby={labelledBy} className="category-chips">
      {chosen.map((c) => chip(c, true))}
      {showRest
        ? rest.map((c) => chip(c, false))
        : rest.length > 0 && (
          <button type="button" onClick={() => setAdding(true)} className="category-chip category-chip--add pressable">
            <Plus size={13} aria-hidden="true" />
            <span>{t(lang, 'addCategoryFull')}</span>
          </button>
        )}
    </div>
  );
}
