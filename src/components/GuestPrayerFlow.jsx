import { useRef, useState } from 'react';
import { Check, Feather, HandHeart, Loader2, Lock, X } from 'lucide-react';
import { t, tp } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { setContentLang } from '../lib/contentLang';
import {
  hasPendingGuestDraftSync,
  markGuestDraftPrayed,
  saveGuestDraft,
} from '../lib/guestPrayerDraft';
import { markActivationSessionCompleted } from '../lib/activationProgress';
import { useFormDraft } from '../hooks/useFormDraft';
import { DRAFT_SLOTS } from '../lib/prayerFormDrafts';
import { EVENTS, track } from '../lib/analytics';
import { PrimaryButton, QuietButton, SectionLabel } from './shared/Primitives';
import Encouragement from './shared/Encouragement';
import PrayerMusicControl from './PrayerMusicControl';

function ConstellationBackdrop() {
  return (
    <div className="constellation-onboarding__sky" aria-hidden="true">
      <img src="/assets/constellation/community-sky-light-transparent.png" alt="" className="constellation-onboarding__sky-image constellation-onboarding__sky-image--light" />
      <img src="/assets/constellation/community-sky-dark-transparent.png" alt="" className="constellation-onboarding__sky-image constellation-onboarding__sky-image--dark" />
    </div>
  );
}

