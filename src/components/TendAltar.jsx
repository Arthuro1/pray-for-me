import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { toast } from '../store/toastStore';
import { canReleaseFromRhythm, carriedSinceDate, lastPrayedDate, markTended } from '../lib/carried';
import { PrimaryButton } from './shared/Primitives';
import RiseMark from './shared/RiseMark';

// "Tend your altar" (Elijah repairing the altar, 1 Kings 18:30): a gentle review
// of prayers that have quietly rested a while, so a prayer list never becomes an
// abandoned archive. There is no wrong answer and no scolding — continuing,
// telling what changed, testifying and releasing are all faithful choices.
// Releasing is NOT failure and does NOT mean the prayer was answered: it only
// stops the prayer returning on its own; it stays in the Journal.
//
// Answers are remembered on this device only (ids and dates — see lib/carried.js).
export default function TendAltar({ prayers, completions, lang, tr, onRelease, onClose }) {
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState(prayers);
  const trapRef = useFocusTrap(true);
  useEscapeKey(onClose);

  const settle = (prayer) => {
    markTended(prayer.id);
    setRemaining((list) => list.filter((p) => p.id !== prayer.id));
  };

  const openPrayer = (prayer, focus) => {
    markTended(prayer.id);
    onClose();
    navigate(`/prayers/${prayer.id}`, { state: { focus } });
  };

  const release = (prayer) => {
    onRelease(prayer);
    settle(prayer);
    toast.success(t(lang, 'tendReleased'));
  };

  const restingLabel = (prayer) => {
    const since = lastPrayedDate(prayer, completions) || carriedSinceDate(prayer);
    return t(lang, 'tendRestingSince', { date: since.toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' }) });
  };

  const quiet = { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ background: 'var(--overlay)' }}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tend-altar-title"
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl"
        style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 id="tend-altar-title" className="editorial-heading text-2xl" style={{ color: 'var(--text-1)' }}>{t(lang, 'tendTitle')}</h2>
          <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="phase-icon-button shrink-0">
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        {remaining.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center" role="status">
            <RiseMark size={44} className="mb-4" />
            <p className="editorial text-xl" style={{ color: 'var(--text-1)' }}>{t(lang, 'tendDone')}</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-3)' }}>{t(lang, 'tendDoneBody')}</p>
            <PrimaryButton onClick={onClose} className="mt-6 min-w-36">{t(lang, 'close')}</PrimaryButton>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'tendIntro')}</p>
            <ul className="space-y-3">
              {remaining.map((prayer) => (
                <li key={prayer.id} className="rounded-2xl p-4" style={{ background: 'var(--surface-muted)', borderInlineStart: '3px solid var(--gold-bright)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{tr(prayer.title, lang)}</p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-3)' }}>{restingLabel(prayer)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => settle(prayer)} className="min-h-[44px] rounded-xl px-3 text-sm font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                      {t(lang, 'tendContinue')}
                    </button>
                    <button type="button" onClick={() => openPrayer(prayer, 'update')} className="min-h-[44px] rounded-xl px-3 text-sm font-medium" style={quiet}>
                      {t(lang, 'tendChanged')}
                    </button>
                    <button type="button" onClick={() => openPrayer(prayer, 'answer')} className="min-h-[44px] rounded-xl px-3 text-sm font-medium" style={quiet}>
                      {t(lang, 'tendTestimony')}
                    </button>
                    {canReleaseFromRhythm(prayer) && (
                      <button type="button" onClick={() => release(prayer)} className="min-h-[44px] rounded-xl px-3 text-sm font-medium" style={{ color: 'var(--text-3)' }}>
                        {t(lang, 'tendRelease')}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
