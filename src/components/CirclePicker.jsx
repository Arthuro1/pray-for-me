import { t } from '../i18n';
import { CIRCLES, circleLabelKey } from '../lib/circles';
import { CIRCLE_ICONS } from './shared/circleIcons';

// "Place on your altar": an OPTIONAL choice of one Intercession Circle. Nothing
// is preselected and nothing is required — pressing the chosen circle again
// returns the prayer to "Your prayers". The circles are listed inner to outer
// because that is the shape of intercession, not a ranking.
export default function CirclePicker({ value, onChange, lang, idPrefix = 'circle' }) {
  const legendId = `${idPrefix}-legend`;
  return (
    <fieldset aria-labelledby={legendId}>
      <legend id={legendId} className="mb-1 block text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--q-text-tertiary)' }}>
        {t(lang, 'placeOnAltarLabel')}
      </legend>
      <p className="mb-2.5 text-xs" style={{ color: 'var(--q-text-tertiary)' }}>{t(lang, 'placeOnAltarHint')}</p>
      <div className="flex flex-wrap gap-2">
        {CIRCLES.map((circle) => {
          const Icon = CIRCLE_ICONS[circle];
          const selected = value === circle;
          return (
            <button
              key={circle}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : circle)}
              className="pressable inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 text-sm font-medium focus-visible:ring-2"
              style={selected
                ? { background: 'var(--q-action-primary)', color: 'var(--q-on-action)', border: '1px solid var(--q-royal)' }
                : { background: 'var(--q-surface)', color: 'var(--q-text-secondary)', border: '1px solid var(--q-field-border)' }}
            >
              <Icon size={15} aria-hidden="true" />
              {t(lang, circleLabelKey(circle))}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
