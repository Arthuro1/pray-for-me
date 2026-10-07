import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Check, ChevronRight, ChevronLeft, ChevronDown, BookOpen, Loader2 } from 'lucide-react';
import { t, tp } from '../i18n';
import { confirm } from '../store/confirmStore';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLocalizedVerse } from '../hooks/useLocalizedVerse';
import { movementPassage } from '../lib/prayerMovements';
import { restingPlanDay } from '../lib/schedule';
import { planTotal } from '../lib/planTempo';
import { planPrayerText } from '../lib/guidedPlan';
import { usePlanDay } from '../hooks/usePlanDay';
import PlanDayBody from './PlanDayBody';
import { pick, localizeRef } from '../content/teaching';
import { todayKey } from '../lib/prayedLog';
import { markActivationSessionCompleted } from '../lib/activationProgress';
import VerseAccordion from './VerseAccordion';
import RichText from './rich/RichText';
import { PrimaryButton, QuietButton, SecondaryButton, SectionLabel } from './shared/Primitives';
import PrayerMusicControl from './PrayerMusicControl';
import PrayerSessionNote from './prayerSession/PrayerSessionNote';
import { useSessionNotes } from './prayerSession/useSessionNotes';
import { isSessionNote } from '../lib/prayerNotes';
import { circleLabelKey, circleOf } from '../lib/circles';
import { altarOrder, canPrayThroughAltar } from '../lib/altarSession';
import { useCircleTeaching } from '../hooks/useCircleTeaching';
import CircleGlyph from './shared/CircleGlyph';
import Switch from './shared/Switch';
import RemainWithGod from './RemainWithGod';
import RiseMark from './shared/RiseMark';

// "Pray now" starts praying IMMEDIATELY — no upfront choice. The session opens
// straight into the last-used format (requests, for a new user) and a small
// "Prayer format" control inside the session offers the deeper paths:
//   requests — pray straight through today's burdens (the default)
//   guided   — open in adoration, pray the requests, close in thanksgiving
//   acts     — Adoration → Confession → Thanksgiving → Supplication (the requests)
// Prayer is not a form: each Scripture movement points to a passage to read, and
// the requests themselves are always the heart of the session.
const MODE_STAGES = {
  requests: ['requests'],
  guided: ['adoration', 'requests', 'thanksgiving'],
  acts: ['adoration', 'confession', 'thanksgiving', 'requests'],
};

const MOVEMENT_META = {
  adoration: { titleKey: 'stageAdoration', promptKey: 'stageAdorationPrompt' },
  confession: { titleKey: 'stageConfession', promptKey: 'stageConfessionPrompt' },
  thanksgiving: { titleKey: 'stageThanksgiving', promptKey: 'stageThanksgivingPrompt' },
};

const MODE_OPTIONS = [
  { mode: 'requests', titleKey: 'modeRequests', descKey: 'modeRequestsDesc' },
  { mode: 'guided', titleKey: 'modeGuided', descKey: 'modeGuidedDesc' },
  { mode: 'acts', titleKey: 'modeActs', descKey: 'modeActsDesc' },
];

const MODE_STORAGE_KEY = 'pfm_prayer_mode';

function initialMode() {
  const saved = localStorage.getItem(MODE_STORAGE_KEY);
  return MODE_STAGES[saved] ? saved : 'requests';
}

// "Pray through my altar" is an ORDER for the requests, beside the format:
// off by default, remembered on this device like the format.
const ORDER_STORAGE_KEY = 'pfm_prayer_order';
const readAltarPreference = () => localStorage.getItem(ORDER_STORAGE_KEY) === 'altar';

// A single Scripture citation on a prayer point, shown in the reader's language.
// Verses are stored in the language the prayer was created in; useLocalizedVerse
// swaps in authoritative text + a localized reference for the current language when
// one is available (offline bundle / YouVersion — never AI-translated), otherwise
// it returns null and we keep the stored reference and wording together, so the two
// are always one consistent pair rather than a localized ref beside stale text.
function SessionVerse({ verse, lang }) {
  const resolved = useLocalizedVerse(verse.ref, lang);
  const ref = resolved?.ref ?? verse.ref;
  const text = resolved?.text ?? verse.text;

  return (
    <div className="scripture-block mt-4">
      {text && <p className="scripture-block__text">“{text}”</p>}
      {ref && (
        <VerseAccordion reference={ref} lang={lang} initialText={text}>
          {({ toggle }) => (
            <button
              onClick={toggle}
              title={t(lang, 'readInApp')}
              className="scripture-block__reference pressable flex min-h-11 items-center gap-1.5"
            >
              <BookOpen size={12} aria-hidden="true" /> {ref}
            </button>
          )}
        </VerseAccordion>
      )}
    </div>
  );
}

