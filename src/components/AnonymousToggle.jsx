import { t } from '../i18n';

// Shared "post anonymously" checkbox so every community composer (updates,
// testimonies) shows the same control instead of re-implementing it each time.
export default function AnonymousToggle({ checked, onChange, lang, className = '' }) {
  return (
    <label className={`flex items-center gap-2 text-xs cursor-pointer ${className}`} style={{ color: 'var(--text-3)' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded" />
      {t(lang, 'anonymous')}
    </label>
  );
}
