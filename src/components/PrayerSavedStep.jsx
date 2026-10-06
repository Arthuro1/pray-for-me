import { useState } from 'react';
import { HandHeart, X } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import { useShallow } from 'zustand/react/shallow';
import AudienceBadge from './shared/AudienceBadge';
import { audienceOf, protectionOf } from '../lib/audience';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { todayKey } from '../lib/prayedLog';
import { nextReturnLabel } from '../lib/scheduleDraft';
import PrayerSession from './PrayerSession';
import RiseMark from './shared/RiseMark';
import { PrimaryButton, QuietButton, SecondaryButton } from './shared/Primitives';

// Shown right after a new personal prayer is saved: a calm confirmation with ONE
// decision — pray now, or be done. "Pray now" opens a real prayer session on the
// prayer that was just written (not a mere modal close). Scripture, reminders and
// sharing are surfaced later, from the prayer detail page, so this moment stays
// about praying rather than configuring.
//
// Privacy is stated ONCE here, as the quiet audience badge. The save toast has
// already said "Saved privately", so this panel leads with the prayer itself and
// with when it comes back — repeating the reassurance a third time would only
// make a private prayer feel riskier than it is.
// The very FIRST saved prayer is a threshold, so it is named as one — "Your
// prayer altar has begun" — with the single next step a life of prayer needs:
// choosing how often to return. Every later save keeps the plain confirmation.
export default function PrayerSavedStep({ prayerId, title, description, encrypted = false, schedule = null, lang, onClose, onChooseRhythm }) {
  const [praying, setPraying] = useState(false);
  const { prayers, categories, markPrayedOn } = usePrayerStore(
    useShallow((s) => ({ prayers: s.prayers, categories: s.categories, markPrayedOn: s.markPrayedOn }))
  );
  const { tr } = useTranslationStore();
  const trapRef = useFocusTrap(true);
  useEscapeKey(onClose);

  // The ACTUAL newly created prayer (optimistic store copy) — its audience and
  // protection are computed from that row's real metadata, never from the
  // device's vault state. The fallback (a store race) carries the caller's
  // EXPLICIT record of whether this write was encrypted, so even then the
  // status is a fact about this prayer rather than a guess.
  const savedPrayer = prayers.find((p) => p.id === prayerId)
    || { id: prayerId, title, description, _encrypted: encrypted, prayer_categories: [], prayer_points: [] };

  // The next day this prayer returns, AFTER today — null when there is none to
  // name (a one-off due today, "no fixed schedule"), in which case we say nothing
  // rather than hedge.
  const nextReturn = nextReturnLabel(schedule ?? savedPrayer.schedule, lang);
  const isFirstPrayer = prayers.length === 1 && prayers[0].id === prayerId;
  const heading = t(lang, isFirstPrayer ? 'altarBegunTitle' : 'prayerSavedTitle');

  if (praying) {
    const prayer = savedPrayer;
    return (
      <PrayerSession
        prayers={[prayer]}
        categories={categories}
        lang={lang}
        tr={tr}
        onClose={onClose}
        onPrayed={(id) => markPrayedOn(id, todayKey())}
      />
    );
  }

  return (
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:items-center md:p-6" onClick={onClose}>
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        className="q-dialog saved-step"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="saved-step__close">
          <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* One mark for every saved prayer: the incense rising. A check in a
            green circle said "done"; green belongs to answered prayer. */}
        <div className="saved-step__body">
          <RiseMark size={isFirstPrayer ? 44 : 36} />
          <h2 className="q-dialog__title">{heading}</h2>
          <p className="q-meta">{t(lang, isFirstPrayer ? 'altarBegunBody' : 'savedOnToday')}</p>
          {/* When it comes back — the one thing this moment can usefully add,
              and only when the schedule really has a next day to name. */}
          {nextReturn && <p className="q-meta">{t(lang, 'nextPrayerLabel', { when: nextReturn })}</p>}
          {/* The prayer's audience and protection, computed from the ACTUAL
              saved prayer and stated the same way they read everywhere else —
              a new personal prayer is Private, with encryption shown as a
              separate quiet status only when THIS prayer was really encrypted. */}
          <div className="mt-2">
            <AudienceBadge audience={audienceOf(savedPrayer, [])} protection={protectionOf(savedPrayer)} lang={lang} />
          </div>
        </div>

        <div className="grid gap-2">
          <PrimaryButton icon={HandHeart} onClick={() => setPraying(true)} className="min-h-[52px]">{t(lang, 'prayNowCta')}</PrimaryButton>
          <SecondaryButton onClick={onClose}>{t(lang, 'doneBtn')}</SecondaryButton>
          {isFirstPrayer && onChooseRhythm && (
            <QuietButton onClick={() => onChooseRhythm(savedPrayer)}>{t(lang, 'altarChooseRhythm')}</QuietButton>
          )}
        </div>
      </div>
    </div>
  );
}
