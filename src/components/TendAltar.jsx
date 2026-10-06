import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { t } from '../i18n';
import { toast } from '../store/toastStore';
import { canReleaseFromRhythm, carriedSinceLabel, lastPrayedDate, markTended } from '../lib/carried';
import { circleLabelKey, circleOf } from '../lib/circles';
import { Modal, PrimaryButton, QuietButton, SecondaryButton } from './shared/Primitives';
import RiseMark from './shared/RiseMark';

// "Tend your altar" (Elijah repairing the altar, 1 Kings 18:30): a reflective
// review of prayers that have quietly rested a while, ONE prayer at a time, so
// a prayer list never becomes an abandoned archive. There is no wrong answer
// and no scolding — continuing, telling what changed, testifying and releasing
// are all faithful choices. Releasing is NOT failure and does NOT mean the
// prayer was answered: it only stops the prayer returning on its own; it stays
// in the Journal.
//
// Answers are remembered on this device only (ids and dates — see lib/carried.js).
export default function TendAltar({ prayers, completions, lang, tr, onRelease, onClose }) {
  const navigate = useNavigate();
  // The prayers to tend are fixed when the review opens: answering one must
  // never reshuffle the ones still waiting.
  const [queue] = useState(prayers);
  const [index, setIndex] = useState(0);
  const titleRef = useRef(null);
  const prayer = queue[index] || null;

  // Each new prayer takes focus, so a screen reader hears it arrive.
  useEffect(() => {
    if (index > 0) titleRef.current?.focus();
  }, [index]);

  const settle = (item) => {
    markTended(item.id);
    setIndex((i) => i + 1);
  };

  const openPrayer = (item, focus) => {
    markTended(item.id);
    onClose();
    navigate(`/prayers/${item.id}`, { state: { focus } });
  };

  const release = (item) => {
    onRelease(item);
    settle(item);
    toast.success(t(lang, 'tendReleased'));
  };

  const context = (item) => {
    const circle = circleOf(item);
    return [
      circle ? t(lang, circleLabelKey(circle)) : '',
      item.for_other && item.person_name ? t(lang, 'forPersonLabel', { name: item.person_name }) : '',
    ].filter(Boolean).join(' · ');
  };

  const meta = (item) => {
    const since = carriedSinceLabel(item, lang);
    const last = lastPrayedDate(item, completions);
    return [
      since ? t(lang, 'carriedSince', { date: since }) : '',
      last ? t(lang, 'tendRestingSince', { date: last.toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' }) }) : '',
    ].filter(Boolean).join(' · ');
  };

  return (
    <Modal labelledBy="tend-altar-title" onClose={onClose} className="tend-altar">
      <header className="tend-altar__header">
        <div className="min-w-0">
          <h2 id="tend-altar-title" className="tend-altar__title">{t(lang, 'tendTitle')}</h2>
          {prayer && <p className="tend-altar__sub">{t(lang, 'tendSub')}</p>}
        </div>
        <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 -mt-2">
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      {prayer ? (
        <article key={prayer.id} className="tend-altar__prayer rise-in" aria-labelledby="tend-altar-prayer">
          {queue.length > 1 && (
            <p className="tend-altar__progress"><span dir="ltr">{index + 1} / {queue.length}</span></p>
          )}
          {context(prayer) && <p className="section-label">{context(prayer)}</p>}
          <h3 id="tend-altar-prayer" ref={titleRef} tabIndex={-1} className="tend-altar__prayer-title">
            {tr(prayer.title, lang)}
          </h3>
          {meta(prayer) && <p className="tend-altar__meta">{meta(prayer)}</p>}

          <p className="tend-altar__question">{t(lang, 'tendQuestion')}</p>
          <div className="tend-altar__actions">
            <PrimaryButton onClick={() => settle(prayer)}>{t(lang, 'tendContinue')}</PrimaryButton>
            <SecondaryButton onClick={() => openPrayer(prayer, 'update')}>{t(lang, 'tendChanged')}</SecondaryButton>
            <SecondaryButton onClick={() => openPrayer(prayer, 'answer')}>{t(lang, 'tendTestimony')}</SecondaryButton>
            {canReleaseFromRhythm(prayer) && (
              <QuietButton onClick={() => release(prayer)} className="tend-altar__release">{t(lang, 'tendRelease')}</QuietButton>
            )}
          </div>
        </article>
      ) : (
        <div className="tend-altar__done rise-in" role="status">
          <RiseMark size={44} />
          <p className="tend-altar__done-title">{t(lang, 'tendDone')}</p>
          <p className="tend-altar__sub">{t(lang, 'tendDoneBody')}</p>
          <PrimaryButton onClick={onClose} className="mt-8 min-w-36">{t(lang, 'remainFinish')}</PrimaryButton>
        </div>
      )}
    </Modal>
  );
}
