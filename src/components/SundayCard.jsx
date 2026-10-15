import { useState } from 'react';
import { Church, X } from 'lucide-react';
import { t } from '../i18n';
import useChurchStore from '../store/churchStore';
import { dismissSundayMoment, isSundayMomentDismissed, sundayMoment, sundayMomentId, SUNDAY_MOMENTS } from '../lib/sundayRhythm';
import { SecondaryButton } from './shared/Primitives';
import ScriptureRefButton from './circles/ScriptureRefButton';

// The Lord's day on Today (lib/sundayRhythm.js): before worship, pray for your
// church by name; after, bring before God what you received. Both open the
// ordinary prayer form in the Church circle — the app points back to the
// gathered body, it never stands in for it.
export default function SundayCard({ lang, onPrayInCircle, now = new Date() }) {
  const church = useChurchStore((s) => s.anchor.church);
  const moment = sundayMoment(now);
  const id = sundayMomentId(now);
  const [dismissed, setDismissed] = useState(() => isSundayMomentDismissed(id));
  if (!moment || dismissed || !onPrayInCircle) return null;

  const preparing = moment === SUNDAY_MOMENTS.PREPARE;
  const title = t(lang, preparing ? 'sundayPrepTitle' : 'sundayReflectTitle');
  const body = preparing
    ? (church ? t(lang, 'sundayPrepBodyNamed', { church }) : t(lang, 'sundayPrepBody'))
    : t(lang, 'sundayReflectBody');

  const open = () => onPrayInCircle('church', {
    prompt: t(lang, preparing ? 'sundayPrepPrompt' : 'sundayReflectPrompt'),
  });

  const dismiss = () => {
    dismissSundayMoment(id);
    setDismissed(true);
  };

  return (
    <section className="today-sunday q-card" aria-labelledby="today-sunday-title">
      <div className="today-sunday__head">
        <span className="icon-tile tone-church" aria-hidden="true"><Church size={18} strokeWidth={1.8} /></span>
        <div className="min-w-0 flex-1">
          <p className="section-label section-label--sacred">{t(lang, 'sundayLabel')}</p>
          <h2 id="today-sunday-title" className="today-sunday__title">{title}</h2>
        </div>
        <button type="button" onClick={dismiss} aria-label={t(lang, 'sundayDismiss')} title={t(lang, 'sundayDismiss')} className="icon-button pressable">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <p className="today-sunday__body">{body}</p>
      <div className="today-sunday__foot">
        <SecondaryButton onClick={open}>{t(lang, preparing ? 'sundayPrepCta' : 'sundayReflectCta')}</SecondaryButton>
        <ScriptureRefButton reference={preparing ? 'Psalm 122:1' : 'Colossians 3:16'} lang={lang} />
      </div>
    </section>
  );
}
