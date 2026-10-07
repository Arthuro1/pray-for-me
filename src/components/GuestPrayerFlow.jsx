import { useRef, useState } from 'react';
import { Check, HandHeart, Loader2, Lock, X } from 'lucide-react';
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
import { PrimaryButton, QuietButton, SecondaryButton, SectionLabel } from './shared/Primitives';
import PrayerMusicControl from './PrayerMusicControl';
import RiseMark from './shared/RiseMark';
import { APP_NAME } from '../lib/brand';
import { circleLabelKey, circlePromptKey } from '../lib/circles';
import CircleGlyph from './shared/CircleGlyph';

import { BrandLockup } from './shared/Brand';
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
    <div className="prayer-session q-immersive public-surface">
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, 'prayNow')}
        tabIndex={-1}
        className="flex h-full flex-col focus:outline-none"
      >
        {done ? (
          <div className="prayer-session__done">
            <RiseMark size={56} className="mb-6" />
            <SectionLabel sacred className="mb-3">{t(lang, 'amenBtn')}</SectionLabel>
            <h2 className="prayer-session__done-title">{t(lang, 'sessionDoneTitle')}</h2>
            <p className="q-meta mt-5">{tp(lang, 'sessionDoneSub', 1)}</p>
            <div className="prayer-session__done-actions">
              <PrimaryButton onClick={onClose}>{t(lang, 'continueBtn')}</PrimaryButton>
            </div>
          </div>
        ) : (
          <>
            <header className="prayer-session__header">
              <div className="prayer-session__bar">
                <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable">
                  <X size={20} aria-hidden="true" />
                </button>
                <div className="prayer-session__tools">
                  <PrayerMusicControl lang={lang} active />
                </div>
              </div>
              <div className="prayer-session__progress-row">
                <div className="prayer-session__track" aria-hidden="true"><span style={{ width: '100%' }} /></div>
                <p className="prayer-session__progress"><span dir="ltr">1 / 1</span></p>
              </div>
            </header>

            <main className="prayer-session__request">
              <div className="prayer-session__step">
                <h2 className="prayer-session__title">{prayer.title}</h2>
              </div>
            </main>

            <footer className="prayer-session__footer session-safe-footer">
              <div className="prayer-session__footer-row">
                <PrimaryButton onClick={finishPrayer} icon={Check} className="prayer-session__advance">
                  {t(lang, 'amenBtn')}
                </PrimaryButton>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

// `context` — { circle, prompt } — when the visitor came from a circle on the
// landing page: the circle frames the question and is kept (encrypted, with the
// draft) so it can be placed on their altar after sign-up; a prompt from
// "Pray this" appears ABOVE the empty field as a starting point. Neither is
// ever written into the visitor's own words.
export default function GuestPrayerFlow({ lang = 'en', context = null, onFinish, onRequestSave }) {
  const [phase, setPhase] = useState(() => (hasPendingGuestDraftSync() ? 'decide' : 'capture'));
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [prayer, setPrayer] = useState(null);
  const prayedRef = useRef(false);
  const circle = context?.circle || null;
  const question = t(lang, circle ? circlePromptKey(circle) : 'firstPrayerQuestion');

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
    const { id } = await saveGuestDraft({ title, completed: false, contentLanguage: lang, circle: context?.circle });
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
      <div className="first-prayer public-surface">
        <div
          ref={trapRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={t(lang, 'firstPrayerSaveTitle')}
          className="first-prayer__panel first-prayer__panel--center"
        >
          <RiseMark motion="still" size={40} className="mb-6" />
          <SectionLabel sacred className="mb-3">{APP_NAME}</SectionLabel>
          <h2 className="first-prayer__title">
            {t(lang, 'firstPrayerSaveTitle')}
          </h2>
          <p className="first-prayer__note">
            <Lock size={14} aria-hidden="true" /> {t(lang, 'firstPrayerDeviceNote')}
          </p>
          <div className="first-prayer__actions">
            <PrimaryButton onClick={requestSave} icon={HandHeart} className="first-prayer__primary">
              {t(lang, 'firstPrayerSaveBtn')}
            </PrimaryButton>
            <SecondaryButton onClick={onFinish} className="w-full">
              {t(lang, 'firstPrayerFinishBtn')}
            </SecondaryButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="first-prayer public-surface">
      <form
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-prayer-question"
        onSubmit={submitCapture}
        className="first-prayer__panel"
      >
        <header className="flex min-h-11 items-center justify-between">
          <BrandLockup size={30} />
          <button
            type="button"
            onClick={onFinish}
            aria-label={t(lang, 'close')}
            className="icon-button icon-button--outlined pressable"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="flex flex-1 flex-col justify-center py-10 sm:py-16">
          {circle ? (
            <SectionLabel sacred className="first-prayer__circle mb-4">
              <CircleGlyph circle={circle} size={18} selected />
              <span>{t(lang, circleLabelKey(circle))}</span>
            </SectionLabel>
          ) : (
            <SectionLabel className="mb-4">{APP_NAME}</SectionLabel>
          )}
          <h2 id="guest-prayer-question" className={`first-prayer__question rise-in${circle ? ' first-prayer__question--circle' : ''}`}>
            {question}
          </h2>
          {context?.prompt ? (
            <p className="first-prayer__starting-point rise-in rise-in--late">{context.prompt}</p>
          ) : (
            <p className="first-prayer__lede rise-in rise-in--late">
              {t(lang, 'firstPrayerBring')}
            </p>
          )}

          <textarea
            autoFocus
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t(lang, 'onboardCapturePlaceholder')}
            aria-label={question}
            rows={4}
            className="first-prayer__journal"
          />

          <p className="first-prayer__note">
            <Lock size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            {t(lang, 'firstPrayerDeviceNote')}
          </p>
        </div>

        <div className="first-prayer__actions">
          <PrimaryButton
            type="submit"
            disabled={!text.trim() || saving}
            className="first-prayer__primary"
          >
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              {saving
                ? <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                : <HandHeart size={17} aria-hidden="true" />}
              {t(lang, 'firstPrayerPrayCta')}
            </span>
          </PrimaryButton>
          <QuietButton onClick={onFinish} className="w-full">
            {t(lang, 'authBackHome')}
          </QuietButton>
        </div>
      </form>
    </div>
  );
}
