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
      className="w-full min-h-[44px] flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-start"
      style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm" style={{ color: 'var(--text-1)' }}>{label}</span>
        {value && <span className="block text-xs mt-0.5 break-words" style={{ color: 'var(--text-3)' }}>{value}</span>}
      </span>
      <span className="shrink-0 flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent)' }}>
        {action}
        <ChevronDown size={14} aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </span>
    </button>
  );
});

export default DisclosureRow;
