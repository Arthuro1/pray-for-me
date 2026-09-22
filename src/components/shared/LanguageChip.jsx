import { Check } from 'lucide-react';

// One resource-language toggle, shared by Settings and the "Go deeper" shelf so
// the same choice looks the same wherever it is made. `gain` is how many works
// ticking it would add to the shelf in front of the reader; it is only shown on
// an unticked language, where it answers "what would this change?".
export default function LanguageChip({ label, on, onToggle, gain = 0, ariaLabel }) {
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
        ? { background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
        : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
    >
      {on && <Check size={12} aria-hidden="true" />}
      {label}
      {!on && gain > 0 && (
        <span
          aria-hidden="true"
          className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          +{gain}
        </span>
      )}
    </button>
  );
}
