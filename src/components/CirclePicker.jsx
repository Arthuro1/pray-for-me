import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { t } from '../i18n';
import { CIRCLES, circleDescKey, circleLabelKey } from '../lib/circles';
import { CircleOption } from './shared/Primitives';
import CircleGlyph from './shared/CircleGlyph';

// An OPTIONAL choice of one Intercession Circle. Nothing is required, and
// pressing the chosen circle again takes the prayer back out of it. The circles
// are listed inner to outer because that is the shape of intercession, not a
// ranking: each one's glyph simply reaches a little further than the last.
//
// Two forms. `compact` is for the composer, where the prayer itself is the
// point: one quiet row ("Intercession circle · Not set") that opens in place
// onto the seven circles and folds again once one is chosen — organizing only
// when asked for, never a form inside the form. The full form (each circle with
// what it holds) is for a deliberate choice, such as changing a saved prayer's
// circle; `label`/`hint` let a caller ask its own question there (a carried
// request's circle is the carrier's alone).
export default function CirclePicker({ value, onChange, lang, idPrefix = 'circle', compact = false, defaultOpen = false, label, hint }) {
  if (compact) return <CircleRow value={value} onChange={onChange} lang={lang} idPrefix={idPrefix} defaultOpen={defaultOpen} />;

  const legendId = `${idPrefix}-legend`;
  const hintId = `${idPrefix}-hint`;
  const toggle = (circle) => onChange(value === circle ? null : circle);

  return (
    <fieldset className="circle-picker" aria-labelledby={legendId} aria-describedby={hint ? hintId : undefined}>
      <legend id={legendId} className="q-field__label">{label || t(lang, 'circleFieldLabel')}</legend>
      {hint && <p id={hintId} className="q-field__hint circle-picker__hint">{hint}</p>}
      <div className="circle-options">
        {CIRCLES.map((circle) => {
          const selected = value === circle;
          return (
            <CircleOption
              key={circle}
              toggle
              circle={circle}
              title={t(lang, circleLabelKey(circle))}
              description={t(lang, circleDescKey(circle))}
              selected={selected}
              onSelect={() => toggle(circle)}
            />
          );
        })}
      </div>
    </fieldset>
  );
}

// The composer's row. Choosing folds the circles away and hands focus back to
// the row, so a keyboard or screen-reader user is never left on a control that
// has just disappeared (the composer is a focus-trapped dialog). `defaultOpen`
// is for someone who came to organize this prayer on purpose.
function CircleRow({ value, onChange, lang, idPrefix, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const toggleRef = useRef(null);
  const labelId = `${idPrefix}-label`;
  const choicesId = `${idPrefix}-choices`;
  const choose = (circle) => {
    onChange(value === circle ? null : circle);
    setOpen(false);
    toggleRef.current?.focus();
  };

  return (
    <div className="circle-row">
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-expanded={open}
        aria-controls={choicesId}
        className="circle-row__toggle pressable"
      >
        <span id={labelId} className="circle-row__label">
          <CircleGlyph circle="nations" size={16} />
          {t(lang, 'circleFieldLabel')}
        </span>
        <span className={`circle-row__value ${value ? 'circle-row__value--set' : ''}`}>
          {value && <CircleGlyph circle={value} size={16} selected />}
          <span>{value ? t(lang, circleLabelKey(value)) : t(lang, 'circleNotSet')}</span>
          <ChevronDown size={16} aria-hidden="true" className="circle-row__chevron" />
        </span>
      </button>
      {open && (
        <CircleChips id={choicesId} labelledBy={labelId} value={value} onChoose={choose} lang={lang} className="circle-row__choices" />
      )}
    </div>
  );
}

// The seven circles as one wrapping row of toggle chips — shared by the circle
// row above and the prayer form's own details list. The host decides what a
// choice does next (fold away, hand focus back).
export function CircleChips({ id, labelledBy, value, onChoose, lang, className = '' }) {
  return (
    <div id={id} role="group" aria-labelledby={labelledBy} className={`q-chips ${className}`}>
      {CIRCLES.map((circle) => {
        const selected = value === circle;
        return (
          <button
            key={circle}
            type="button"
            aria-pressed={selected}
            onClick={() => onChoose(circle)}
            className="q-chip circle-chip pressable"
          >
            <CircleGlyph circle={circle} size={16} selected={selected} />
            <span>{t(lang, circleLabelKey(circle))}</span>
          </button>
        );
      })}
    </div>
  );
}
