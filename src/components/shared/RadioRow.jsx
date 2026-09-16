// One answer in a group of answers, as a card-sized row.
//
// A real radio: the native input carries focus, arrow keys, Space and the group
// semantics; the ring beside it only mirrors state, and states it with a filled
// dot as well as colour so it doesn't rely on hue alone.
//
// Shared by the full scheduler (ScheduleEditor) and the pace control on a
// guided plan's own card (PlanPaceRow), so the two read as the same question
// asked twice rather than as two different controls.
export default function RadioRow({ id, name, checked, onChange, label, sub, disabled = false }) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 w-full min-h-[44px] rounded-xl px-3 py-2.5 ${disabled ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
      style={checked
        ? { background: 'var(--accent-soft)', border: '1.5px solid var(--accent)' }
        : { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}
    >
      <span className="relative w-5 h-5 shrink-0 mt-0.5 flex items-center justify-center">
        <input
          id={id}
          type="radio"
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default"
        />
        <span
          aria-hidden="true"
          className="w-5 h-5 rounded-full flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2"
          style={{ background: 'var(--surface)', border: checked ? '1.5px solid var(--accent)' : '0.5px solid var(--input-border)' }}
        >
          {checked && <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} />}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium break-words" style={{ color: 'var(--text-1)' }}>{label}</span>
        {sub && <span className="block text-xs mt-0.5 break-words" style={{ color: 'var(--text-3)' }}>{sub}</span>}
      </span>
    </label>
  );
}
