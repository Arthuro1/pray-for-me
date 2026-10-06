import { useState } from 'react';
import { Check, HandHeart, X } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6" style={{ background: 'rgba(26,10,46,0.6)' }} onClick={onClose}>
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        className="w-full max-w-md mx-auto rounded-t-3xl md:rounded-3xl px-6 pt-6 pb-8 md:shadow-2xl"
        style={{ background: 'var(--q-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Full 44×44 tap target: the button carries the size, the inner
            circle only carries the look. */}
        <div className="flex justify-end -mt-3 -mr-3 mb-1">
          <button
            onClick={onClose}
            aria-label={t(lang, 'close')}
            className="w-11 h-11 flex items-center justify-center rounded-full focus-visible:ring-2"
            style={{ color: 'var(--q-royal-text)' }}
          >
            <span aria-hidden="true" className="p-1.5 rounded-full flex items-center justify-center" style={{ background: 'var(--q-selected)' }}>
              <X size={16} />
            </span>
          </button>
        </div>

        {/* Compact success confirmation */}
        <div className="text-center mb-6">
          {isFirstPrayer ? (
            <div className="mx-auto mb-2 flex h-14 items-end justify-center" aria-hidden="true">
              <RiseMark size={44} />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--q-success-soft)' }}>
              <Check size={26} style={{ color: 'var(--q-success)' }} />
            </div>
          )}
          <h2 className="text-lg font-semibold" style={{ color: 'var(--q-text)' }}>{heading}</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--q-text-tertiary)' }}>
            {t(lang, isFirstPrayer ? 'altarBegunBody' : 'savedOnToday')}
          </p>
          {/* When it comes back — the one thing this moment can usefully add,
              and only when the schedule really has a next day to name. */}
          {nextReturn && (
            <p className="text-sm mt-1" style={{ color: 'var(--q-text-tertiary)' }}>
              {t(lang, 'nextPrayerLabel', { when: nextReturn })}
            </p>
          )}
          {/* The prayer's audience and protection, computed from the ACTUAL
              saved prayer and stated the same way they read everywhere else —
              a new personal prayer is Private, with encryption shown as a
              separate quiet status only when THIS prayer was really encrypted. */}
          <div className="mt-2.5">
            <AudienceBadge audience={audienceOf(savedPrayer, [])} protection={protectionOf(savedPrayer)} lang={lang} />
          </div>
        </div>

        <button
          onClick={() => setPraying(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white mb-2.5"
          style={{ background: 'var(--q-action-primary)' }}
        >
          <HandHeart size={17} /> {t(lang, 'prayNowCta')}
        </button>
        <button
          onClick={onClose}
          className="w-full rounded-xl py-3 text-sm font-medium"
          style={{ background: 'var(--q-field)', border: '0.5px solid var(--q-field-border)', color: 'var(--q-text-secondary)' }}
        >
          {t(lang, 'doneBtn')}
        </button>
        {isFirstPrayer && onChooseRhythm && (
          <button
            type="button"
            onClick={() => onChooseRhythm(savedPrayer)}
            className="mt-2 w-full min-h-[44px] text-sm font-semibold focus-visible:ring-2 rounded-xl"
            style={{ color: 'var(--q-royal-text)' }}
          >
            {t(lang, 'altarChooseRhythm')}
          </button>
        )}
      </div>
    </div>
  );
}
