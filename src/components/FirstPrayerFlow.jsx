import { useRef, useState } from 'react';
import { Lock, HandHeart, Loader2, X, Feather } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { setContentLang } from '../lib/contentLang';
import { todayKey } from '../lib/prayedLog';
import { defaultNewSchedule } from '../lib/scheduleDraft';
import { saveGuestDraft, markGuestDraftPrayed, hasPendingGuestDraftSync } from '../lib/guestPrayerDraft';
import { track, EVENTS } from '../lib/analytics';
import PrayerSession from './PrayerSession';
import { PrimaryButton, QuietButton, SectionLabel } from './shared/Primitives';

function ConstellationBackdrop() {
  return (
    <div className="constellation-onboarding__sky" aria-hidden="true">
      <img src="/assets/constellation/community-sky-light-transparent.png" alt="" className="constellation-onboarding__sky-image constellation-onboarding__sky-image--light" />
      <img src="/assets/constellation/community-sky-dark-transparent.png" alt="" className="constellation-onboarding__sky-image constellation-onboarding__sky-image--dark" />
    </div>
  );
}

// The first prayer, in two modes:
//
//   member — the signed-in first-run experience (unchanged): one screen asks what
//            to pray about, saves it privately (encrypted by default) and goes
//            straight into praying it.
//   guest  — the "pray first, sign up only to save" experience for a visitor with
//            no account: the same one question, but the prayer is kept only on
//            THIS device (encrypted, see guestPrayerDraft) and NOTHING is sent to
//            the server. After the prayer moment we ask, gently, whether to keep
//            it — and only then does authentication enter the picture.
//
// Guest mode makes no AI / translation / YouVersion / community / reminder /
// scheduling requests: a bare in-memory prayer (no points, no verses) is handed
// to the requests-only PrayerSession (allowFormats=false), and completion is a
// local callback that updates the encrypted draft, never a store/server write.
export default function FirstPrayerFlow({ mode = 'member', lang = 'en', onFinish, onRequestSave }) {
  const isGuest = mode === 'guest';
  // Resume at the decide screen when a guest draft already exists (e.g. the
  // visitor went to authenticate and came back) — so cancelling auth returns them
  // to their prayer, not a blank capture screen, and their draft is never lost.
  const [phase, setPhase] = useState(() => (isGuest && hasPendingGuestDraftSync() ? 'decide' : 'capture'));
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [prayer, setPrayer] = useState(null); // the in-memory prayer for the session
  const prayedRef = useRef(false); // fire the "prayed" analytic at most once

  // Re-focus the active panel when the phase changes. During 'pray' the ref is
  // attached to nothing (PrayerSession owns its own trap), so this stays inert.
  const trapRef = useFocusTrap(phase, phase === 'capture' ? 'textarea' : null);
  // Esc dismisses only the capture screen (no draft yet, nothing destroyed). The
  // decide screen deliberately has NO Esc-to-leave, so a stray keypress can't drop
  // a saved draft; PrayerSession handles its own Esc during 'pray'.
  useEscapeKey(phase === 'capture' ? onFinish : undefined);

  const submitCapture = async (e) => {
    e.preventDefault();
    const title = text.trim();
    if (!title || saving) return;
    setSaving(true);
    if (isGuest) {
      const { id } = await saveGuestDraft({ title, completed: false, contentLanguage: lang });
      setContentLang(lang); // local only — never a network call
      track(EVENTS.GUEST_PRAYER_STARTED);
      setPrayer({ id, title, prayer_categories: [], prayer_points: [] });
      setSaving(false);
      setPhase('pray');
      return;
    }
    // Member: same bounded weekly default as the main form — the first prayer
    // shows today and returns weekly, not silently every day.
    const id = await usePrayerStore.getState().addPrayer({ title, schedule: defaultNewSchedule() });
    setSaving(false);
    if (!id) { onFinish?.(); return; }
    setContentLang(lang);
    const created = usePrayerStore.getState().prayers.find((p) => p.id === id)
      || { id, title, prayer_categories: [], prayer_points: [] };
    setPrayer(created);
    setPhase('pray');
  };

  const handlePrayed = (id) => {
    if (isGuest) {
      markGuestDraftPrayed(); // persist completion to the encrypted local draft
      if (!prayedRef.current) { prayedRef.current = true; track(EVENTS.GUEST_PRAYER_PRAYED); }
      return;
    }
    usePrayerStore.getState().markPrayedOn(id, todayKey());
  };

  const requestSave = () => { track(EVENTS.GUEST_PRAYER_SAVE_REQUESTED); onRequestSave?.(); };

  if (phase === 'pray' && prayer) {
    // Guest sessions never touch the authenticated stores: no categories, and a
    // pass-through translator (a brand-new guest prayer has nothing to translate).
    return (
      <PrayerSession
        prayers={[prayer]}
        categories={isGuest ? [] : usePrayerStore.getState().categories}
        lang={lang}
        tr={isGuest ? (txt) => txt : useTranslationStore.getState().tr}
        allowFormats={!isGuest}
        onClose={() => (isGuest ? setPhase('decide') : onFinish?.())}
        onPrayed={handlePrayed}
      />
    );
  }

  // Guest: the one gentle decision, AFTER the prayer moment. Framed honestly —
  // the prayer is still device-local here; account encryption happens on save.
  if (phase === 'decide') {
    return (
      <div className="first-prayer-experience constellation-onboarding">
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
          <SectionLabel className="mb-3" style={{ color: 'var(--gold)' }}>Pray4Me</SectionLabel>
          <h2 className="editorial-heading max-w-lg text-3xl leading-tight sm:text-4xl">
            {t(lang, 'firstPrayerSaveTitle')}
          </h2>
          <p className="constellation-onboarding__note mt-4 flex max-w-sm items-center justify-center gap-2 text-sm leading-relaxed">
            <Lock size={14} aria-hidden="true" /> {t(lang, 'firstPrayerDeviceNote')}
          </p>
          <div className="mt-10 w-full max-w-sm space-y-3">
            <PrimaryButton onClick={requestSave} icon={HandHeart} className="first-prayer-primary w-full min-h-[52px]">
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

  // Capture: the single question that matters.
  return (
    <div className="first-prayer-experience constellation-onboarding">
      <ConstellationBackdrop />
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
            className="constellation-onboarding__close pressable flex h-11 w-11 items-center justify-center rounded-full"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="flex flex-1 flex-col justify-center py-10 sm:py-16">
          <SectionLabel className="mb-4">Pray4Me</SectionLabel>
          <h2 className="editorial-heading max-w-xl text-4xl leading-[1.08] sm:text-5xl">
            {t(lang, isGuest ? 'firstPrayerQuestion' : 'onboardCaptureTitle')}
          </h2>

          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t(lang, 'onboardCapturePlaceholder')}
            aria-label={t(lang, isGuest ? 'firstPrayerQuestion' : 'onboardCaptureTitle')}
            rows={4}
            className="first-prayer-journal mt-7"
          />

          <p className="constellation-onboarding__note mt-4 flex items-start gap-2 text-xs leading-relaxed sm:text-sm">
            <Lock size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            {t(lang, isGuest ? 'firstPrayerDeviceNote' : 'onboardPrivateNote')}
          </p>
        </div>

        <div className="w-full space-y-3">
          <PrimaryButton
            type="submit"
            disabled={!text.trim() || saving}
            className="first-prayer-primary w-full min-h-[54px]"
          >
            {saving ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <HandHeart size={17} aria-hidden="true" />}
            {t(lang, isGuest ? 'firstPrayerPrayCta' : 'onboardSaveAndPray')}
          </PrimaryButton>
          <button
            type="button"
            onClick={onFinish}
            className="constellation-onboarding__later pressable min-h-11 w-full text-sm font-semibold"
          >
            {t(lang, isGuest ? 'authBackHome' : 'onboardLater')}
          </button>
        </div>
      </form>
    </div>
  );
}