// `allowFormats` gates the guided / ACTS paths behind the format switcher. It is
// on by default; the guest first-prayer experience passes it false so the session
// stays requests-only — the deeper paths open Scripture movements (verse lookups),
// and a signed-out visitor's prayer must make no AI / YouVersion / network calls.
//
// `allowNotes` gates the optional prayer note. Off for a signed-out visitor for
// the same reason: a note becomes an entry in the prayer's update history, which
// only exists for an account.
// `doneTitle` names what was prayed through when the walk ends ("You have
// prayed through today's altar" from Today); other entry points keep the
// general "Time with God".
export default function PrayerSession({ prayers: givenPrayers, categories, lang, tr, onClose, onComplete, onPrayed, doneTitle, allowFormats = true, allowNotes = true }) {
  const [mode, setMode] = useState(() => (allowFormats ? initialMode() : 'requests'));
  // "Pray through my altar" (lib/altarSession.js): the requests circle by
  // circle, inner to outer, unplaced ones last. Offered only where the order
  // would change something. A walk keeps the order it began with, so a change
  // made after the first step applies from the next time of prayer.
  const altarOffered = allowFormats && canPrayThroughAltar(givenPrayers);
  const [altarPreferred, setAltarPreferred] = useState(readAltarPreference);
  const [altarWalk, setAltarWalk] = useState(() => altarOffered && readAltarPreference());
  const altar = useMemo(() => (altarWalk ? altarOrder(givenPrayers) : null), [altarWalk, givenPrayers]);
  const prayers = altar ? altar.prayers : givenPrayers;
  const circleTeaching = useCircleTeaching(lang);
  const [stageIndex, setStageIndex] = useState(0);
  const [prayerIndex, setPrayerIndex] = useState(0);
  // How many requests have been prayed THIS session (advanced past). Switching
  // format mid-session resumes the requests from here instead of repeating them.
  const [requestsCompleted, setRequestsCompleted] = useState(0);
  const [done, setDone] = useState(false);
  const [remaining, setRemaining] = useState(false);
  const [showFormats, setShowFormats] = useState(false);
  // Set while an atomic leave-this-prayer step runs (finalising a recording,
  // writing the encrypted draft). It disables navigation so a fast double tap
  // can never land a note on the NEXT prayer.
  const [committing, setCommitting] = useState(false);
  const [noteError, setNoteError] = useState(false);
  // Bumped when a plan day asks for the note composer ("Add a private prayer
  // note" on a deliverance day), so the reader lands in the existing composer
  // instead of a second, parallel one.
  const [noteOpenSignal, setNoteOpenSignal] = useState(0);
  // { height, top } while an on-screen keyboard is shrinking the visible area.
  const [viewport, setViewport] = useState(null);
  // Prayers whose completion has already been recorded this session, so
  // navigating back and forward doesn't log the same prayer twice.
  const completedIds = useRef(new Set());
  const requestScrollRef = useRef(null);
  const trapRef = useFocusTrap(true);

  const stages = MODE_STAGES[mode];
  const stage = stages[stageIndex];
  const total = prayers.length;
  const currentPrayer = stage === 'requests' ? prayers[prayerIndex] : null;
  // A saved-from-community copy follows someone else's request: its update
  // history belongs to the group's author, so there is nothing to note onto here
  // (Prayer Details hides its update composer for the same reason).
  // Not offered on a prayer this device cannot read: a locked row is exactly the
  // state where the vault cannot encrypt a note either, and promotion would then
  // fall back to the plaintext sync_add_update path — which fans a SHARED
  // prayer's updates out to every group copy. Writing a note about a request you
  // cannot see was never useful anyway.
  const notesEnabled = allowNotes && !currentPrayer?.community_origin_id && !currentPrayer?._locked;
  const notes = useSessionNotes(allowNotes);
  const noteDraft = currentPrayer ? notes.draftFor(currentPrayer.id) : null;

  // Guided plan: the day-specific content for the request being prayed right
  // now. Resolved HERE, at the top of the component, rather than down in the
  // supplication branch — the walk returns early for the Scripture movements, so
  // a hook further down would not run on every render.
  const sessionPlanId = currentPrayer?.schedule?.plan?.id || null;
  const sessionPlanVersion = currentPrayer?.schedule?.plan?.version || null;
  // WHICH day of the run to pray. It used to be planDayNumber(schedule, today)
  // alone, which is null on every date the pattern does not land on — a paused
  // run, a weekly or every-other-day pace, a day skipped or moved. The session
  // then silently dropped the whole day (theme, passage, reflection, prompts,
  // Go deeper) and prayed the plan's bare title and subtitle instead. It rests
  // on the day the run actually reached, exactly as the plan's own page does.
  const sessionPlanResting = sessionPlanId
    ? restingPlanDay(currentPrayer.schedule, todayKey(), currentPrayer.schedule_overrides || undefined)
    : null;
  const sessionPlanDayNo = sessionPlanResting?.dayNo ?? null;
  const {
    day: sessionPlanDay, plan: sessionPlan, role: sessionPlanRole,
    resources: sessionPlanResources, resourceOffers: sessionPlanResourceOffers,
  } =
    usePlanDay(sessionPlanId, sessionPlanDayNo, lang, {
      prayerId: currentPrayer?.id, ownerId: currentPrayer?.user_id, planVersion: sessionPlanVersion,
    });

  // Restore an unfinished note if the session reopens on this prayer.
  useEffect(() => {
    if (notesEnabled && currentPrayer) notes.hydrate(currentPrayer.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notesEnabled, currentPrayer?.id]);

  // Closing is the "pause" — anything captured for the current prayer is kept
  // (an in-flight recording is finalised first), but nothing is committed and
  // nothing is marked prayed.
  const handleClose = () => {
    if (notesEnabled && currentPrayer && notes.hasWork(currentPrayer.id)) {
      notes.preserveCurrentPrayerDraft(currentPrayer.id).finally(() => onClose?.());
      return;
    }
    onClose?.();
  };
  useEscapeKey(handleClose);

  // A phone keyboard doesn't shrink the layout viewport on iOS, so a `fixed
  // inset-0` surface keeps its full height and the footer — the Next control —
  // ends up behind the keyboard. Now that the session can hold a writing field,
  // track the VISUAL viewport and shrink to it while the keyboard is up.
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) return undefined;
    const sync = () => {
      const shrunk = window.innerHeight - vv.height > 80; // a keyboard, not browser chrome
      setViewport(shrunk ? { height: vv.height, top: vv.offsetTop } : null);
    };
    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => { vv.removeEventListener('resize', sync); vv.removeEventListener('scroll', sync); };
  }, []);

  // This is a full-screen, transient prayer surface. Keep scroll gestures inside
  // it so reaching the top/bottom cannot chain into the document (or trigger a
  // mobile/PWA pull-to-refresh that remounts the app on Today).
  useEffect(() => {
    const body = document.body;
    const root = document.documentElement;
    const previous = {
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
      rootOverflow: root.style.overflow,
      rootOverscroll: root.style.overscrollBehavior,
    };

    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    root.style.overflow = 'hidden';
    root.style.overscrollBehavior = 'none';

    return () => {
      body.style.overflow = previous.bodyOverflow;
      body.style.overscrollBehavior = previous.bodyOverscroll;
      root.style.overflow = previous.rootOverflow;
      root.style.overscrollBehavior = previous.rootOverscroll;
    };
  }, []);

  // The same scroll container is reused as the session advances. Reset it for
  // each request so a long previous prayer can never leave the next title above
  // the laptop viewport.
  useEffect(() => {
    if (stage === 'requests' && requestScrollRef.current) {
      requestScrollRef.current.scrollTop = 0;
    }
  }, [stage, prayerIndex]);

  // Overall progress across every step of the chosen path (movements + each prayer).
  const stepsIn = (s) => (s === 'requests' ? total : 1);
  const totalSteps = stages.reduce((sum, s) => sum + stepsIn(s), 0);
  const currentStep =
    stages.slice(0, stageIndex).reduce((sum, s) => sum + stepsIn(s), 0) +
    (stage === 'requests' ? prayerIndex + 1 : 1);
  const isLastStep = currentStep >= totalSteps;
  const hasProgress = currentStep > 1 || requestsCompleted > 0;

  // All session entry points share this component. Keep the content-free
  // activation signal here so completion from any surface counts consistently.
  const completeSession = () => {
    markActivationSessionCompleted();
    onComplete?.();
  };

  // Switching format becomes the default for the next session. Before any
  // progress the walk simply restarts in the new shape; once Grace has advanced,
  // the REMAINING session adapts instead — prayers she already prayed are never
  // repeated (the new format's Scripture movements still open it).
  const pickFormat = (m) => {
    localStorage.setItem(MODE_STORAGE_KEY, m);
    setShowFormats(false);
    if (m === mode) return;
    setMode(m);
    if (hasProgress && requestsCompleted >= total && MODE_STAGES[m].length === 1) {
      // Nothing left in a requests-only walk — the session is complete.
      setDone(true);
      completeSession();
      return;
    }
    setStageIndex(0);
    setPrayerIndex(hasProgress && MODE_STAGES[m][0] === 'requests'
      ? Math.min(requestsCompleted, total - 1)
      : 0);
  };

  const chooseAltarOrder = (on) => {
    localStorage.setItem(ORDER_STORAGE_KEY, on ? 'altar' : 'list');
    setAltarPreferred(on);
    if (!hasProgress) setAltarWalk(on);
  };

  // Pure navigation — walk one step forward through the chosen path.
  const advanceStep = () => {
    let completed = requestsCompleted;
    if (stage === 'requests') {
      completed = Math.max(completed, prayerIndex + 1);
      setRequestsCompleted(completed);
      if (prayerIndex + 1 < total) {
        setPrayerIndex(prayerIndex + 1);
        return;
      }
    }
    // Next stage. After a mid-session format change, a requests stage with
    // nothing left is skipped rather than repeating prayers already prayed.
    let next = stageIndex + 1;
    while (next < stages.length && stages[next] === 'requests' && completed >= total) next++;
    if (next < stages.length) {
      setStageIndex(next);
      setPrayerIndex(stages[next] === 'requests' ? Math.min(completed, total - 1) : 0);
    } else {
      setDone(true);
      completeSession();
    }
  };

  // Record each prayer as prayed the moment the user moves PAST it, so leaving a
  // session halfway still keeps the genuine progress already made — once per
  // prayer, however often the walk revisits it.
  const recordAndAdvance = (prayer) => {
    if (prayer && !completedIds.current.has(prayer.id)) {
      completedIds.current.add(prayer.id);
      onPrayed?.(prayer.id);
    }
    advanceStep();
  };

  const commitThenAdvance = async (prayer) => {
    setCommitting(true);
    let result;
    try {
      result = await notes.completeCurrentPrayer(prayer.id);
    } finally {
      setCommitting(false);
    }
    if (!result.ok) { setNoteError(true); return; }
    setNoteError(false);
    recordAndAdvance(prayer);
  };

  // NEXT means "I am finished with this prayer". One operation owns everything
  // that implies, in an order that cannot lose what was captured:
  //   1. finalise an active recording        4. record the completion
  //   2. persist the note draft (encrypted)  5. advance
  //   3. commit/queue it as an update
  // Steps 1–3 resolve as soon as the note is SAFELY held on-device and handed to
  // the durable pipeline; the server round-trip happens afterwards, so a normal
  // Next still feels instantaneous and works offline. Only a failure to persist
  // locally stops the session — advancing then would silently lose the note.
  const advance = () => {
    if (committing) return;
    const prayer = stage === 'requests' ? prayers[prayerIndex] : null;
    // Nothing was captured for this prayer → the walk moves on exactly as it did
    // before this feature existed, in the same tick. Notes cost the people who
    // don't use them nothing at all.
    if (prayer && notesEnabled && notes.hasWork(prayer.id)) {
      commitThenAdvance(prayer);
      return;
    }
    recordAndAdvance(prayer);
  };

  // Step back through the same path `advance` walks forward. Re-entering a
  // supplication stage lands on its LAST prayer, mirroring advance.
  //
  // PREVIOUS PRESERVES; NEXT COMMITS. Going back keeps the current prayer's
  // draft safe on-device (finalising a recording first) but creates no update
  // and marks nothing prayed — the user hasn't finished with it.
  const backStep = () => {
    if (stage === 'requests' && prayerIndex > 0) {
      setPrayerIndex(prayerIndex - 1);
    } else {
      const prevStage = stages[stageIndex - 1];
      setStageIndex(stageIndex - 1);
      setPrayerIndex(prevStage === 'requests' ? total - 1 : 0);
    }
  };

  const back = () => {
    if (committing || currentStep <= 1) return;
    const prayer = stage === 'requests' ? prayers[prayerIndex] : null;
    if (prayer && notesEnabled && notes.hasWork(prayer.id)) {
      (async () => {
        setCommitting(true);
        let result;
        try {
          result = await notes.preserveCurrentPrayerDraft(prayer.id);
        } finally {
          setCommitting(false);
        }
        if (!result.ok) { setNoteError(true); return; }
        setNoteError(false);
        backStep();
      })();
      return;
    }
    backStep();
  };

  // Local persistence failed — the ONE case where the session must not move on.
  // Discarding is offered explicitly and confirmed, because it throws away what
  // the user wrote or recorded.
  const discardNoteAndContinue = () => {
    confirm({
      title: t(lang, 'noteDiscardTitle'),
      message: t(lang, 'noteDiscardMessage'),
      confirmLabel: t(lang, 'noteContinueWithoutSaving'),
      cancelLabel: t(lang, 'cancel'),
      danger: true,
      onConfirm: async () => {
        const prayer = prayers[prayerIndex];
        await notes.discard(prayer.id);
        setNoteError(false);
        if (!completedIds.current.has(prayer.id)) {
          completedIds.current.add(prayer.id);
          onPrayed?.(prayer.id);
        }
        advanceStep();
      },
    });
  };

  const overlay = (children) => (
    <div
      className="prayer-session q-immersive"
      style={viewport ? { top: viewport.top, height: viewport.height, bottom: 'auto' } : undefined}
    >
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label={t(lang, 'prayNow')} tabIndex={-1} className="flex h-full min-h-0 flex-col overflow-hidden focus:outline-none">
        {children}
      </div>
    </div>
  );

  // Closing is the "pause" — progress is already recorded per prayer, so the
  // session can be resumed later with the first unfinished request.
  const closeButton = (
    <button type="button" onClick={handleClose} aria-label={t(lang, 'close')} className="icon-button pressable">
      <X size={20} aria-hidden="true" />
    </button>
  );

  // Single advancing action — "Continue" until the last step, then "Amen". A
  // brief busy state appears only when there is genuinely something to finish
  // (an open microphone, a recording being encrypted); a text note is instant.
  const advanceButton = (
    <PrimaryButton
      onClick={advance}
      disabled={committing}
      className="prayer-session__advance"
    >
      {committing
        ? <span className="inline-flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            {/* Only a recording is slow enough to be worth naming; a written
                note is already saved by the time this could paint. */}
            {noteDraft?.voice ? t(lang, 'noteSavingRecording') : t(lang, 'continueBtn')}
          </span>
        : isLastStep
          ? <span className="inline-flex items-center gap-2"><Check size={16} /> {t(lang, 'amenBtn')}</span>
          : <span className="inline-flex items-center gap-2">{t(lang, 'continueBtn')} <ChevronRight className="rtl-mirror" size={16} /></span>}
    </PrimaryButton>
  );

  // Shown instead of moving on when the note could not be safely stored on this
  // device. Nothing has been lost yet, and nothing is discarded without asking.
  const noteErrorPanel = noteError && (
    <div
      role="alert"
      className="prayer-session__alert"
    >
      <p className="text-sm" style={{ color: 'var(--q-text)' }}>{t(lang, 'noteSaveFailed')}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={advance}
          className="secondary-button pressable"
        >
          {t(lang, 'noteTryAgain')}
        </button>
        <button
          type="button"
          onClick={discardNoteAndContinue}
          className="quiet-button pressable"
        >
          {t(lang, 'noteContinueWithoutSaving')}
        </button>
      </div>
    </div>
  );

  // Footer paired with a Back control, shared by the movement and supplication
  // views. Back hides on the very first step — there is no picker to return to.
  const footer = (
    <div className="prayer-session__footer session-safe-footer">
      {noteErrorPanel}
      <div className="prayer-session__footer-row">
      {currentStep > 1 && (
        <QuietButton
          onClick={back}
          disabled={committing}
          className="prayer-session__back"
        >
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <ChevronLeft className="rtl-mirror" size={16} aria-hidden="true" /> {t(lang, 'backBtn')}
          </span>
        </QuietButton>
      )}
      {advanceButton}
      </div>
    </div>
  );

  // The optional quiet ending (LISTEN). Chosen, never automatic.
  if (done && remaining) {
    return overlay(<RemainWithGod lang={lang} onFinish={handleClose} embedded />);
  }

  if (done) {
    return overlay(
      <div className="prayer-session__done">
        <RiseMark size={56} className="mb-6" />
        <SectionLabel sacred className="mb-3">{t(lang, 'amenBtn')}</SectionLabel>
        {/* An altar walk ends as one: carried before God — never a count of
            circles "completed". */}
        <h2 className="prayer-session__done-title">{altarWalk ? t(lang, 'altarCarriedTitle') : (doneTitle || t(lang, 'sessionDoneTitle'))}</h2>
        <p className="q-meta mt-5">{tp(lang, 'sessionDoneSub', total)}</p>
        {/* Notes were attached to their prayers as the walk went on — this is a
            quiet acknowledgement, never another step to complete. */}
        {notes.savedCount > 0 && (
          <p className="q-meta mt-1.5">{tp(lang, 'notesSavedCount', notes.savedCount)}</p>
        )}
        <div className="prayer-session__done-actions">
          <SecondaryButton onClick={() => setRemaining(true)}>
            {t(lang, 'remainWithGod')}
          </SecondaryButton>
          <PrimaryButton onClick={handleClose}>
            {t(lang, 'remainFinish')}
          </PrimaryButton>
        </div>
      </div>
    );
  }

  // Shared header: overall progress, the format control, and close. The format
  // control is a small, quiet affordance — the session already started, and the
  // deeper paths (guided / ACTS) live one tap beneath it.
  const header = (
    <div className="prayer-session__header">
      <div className="prayer-session__bar">
        {closeButton}
        <div className="prayer-session__tools">
          <PrayerMusicControl lang={lang} active={!done} />
          {allowFormats && (
            <button
              type="button"
              onClick={() => setShowFormats((value) => !value)}
              aria-expanded={showFormats}
              title={t(lang, 'prayerFormat')}
              className="prayer-session__format pressable"
            >
              <span className="prayer-session__format-label">{t(lang, MODE_OPTIONS.find((o) => o.mode === mode).titleKey)}</span>
              <ChevronDown size={14} aria-hidden="true" style={{ transform: showFormats ? 'rotate(180deg)' : 'none', transition: 'transform var(--q-motion-micro) var(--q-ease)' }} />
            </button>
          )}
        </div>
      </div>
      {allowFormats && showFormats && (
        <div className="prayer-session__formats" role="radiogroup" aria-label={t(lang, 'prayerFormat')}>
          {MODE_OPTIONS.map(({ mode: m, titleKey, descKey }) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={m === mode}
              onClick={() => pickFormat(m)}
              className="prayer-session__format-option pressable"
            >
              <span className="prayer-session__format-title">
                {m === mode && <Check size={14} aria-hidden="true" />} {t(lang, titleKey)}
              </span>
              <span className="prayer-session__format-desc">{t(lang, descKey)}</span>
            </button>
          ))}
        </div>
      )}
      {allowFormats && showFormats && altarOffered && (
        <div className="prayer-session__formats prayer-session__altar-order">
          <div className="prayer-session__altar-row">
            <span className="min-w-0">
              <span className="prayer-session__format-title">{t(lang, 'prayThroughAltar')}</span>
              <span className="prayer-session__format-desc">
                {t(lang, altarPreferred === altarWalk ? 'prayThroughAltarDesc' : 'prayThroughAltarNextTime')}
              </span>
            </span>
            <Switch checked={altarPreferred} onChange={chooseAltarOrder} label={t(lang, 'prayThroughAltar')} />
          </div>
        </div>
      )}
      <div className="prayer-session__progress-row">
        <div className="prayer-session__track" aria-hidden="true">
          <span style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
        </div>
        <p className="prayer-session__progress"><span dir="ltr">{currentStep} / {totalSteps}</span></p>
      </div>
    </div>
  );

  // A Scripture movement: a heading, a gentle prompt, and a passage to open.
  if (stage !== 'requests') {
    const meta = MOVEMENT_META[stage];
    const ref = movementPassage(stage, lang);
    return overlay(
      <>
        {header}
        <div className="prayer-session__movement">
          <div key={`movement-${stage}`} className="prayer-session__step">
            <SectionLabel sacred className="mb-4">{t(lang, 'prayerFormat')}</SectionLabel>
            <h2 className="prayer-session__title">{t(lang, meta.titleKey)}</h2>
            <p className="prayer-session__prompt">{t(lang, meta.promptKey)}</p>
            {ref && (
              <VerseAccordion reference={ref} lang={lang}>
                {({ toggle }) => (
                  <button type="button" onClick={toggle} className="prayer-session__passage pressable">
                    <span className="scripture-block__text">{ref}</span>
                    <span className="prayer-session__passage-action"><BookOpen size={14} aria-hidden="true" /> {t(lang, 'readInApp')}</span>
                  </button>
                )}
              </VerseAccordion>
            )}
          </div>
        </div>
        {footer}
      </>
    );
  }

  // Supplication: walk today's actual prayers, one at a time.
  const prayer = prayers[prayerIndex];
  const ids = (prayer.prayer_categories || []).map((pc) => pc.category_id);
  const cats = categories.filter((c) => ids.includes(c.id));
  const circle = circleOf(prayer);
  // On an altar walk, the first prayer of each circle crosses a quiet
  // threshold: the circle's name and its call, then the prayer. No card, no
  // extra step — the walk simply continues. `null` is the unplaced group.
  const threshold = altar?.starts.has(prayerIndex) ? { circle: altar.starts.get(prayerIndex) } : null;
  // Who and where, in one quiet line — never a row of chips. (The threshold
  // already names the circle.)
  const contextLine = [
    circle && !threshold ? t(lang, circleLabelKey(circle)) : '',
    prayer.for_other && prayer.person_name ? t(lang, 'forPersonLabel', { name: prayer.person_name }) : '',
    prayer.origin_group_name || '',
    ...cats.map((c) => tr(c.name, lang)),
  ].filter(Boolean).join(' · ');
  const points = prayer.prayer_points || [];
  const showSupplicationLabel = stages.length > 1; // only in guided / acts paths
  // Guided plan: the day-specific theme + Scripture lead the session, so the
  // walk shows what CHANGES each day (Day 3: "Pray the promises…") instead of
  // the unchanging plan name on every day. Computed for today, matching the
  // detail page; off a plan day (planDayNumber null) it falls back to normal.
  const planContent = sessionPlanDay
    ? { ...sessionPlanDay, n: sessionPlanDayNo, total: sessionPlan?.count || planTotal(prayer.schedule) || '' }
    : null;
  // The most recent meaningful update — the freshest thing to pray from,
  // especially for shared/intercession requests. Older updates stay on the
  // prayer's detail page.
  const updates = prayer.prayer_updates || [];
  const latestUpdate = updates.length > 0
    ? [...updates].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0]
    : null;

  return overlay(
    <>
      {header}
      <div ref={requestScrollRef} className="prayer-session__request">
        <div key={`request-${prayer.id}-${prayerIndex}`} className="prayer-session__step">
          {threshold && (
            <div className="prayer-session__threshold">
              <RiseMark motion="still" size={28} />
              <SectionLabel sacred className="prayer-session__threshold-label">
                {threshold.circle && <CircleGlyph circle={threshold.circle} size={16} selected />}
                <span>{threshold.circle ? t(lang, circleLabelKey(threshold.circle)) : t(lang, 'altarAlsoOnHeart')}</span>
              </SectionLabel>
              {threshold.circle && circleTeaching && (
                <p className="prayer-session__threshold-line">{circleTeaching.circle(threshold.circle).heading}</p>
              )}
            </div>
          )}
          {planContent ? (
            <SectionLabel sacred className="mb-4">
              {t(lang, 'planDayOf', { n: planContent.n, total: planContent.total })} · {planPrayerText(sessionPlan, lang)?.title || tr(prayer.title, lang)}
            </SectionLabel>
          ) : showSupplicationLabel ? (
            <SectionLabel sacred className="mb-4">{t(lang, 'stageSupplication')}</SectionLabel>
          ) : null}
          {contextLine && <p className="prayer-session__context">{contextLine}</p>}

          <h2 className="prayer-session__title">
            {planContent ? pick(planContent.theme, lang) : tr(prayer.title, lang)}
          </h2>

          {/* The day's Scripture — the passage to pray from, tappable to read in place */}
          {planContent?.ref && (() => {
            const planRef = localizeRef(planContent.ref, lang);
            return (
              <VerseAccordion reference={planRef} lang={lang}>
                {({ toggle }) => (
                  <button type="button" onClick={toggle} className="prayer-session__passage pressable mb-8">
                    <span className="scripture-block__text">{planRef}</span>
                    <span className="prayer-session__passage-action"><BookOpen size={14} aria-hidden="true" /> {t(lang, 'readInApp')}</span>
                  </button>
                )}
              </VerseAccordion>
            );
          })()}

          {/* A rich plan day's reflection, prompts, self-prompt, practice and
              "Go deeper" — nothing renders for the simpler plans. */}
          {planContent && (
            <div className="mb-7">
              <PlanDayBody
                day={planContent}
                lang={lang}
                role={sessionPlanRole}
                resources={sessionPlanResources}
                resourceOffers={sessionPlanResourceOffers}
                idPrefix="session-plan-day"
                onAddNote={notesEnabled ? () => setNoteOpenSignal((n) => n + 1) : undefined}
              />
            </div>
          )}

          {/* A plan run’s description is the plan’s unchanging subtitle — it would
              repeat under every single day. The day above is the content. */}
          {!planContent && prayer.description && (
            <RichText text={tr(prayer.description, lang)} className="prayer-session__description" />
          )}

          {/* Freshest news to pray from — one line, never the whole history.
              A note the reader captured in an earlier session is an ordinary update
              by the time it lands here, so without this it came back as "Latest
              update" in news green: their own quiet note, dressed up as something
              that had happened. Named and toned as what it is instead. */}
          {latestUpdate?.text && (() => {
            const ownNote = isSessionNote(latestUpdate.id);
            return (
              <aside className={`prayer-session__update ${ownNote ? 'prayer-session__update--note' : ''}`}>
                <p className="section-label mb-2">{t(lang, ownNote ? 'noteTitle' : 'latestUpdateLabel')}</p>
                <RichText text={tr(latestUpdate.text, lang)} className="text-sm leading-6" style={{ color: 'var(--q-text-secondary)' }} />
              </aside>
            );
          })()}

          {points.length > 0 && (
            <div className="prayer-session__points">
              {points.map((pp, i) => (
                <div key={pp.id || i} className="prayer-session__point">
                  <p className="prayer-session__point-title">{tr(pp.title, lang)}</p>
                  {(pp.verses || []).map((v, vi) => (
                    <SessionVerse key={pp.id ? `${pp.id}-${vi}` : vi} verse={v} lang={lang} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* The optional note: after the request and its Scripture, well clear of
              the primary Continue action, and collapsed until it is asked for. */}
          {notesEnabled && noteDraft && (
            <PrayerSessionNote
              lang={lang}
              prayerId={prayer.id}
              draft={noteDraft}
              recorderRef={notes.recorderRef}
              saving={committing}
              onChangeText={(text) => notes.setText(prayer.id, text)}
              onCaptureVoice={(voice) => notes.setVoice(prayer.id, voice)}
              onDeleteVoice={() => notes.deleteVoice(prayer.id)}
              openSignal={noteOpenSignal}
            />
          )}
        </div>
      </div>

      {footer}
    </>
  );
}