// The guest prayer moment intentionally has no imports from prayerStore,
// Supabase, Scripture lookup, authenticated crypto, community, or reminders.
// The visitor's text remains encrypted on this device until they explicitly
// choose to authenticate and import it through the account flow.
function GuestPrayerSession({ prayer, lang, onClose, onPrayed }) {
  const [done, setDone] = useState(false);
  const trapRef = useFocusTrap(true);
  useEscapeKey(onClose);

  const finishPrayer = () => {
    onPrayed(prayer.id);
    markActivationSessionCompleted();
    setDone(true);
  };

  return (
    <div
      className="prayer-session constellation-session constellation-onboarding constellation-guest-flow fixed inset-0 z-[70] flex flex-col"
      style={{ background: 'var(--background)' }}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, 'prayNow')}
        tabIndex={-1}
        className="flex h-full flex-col focus:outline-none"
      >
        {done ? (
          <div className="constellation-session__done flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div
              className="mb-7 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: 'var(--sage-soft)', color: 'var(--success)', border: '1px solid var(--success-border)' }}
            >
              <Check size={22} strokeWidth={1.7} aria-hidden="true" />
            </div>
            <SectionLabel className="mb-3">Amen</SectionLabel>
            <h2 className="editorial-heading max-w-lg text-3xl leading-tight sm:text-4xl" style={{ color: 'var(--text-1)' }}>
              {t(lang, 'sessionDoneTitle')}
            </h2>
            <Encouragement lang={lang} className="mt-4 max-w-sm" />
            <p className="mt-5 text-xs" style={{ color: 'var(--text-3)' }}>
              {tp(lang, 'sessionDoneSub', 1)}
            </p>
            <PrimaryButton onClick={onClose} className="mt-9 min-w-36">
              {t(lang, 'continueBtn')}
            </PrimaryButton>
          </div>
        ) : (
          <>
            <header className="constellation-session__header shrink-0 px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]" style={{ background: 'var(--plum-deep)' }}>
              <div className="mx-auto mb-3 flex max-w-2xl items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[.18em]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Praystead · 1 / 1
                </p>
                <div className="flex items-center gap-2">
                  <PrayerMusicControl lang={lang} active />
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={t(lang, 'close')}
                    className="pressable flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,.82)', border: '1px solid rgba(255,255,255,.1)' }}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="mx-auto h-px max-w-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.14)' }}>
                <div className="h-full w-full" style={{ background: 'var(--gold)' }} />
              </div>
            </header>

            <main className="constellation-session__request mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto px-6 py-9 sm:px-10 sm:py-12">
              <h2 className="constellation-session__title editorial-heading text-4xl leading-[1.12] sm:text-5xl" style={{ color: 'var(--text-1)' }}>
                {prayer.title}
              </h2>
            </main>

            <footer className="constellation-session__footer session-safe-footer shrink-0 px-5 pt-3">
              <div className="mx-auto flex w-full max-w-2xl">
                <PrimaryButton onClick={finishPrayer} className="min-h-[52px] flex-1">
                  <Check size={16} aria-hidden="true" /> {t(lang, 'amenBtn')}
                </PrimaryButton>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

export default function GuestPrayerFlow({ lang = 'en', onFinish, onRequestSave }) {
  const [phase, setPhase] = useState(() => (hasPendingGuestDraftSync() ? 'decide' : 'capture'));
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [prayer, setPrayer] = useState(null);
  const prayedRef = useRef(false);

  // What is typed here is a prayer before it is anything else. Protect it while
  // it is still just text on a screen — encrypted, on this device, cleared the
  // moment it becomes a real prayer — so a mis-tapped close or a reload doesn't
  // take it. Nothing about a capture draft is ever sent anywhere.
  const { commit: commitCapture } = useFormDraft({
    slot: DRAFT_SLOTS.FIRST_PRAYER,
    value: text,
    serialize: (value) => (value.trim() ? { title: value } : null),
    restore: ({ title }) => {
      if (!title) return false;
      setText(title);
      return true;
    },
  });
  const trapRef = useFocusTrap(phase, phase === 'capture' ? 'textarea' : null);
  useEscapeKey(phase === 'capture' ? onFinish : undefined);

  const submitCapture = async (event) => {
    event.preventDefault();
    const title = text.trim();
    if (!title || saving) return;
    setSaving(true);
    const { id } = await saveGuestDraft({ title, completed: false, contentLanguage: lang });
    commitCapture(); // the words now live in the guest prayer draft instead
    setContentLang(lang);
    track(EVENTS.GUEST_PRAYER_STARTED);
    setPrayer({ id, title });
    setSaving(false);
    setPhase('pray');
  };

  const handlePrayed = () => {
    markGuestDraftPrayed();
    if (!prayedRef.current) {
      prayedRef.current = true;
      track(EVENTS.GUEST_PRAYER_PRAYED);
    }
  };

  const requestSave = () => {
    track(EVENTS.GUEST_PRAYER_SAVE_REQUESTED);
    onRequestSave?.();
  };

  if (phase === 'pray' && prayer) {
    return (
      <GuestPrayerSession
        prayer={prayer}
        lang={lang}
        onClose={() => setPhase('decide')}
        onPrayed={handlePrayed}
      />
    );
  }

  if (phase === 'decide') {
    return (
      <div className="first-prayer-experience constellation-onboarding constellation-guest-flow">
        <ConstellationBackdrop />
        <div
          ref={trapRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={t(lang, 'firstPrayerSaveTitle')}
          className="first-prayer-panel items-center justify-center text-center"
        >
          <div className="constellation-onboarding__decision-icon mb-7 flex h-14 w-14 items-center justify-center rounded-full">
            <Feather size={24} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <SectionLabel className="mb-3" style={{ color: 'var(--gold)' }}>Praystead</SectionLabel>
          <h2 className="editorial-heading max-w-lg text-3xl leading-tight sm:text-4xl">
            {t(lang, 'firstPrayerSaveTitle')}
          </h2>
          <p className="constellation-onboarding__note mt-4 flex max-w-sm items-center justify-center gap-2 text-sm leading-relaxed">
            <Lock size={14} aria-hidden="true" /> {t(lang, 'firstPrayerDeviceNote')}
          </p>
          <div className="mt-10 w-full max-w-sm space-y-3">
            <PrimaryButton onClick={requestSave} icon={HandHeart} className="first-prayer-primary min-h-[52px] w-full">
              {t(lang, 'firstPrayerSaveBtn')}
            </PrimaryButton>
            <QuietButton onClick={onFinish} className="first-prayer-quiet w-full">
              {t(lang, 'firstPrayerFinishBtn')}
            </QuietButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="first-prayer-experience constellation-onboarding constellation-guest-flow">
      <ConstellationBackdrop />
      <form
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-prayer-question"
        onSubmit={submitCapture}
        className="first-prayer-panel"
      >
        <header className="flex min-h-11 items-center justify-between">
          <div className="flex items-center gap-2.5 text-sm font-semibold tracking-wide">
            <img src="/logo.svg" alt="" className="h-8 w-8 rounded-lg" />
            Praystead
          </div>
          <button
            type="button"
            onClick={onFinish}
            aria-label={t(lang, 'close')}
            className="constellation-onboarding__close pressable flex h-11 w-11 items-center justify-center rounded-full"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="flex flex-1 flex-col justify-center py-10 sm:py-16">
          <SectionLabel className="mb-4">Praystead</SectionLabel>
          <h2 id="guest-prayer-question" className="editorial-heading max-w-xl text-4xl leading-[1.08] sm:text-5xl">
            {t(lang, 'firstPrayerQuestion')}
          </h2>

          <textarea
            autoFocus
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t(lang, 'onboardCapturePlaceholder')}
            aria-label={t(lang, 'firstPrayerQuestion')}
            rows={4}
            className="first-prayer-journal mt-7"
          />

          <p className="constellation-onboarding__note mt-4 flex items-start gap-2 text-xs leading-relaxed sm:text-sm">
            <Lock size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            {t(lang, 'firstPrayerDeviceNote')}
          </p>
        </div>

        <div className="w-full space-y-3">
          <PrimaryButton
            type="submit"
            disabled={!text.trim() || saving}
            className="first-prayer-primary min-h-[54px] w-full"
          >
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              {saving
                ? <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                : <HandHeart size={17} aria-hidden="true" />}
              {t(lang, 'firstPrayerPrayCta')}
            </span>
          </PrimaryButton>
          <button
            type="button"
            onClick={onFinish}
            className="constellation-onboarding__later pressable min-h-11 w-full text-sm font-semibold"
          >
            {t(lang, 'authBackHome')}
          </button>
        </div>
      </form>
    </div>
  );
}
