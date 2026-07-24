import { useRef, useState } from 'react';
import { Check, Feather, HandHeart, Loader2, Lock, X } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { setContentLang } from '../lib/contentLang';
import {
  hasPendingGuestDraftSync,
  markGuestDraftPrayed,
  saveGuestDraft,
} from '../lib/guestPrayerDraft';
import { markActivationSessionCompleted } from '../lib/activationProgress';
import { EVENTS, track } from '../lib/analytics';
import { PrimaryButton, QuietButton, SectionLabel } from './shared/Primitives';

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
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: 'var(--background)' }}>
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, 'prayNow')}
        tabIndex={-1}
        className="flex h-full flex-col focus:outline-none"
      >
        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
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
            <p className="mt-5 text-xs" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'sessionDoneSub', { n: 1 })}
            </p>
            <PrimaryButton onClick={onClose} className="mt-9 min-w-36">
              {t(lang, 'close')}
            </PrimaryButton>
          </div>
        ) : (
          <>
            <header className="shrink-0 px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]" style={{ background: 'var(--plum-deep)' }}>
              <div className="mx-auto mb-3 flex max-w-2xl items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[.18em]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Pray4Me · 1 / 1
                </p>
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
              <div className="mx-auto h-px max-w-2xl" style={{ background: 'var(--gold)' }} />
            </header>

            <main className="mx-auto flex w-full max-w-2xl flex-1 items-center overflow-y-auto px-6 py-9 sm:px-10 sm:py-12">
              <h2 className="editorial-heading text-4xl leading-[1.12] sm:text-5xl" style={{ color: 'var(--text-1)' }}>
                {prayer.title}
              </h2>
            </main>

            <footer className="session-safe-footer shrink-0 px-5 pt-3">
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
  const trapRef = useFocusTrap(phase, phase === 'capture' ? 'textarea' : null);
  useEscapeKey(phase === 'capture' ? onFinish : undefined);

  const submitCapture = async (event) => {
    event.preventDefault();
    const title = text.trim();
    if (!title || saving) return;
    setSaving(true);
    const { id } = await saveGuestDraft({ title, completed: false, contentLanguage: lang });
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
      <div className="first-prayer-experience">
        <div
          ref={trapRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={t(lang, 'firstPrayerSaveTitle')}
          className="first-prayer-panel items-center justify-center text-center"
        >
          <div
            className="mb-7 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,.08)', color: 'var(--gold)', border: '1px solid rgba(255,255,255,.12)' }}
          >
            <Feather size={24} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <SectionLabel className="mb-3" style={{ color: 'var(--gold)' }}>Pray4Me</SectionLabel>
          <h2 className="editorial-heading max-w-lg text-3xl leading-tight sm:text-4xl">
            {t(lang, 'firstPrayerSaveTitle')}
          </h2>
          <p className="mt-4 flex max-w-sm items-center justify-center gap-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,.62)' }}>
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
    <div className="first-prayer-experience">
      <form
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onSubmit={submitCapture}
        className="first-prayer-panel"
      >
        <header className="flex min-h-11 items-center justify-between">
          <div className="flex items-center gap-2.5 text-sm font-semibold tracking-wide">
            <img src="/logo-constellation.svg" alt="" className="h-8 w-8 rounded-lg" />
            Pray4Me
          </div>
          <button
            type="button"
            onClick={onFinish}
            aria-label={t(lang, 'close')}
            className="pressable flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.76)' }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="flex flex-1 flex-col justify-center py-10 sm:py-16">
          <SectionLabel className="mb-4">Pray4Me</SectionLabel>
          <h2 className="editorial-heading max-w-xl text-4xl leading-[1.08] sm:text-5xl">
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

          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed sm:text-sm" style={{ color: 'rgba(255,255,255,.58)' }}>
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
            {saving
              ? <Loader2 size={17} className="animate-spin" aria-hidden="true" />
              : <HandHeart size={17} aria-hidden="true" />}
            {t(lang, 'firstPrayerPrayCta')}
          </PrimaryButton>
          <button
            type="button"
            onClick={onFinish}
            className="pressable min-h-11 w-full text-sm font-semibold"
            style={{ color: 'rgba(255,255,255,.6)' }}
          >
            {t(lang, 'authBackHome')}
          </button>
        </div>
      </form>
    </div>
  );
}
