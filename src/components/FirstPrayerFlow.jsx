import { useRef, useState } from 'react';
import { Lock, HandHeart, Loader2 } from 'lucide-react';
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
  const trapRef = useFocusTrap(phase);
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
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
        <div
          ref={trapRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={t(lang, 'firstPrayerSaveTitle')}
          className="w-full max-w-sm rounded-3xl p-6"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
        >
          <div className="text-4xl mb-3 text-center">🙏</div>
          <h2 className="text-lg font-semibold mb-2 text-center" style={{ color: 'var(--text-1)' }}>
            {t(lang, 'firstPrayerSaveTitle')}
          </h2>
          <p className="text-xs flex items-center justify-center gap-1.5 mb-5 text-center" style={{ color: 'var(--text-3)' }}>
            <Lock size={11} /> {t(lang, 'firstPrayerDeviceNote')}
          </p>
          <button
            onClick={requestSave}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white mb-2.5"
            style={{ background: 'var(--accent)' }}
          >
            <HandHeart size={16} /> {t(lang, 'firstPrayerSaveBtn')}
          </button>
          <button
            onClick={onFinish}
            className="w-full py-3 rounded-xl text-sm font-medium"
            style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
          >
            {t(lang, 'firstPrayerFinishBtn')}
          </button>
        </div>
      </div>
    );
  }

  // Capture: the single question that matters.
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <form
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onSubmit={submitCapture}
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
      >
        <div className="text-4xl mb-3 text-center">🙏</div>
        <h2 className="text-xl font-semibold mb-4 text-center" style={{ color: 'var(--text-1)' }}>
          {t(lang, isGuest ? 'firstPrayerQuestion' : 'onboardCaptureTitle')}
        </h2>

        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t(lang, 'onboardCapturePlaceholder')}
          aria-label={t(lang, isGuest ? 'firstPrayerQuestion' : 'onboardCaptureTitle')}
          rows={3}
          className="w-full text-sm rounded-xl px-4 py-3 resize-none focus:outline-none mb-2"
          style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
        />

        <p className="text-xs flex items-center justify-center gap-1.5 mb-5" style={{ color: 'var(--text-3)' }}>
          <Lock size={11} /> {t(lang, isGuest ? 'firstPrayerDeviceNote' : 'onboardPrivateNote')}
        </p>

        <button
          type="submit"
          disabled={!text.trim() || saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 mb-2.5"
          style={{ background: 'var(--accent)' }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <HandHeart size={16} />}
          {t(lang, isGuest ? 'firstPrayerPrayCta' : 'onboardSaveAndPray')}
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="w-full py-3 rounded-xl text-sm font-medium"
          style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
        >
          {t(lang, isGuest ? 'authBackHome' : 'onboardLater')}
        </button>
      </form>
    </div>
  );
}
