// Accessible on/off switch used across Settings and group preferences.
// Real switch semantics — role="switch" + aria-checked + an accessible name —
// with keyboard activation for free (native <button>), a visible focus ring,
// and a ≥44px hit area extended by padding + negative margin so the visual
// track stays compact. State is conveyed by aria-checked and knob position
// with distinct track colours — never colour alone.
export default function Switch({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="p-3 -m-3 min-w-[44px] min-h-[44px] inline-flex items-center justify-center shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40"
      style={{ outlineColor: 'var(--accent)' }}
    >
      <span
        aria-hidden="true"
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
        style={{ background: checked ? 'var(--accent)' : 'var(--input-border)' }}
      >
        <span
          className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? 'translateX(24px)' : 'translateX(4px)' }}
        />
      </span>
    </button>
  );
}
