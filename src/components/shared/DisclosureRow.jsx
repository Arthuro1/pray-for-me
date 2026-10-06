import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

// A calm, full-width disclosure row: what it is on the left, its CURRENT VALUE
// underneath, and the section it controls revealed below. Scheduling uses it
// for every part most people never change (preferred time, uncommon rhythms,
// when the rhythm stops) — folded away, but never hiding a value the user
// already has, because the value reads without expanding anything.
// Forwards a ref so a host can hand focus back to the row after closing what
// it opened.
const DisclosureRow = forwardRef(function DisclosureRow({ label, value, action, open, onToggle, controlsId }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controlsId}
      className="disclosure-row"
    >
      <span className="min-w-0 flex-1">
        <span className="disclosure-row__label">{label}</span>
        {value && <span className="disclosure-row__value">{value}</span>}
      </span>
      <span className="disclosure-row__action">
        {action}
        <ChevronDown size={14} aria-hidden="true" />
      </span>
    </button>
  );
});

export default DisclosureRow;
