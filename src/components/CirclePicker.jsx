import { t } from '../i18n';
import { CIRCLES, circleDescKey, circleLabelKey } from '../lib/circles';
import { CircleOption } from './shared/Primitives';
import CircleGlyph from './shared/CircleGlyph';

// "Where are you carrying this?": an OPTIONAL choice of one Intercession Circle.
// Nothing is required, and pressing the chosen circle again returns the prayer
// to "Your prayers". The circles are listed inner to outer because that is the
// shape of intercession, not a ranking: each one's glyph simply reaches a
// little further than the last.
//
// Two forms. `compact` is the quiet row under the prayer's own words in the
// composer — the prayer comes first, the circle second, and it never grows into
// a form. The full form (each circle with what it holds) is for a deliberate
// choice, such as changing a saved prayer's circle.
export default function CirclePicker({ value, onChange, lang, idPrefix = 'circle', compact = false }) {
  const legendId = `${idPrefix}-legend`;
  const hintId = `${idPrefix}-hint`;
  const toggle = (circle) => onChange(value === circle ? null : circle);

  if (compact) {
    return (
      <fieldset className="circle-picker circle-picker--compact" aria-labelledby={legendId} aria-describedby={hintId}>
        <legend id={legendId} className="q-field__label">{t(lang, 'circleQuestion')}</legend>
        <p id={hintId} className="q-field__hint circle-picker__hint">{t(lang, 'circleQuestionHint')}</p>
        <div className="q-chips">
          {CIRCLES.map((circle) => {
            const selected = value === circle;
            return (
              <button
                key={circle}
                type="button"
                aria-pressed={selected}
                onClick={() => toggle(circle)}
                className="q-chip circle-chip pressable"
              >
                <CircleGlyph circle={circle} size={16} selected={selected} />
                <span>{t(lang, circleLabelKey(circle))}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  return (
    <fieldset className="circle-picker" aria-labelledby={legendId} aria-describedby={hintId}>
      <legend id={legendId} className="q-field__label">{t(lang, 'placeOnAltarLabel')}</legend>
      <p id={hintId} className="q-field__hint circle-picker__hint">{t(lang, 'placeOnAltarHint')}</p>
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
