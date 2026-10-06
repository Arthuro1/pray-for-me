import { Check } from 'lucide-react';

// One resource-language toggle, shared by Settings and the "Go deeper" shelf so
// the same choice looks the same wherever it is made. `count` is how many of the
// works on the shelf in front of the reader ticking it would show in that
// language; it is only drawn on an unticked language, where it answers "what
// would this change?".
export default function LanguageChip({ label, on, onToggle, count = 0, ariaLabel }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onToggle}
      className="pressable inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-medium"
      style={on
        ? { background: 'var(--q-selected)', color: 'var(--q-royal-text)', border: '1px solid var(--q-selected-border)' }
        : { background: 'var(--q-field)', color: 'var(--q-text-secondary)', border: '0.5px solid var(--q-field-border)' }}
    >
      {on && <Check size={12} aria-hidden="true" />}
      {label}
      {!on && count > 0 && (
        <span
          aria-hidden="true"
          className="inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
          style={{ background: 'var(--q-selected)', color: 'var(--q-royal-text)' }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
