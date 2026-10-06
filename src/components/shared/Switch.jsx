// Accessible on/off switch used across Settings and group preferences.
// Real switch semantics — role="switch" + aria-checked + an accessible name —
// with keyboard activation for free (native <button>), a visible focus ring,
// and a ≥44px hit area extended by padding + negative margin so the visual
// track stays compact. State is conveyed by aria-checked and knob position
// with distinct track colours — never colour alone. The knob travels toward
// the end of the line, so it moves the other way in right-to-left languages.
export default function Switch({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="q-switch"
    >
      <span aria-hidden="true" className="q-switch__track">
        <span className="q-switch__knob" />
      </span>
    </button>
  );
}
