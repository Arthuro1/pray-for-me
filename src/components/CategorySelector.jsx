import { t } from '../i18n';

// Toggle-style category picker: every category is a chip, the selected ones
// filled with their own colour, tap to add or remove. Shared by the new-prayer
// form and the prayer detail page so categories are chosen the same way in both.
export default function CategorySelector({ categories, selectedIds, onToggle, tr, lang }) {
  if (categories.length === 0) return null;
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-3)' }}>
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
