import { t } from '../i18n';
import { CIRCLES, circleDescKey, circleLabelKey } from '../lib/circles';
import { CircleOption } from './shared/Primitives';

// "Place on your altar": an OPTIONAL choice of one Intercession Circle. Nothing
// is preselected and nothing is required — pressing the chosen circle again
// returns the prayer to "Your prayers". The circles are listed inner to outer
// because that is the shape of intercession, not a ranking: each one's glyph
// simply reaches a little further than the last.
export default function CirclePicker({ value, onChange, lang, idPrefix = 'circle' }) {
  const legendId = `${idPrefix}-legend`;
  const hintId = `${idPrefix}-hint`;
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
              onSelect={() => onChange(selected ? null : circle)}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
