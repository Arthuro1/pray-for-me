import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { t } from '../../i18n';
import RiseMark from './RiseMark';

// "Carry this prayer" — the one Qetoret gesture of intercession. Pressing it
// takes a request into one's own life of prayer; the Rise Mark lifts once, as
// incense rises, and the button settles on "Carrying". Never a heart, never a
// like, never a burst. `aria-pressed` carries the state for assistive tech,
// and the label says it in words, so nothing depends on seeing the motion.
// variant: 'primary' (a prayer's own page) or 'quiet' (a row in a list).
export default function CarryButton({ carrying, busy = false, onToggle, lang, variant = 'primary', className = '', ...props }) {
  // The lift plays only when the reader starts carrying — not on load, and not
  // when they lay the prayer down again.
  const [lifted, setLifted] = useState(0);

  const press = () => {
    if (busy) return;
    if (!carrying) setLifted((n) => n + 1);
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={press}
      disabled={busy}
      aria-pressed={!!carrying}
      className={`carry-button carry-button--${variant} pressable ${carrying ? 'carry-button--carrying' : ''} ${className}`}
      {...props}
    >
      <span className="carry-button__mark" aria-hidden="true">
        {busy ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            <RiseMark motion="still" size={18} />
            {lifted > 0 && <RiseMark key={lifted} motion="still" size={18} className="carry-button__lift" />}
          </>
        )}
      </span>
      <span>{t(lang, carrying ? 'carryingLabel' : 'carryThisPrayer')}</span>
    </button>
  );
}
