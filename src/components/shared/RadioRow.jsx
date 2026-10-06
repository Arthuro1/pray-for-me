// One answer in a group of answers, drawn as the shared choice row.
//
// A real radio: the native input carries focus, arrow keys, Space and the group
// semantics; the ring beside it only mirrors state, and states it with a gold
// centre as well as colour so it doesn't rely on hue alone.
//
// One row of the scheduler (ScheduleEditor), which a guided plan's own card
// opens too - so the rhythm is one question, asked in one vocabulary, wherever
// the reader answers it.
export default function RadioRow({ id, name, checked, onChange, label, sub, disabled = false }) {
  return (
    <label htmlFor={id} className={`circle-option ${sub ? '' : 'circle-option--compact'}`}>
      <span className="circle-option__control">
        <input id={id} type="radio" name={name} checked={checked} disabled={disabled} onChange={onChange} />
        <span className="circle-option__ring" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="circle-option__title break-words">{label}</span>
        {sub && <span className="circle-option__description break-words">{sub}</span>}
      </span>
    </label>
  );
}
