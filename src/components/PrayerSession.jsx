import { useEffect, useRef, useState } from 'react';
import { X, Check, ChevronRight, ChevronLeft, ChevronDown, BookOpen } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLocalizedVerse } from '../hooks/useLocalizedVerse';
import { movementPassage } from '../lib/prayerMovements';
import { markActivationSessionCompleted } from '../lib/activationProgress';
import Encouragement from './shared/Encouragement';
import VerseAccordion from './VerseAccordion';
import RichText from './rich/RichText';
import { PrimaryButton, QuietButton, SectionLabel, StatusPill } from './shared/Primitives';

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
  adoration: { emoji: '🙌', titleKey: 'stageAdoration', promptKey: 'stageAdorationPrompt' },
  confession: { emoji: '🕊️', titleKey: 'stageConfession', promptKey: 'stageConfessionPrompt' },
  thanksgiving: { emoji: '🙏', titleKey: 'stageThanksgiving', promptKey: 'stageThanksgivingPrompt' },
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
      {text && <p className="scripture-text text-lg leading-relaxed" style={{ color: 'var(--text-1)' }}>“{text}”</p>}
      {ref && (
        <VerseAccordion reference={ref} lang={lang} initialText={text}>
          {({ toggle }) => (
            <button
              onClick={toggle}
              title={t(lang, 'readInApp')}
              className="pressable mt-2 flex min-h-11 items-center gap-1.5 text-xs font-semibold"
              style={{ color: 'var(--gold)' }}
            >
              <BookOpen size={11} /> {ref}
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
export default function PrayerSession({ prayers, categories, lang, tr, onClose, onComplete, onPrayed, allowFormats = true }) {
  const [mode, setMode] = useState(() => (allowFormats ? initialMode() : 'requests'));
  const [stageIndex, setStageIndex] = useState(0);
  const [prayerIndex, setPrayerIndex] = useState(0);
  // How many requests have been prayed THIS session (advanced past). Switching
  // format mid-session resumes the requests from here instead of repeating them.
  const [requestsCompleted, setRequestsCompleted] = useState(0);
  const [done, setDone] = useState(false);
  const [showFormats, setShowFormats] = useState(false);
  const requestScrollRef = useRef(null);
  const trapRef = useFocusTrap(true);
  useEscapeKey(onClose);

  const stages = MODE_STAGES[mode];
  const stage = stages[stageIndex];
  const total = prayers.length;

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
    const hasProgress = currentStep > 1 || requestsCompleted > 0;
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

  const advance = () => {
    // Record each prayer as prayed the moment the user moves PAST it, so leaving
    // a session halfway still keeps the genuine progress already made.
    let completed = requestsCompleted;
    if (stage === 'requests') {
      onPrayed?.(prayers[prayerIndex].id);
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

  // Step back through the same path `advance` walks forward. Re-entering a
  // supplication stage lands on its LAST prayer, mirroring advance.
  const back = () => {
    if (currentStep <= 1) {
      return;
    } else if (stage === 'requests' && prayerIndex > 0) {
      setPrayerIndex(prayerIndex - 1);
    } else {
      const prevStage = stages[stageIndex - 1];
      setStageIndex(stageIndex - 1);
      setPrayerIndex(prevStage === 'requests' ? total - 1 : 0);
    }
  };

  const overlay = (children) => (
    <div
      className="prayer-session constellation-session fixed inset-0 z-[70] flex flex-col"
      style={{ background: 'var(--background)' }}
    >
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label={t(lang, 'prayNow')} tabIndex={-1} className="flex flex-col h-full focus:outline-none">
        {children}
      </div>
    </div>
  );

  // Closing is the "pause" — progress is already recorded per prayer, so the
  // session can be resumed later with the first unfinished request.
  const closeButton = (
    <button onClick={onClose} aria-label={t(lang, 'close')} className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,.82)', border: '1px solid rgba(255,255,255,.1)' }}>
      <X size={16} />
    </button>
  );

  // Single advancing action — "Continue" until the last step, then "Amen".
  const advanceButton = (
    <PrimaryButton
      onClick={advance}
      className="min-h-[52px] flex-1"
    >
      {isLastStep
        ? <span className="inline-flex items-center gap-2"><Check size={16} /> {t(lang, 'amenBtn')}</span>
        : <span className="inline-flex items-center gap-2">{t(lang, 'continueBtn')} <ChevronRight className="rtl-mirror" size={16} /></span>}
    </PrimaryButton>
  );

  // Footer paired with a Back control, shared by the movement and supplication
  // views. Back hides on the very first step — there is no picker to return to.
  const footer = (
    <div className="constellation-session__footer session-safe-footer shrink-0 px-5 pt-3 flex items-center gap-3 w-full">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
      {currentStep > 1 && (
        <QuietButton
          onClick={back}
          className="min-h-[52px] shrink-0"
        >
          <ChevronLeft className="rtl-mirror" size={16} /> {t(lang, 'backBtn')}
        </QuietButton>
      )}
      {advanceButton}
      </div>
    </div>
  );

  if (done) {
    return overlay(
      <div className="constellation-session__done flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--sage-soft)', color: 'var(--success)', border: '1px solid var(--success-border)' }}>
          <Check size={22} strokeWidth={1.7} aria-hidden="true" />
        </div>
        <SectionLabel className="mb-3">Amen</SectionLabel>
        <h2 className="editorial-heading max-w-lg text-3xl leading-tight sm:text-4xl" style={{ color: 'var(--text-1)' }}>{t(lang, 'sessionDoneTitle')}</h2>
        <Encouragement lang={lang} className="mt-4 max-w-sm text-sm" />
        <p className="mt-5 text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'sessionDoneSub', { n: total })}</p>
        <PrimaryButton onClick={onClose} className="mt-9 min-w-36">
          {t(lang, 'close')}
        </PrimaryButton>
      </div>
    );
  }

  // Shared header: overall progress, the format control, and close. The format
  // control is a small, quiet affordance — the session already started, and the
  // deeper paths (guided / ACTS) live one tap beneath it.
  const header = (
    <div className="constellation-session__header shrink-0 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3" style={{ background: 'var(--plum-deep)' }}>
      <div className="mx-auto mb-3 flex max-w-2xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[.18em]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span>Pray4Me · </span><span>{currentStep} / {totalSteps}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {allowFormats && (
            <button
              onClick={() => setShowFormats((v) => !v)}
              aria-expanded={showFormats}
              title={t(lang, 'prayerFormat')}
              className="pressable flex min-h-11 items-center gap-1 rounded-full px-3 text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,.82)', border: '1px solid rgba(255,255,255,.1)' }}
            >
              {t(lang, MODE_OPTIONS.find((o) => o.mode === mode).titleKey)}
              <ChevronDown size={12} style={{ transform: showFormats ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
          )}
          {closeButton}
        </div>
      </div>
      {allowFormats && showFormats && (
        <div className="mx-auto mb-3 max-w-2xl space-y-1 rounded-xl p-1.5" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,.09)' }} role="radiogroup" aria-label={t(lang, 'prayerFormat')}>
          {MODE_OPTIONS.map(({ mode: m, titleKey, descKey }) => (
            <button
              key={m}
              role="radio"
              aria-checked={m === mode}
              onClick={() => pickFormat(m)}
              className="pressable min-h-11 w-full rounded-lg px-3 py-2 text-left"
              style={m === mode ? { background: 'rgba(255,255,255,0.12)' } : {}}
            >
              <p className="text-xs font-semibold flex items-center gap-1.5 text-white">
                {m === mode && <Check size={12} />} {t(lang, titleKey)}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{t(lang, descKey)}</p>
            </button>
          ))}
        </div>
      )}
      <div className="mx-auto h-px max-w-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.14)' }}>
        <div className="h-full transition-all" style={{ width: `${(currentStep / totalSteps) * 100}%`, background: 'var(--gold)', transitionDuration: 'var(--motion)' }} />
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
        <div className="constellation-session__movement mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center overflow-y-auto px-6 py-10 sm:px-10">
          <div className="mb-5 text-3xl" aria-hidden="true">{meta.emoji}</div>
          <SectionLabel className="mb-3">{t(lang, 'prayerFormat')}</SectionLabel>
          <h2 className="editorial-heading mb-4 text-4xl leading-tight sm:text-5xl" style={{ color: 'var(--text-1)' }}>{t(lang, meta.titleKey)}</h2>
          <p className="mb-9 max-w-xl text-base leading-8" style={{ color: 'var(--text-2)' }}>{t(lang, meta.promptKey)}</p>
          {ref && (
            <VerseAccordion reference={ref} lang={lang}>
              {({ toggle }) => (
                <button
                  onClick={toggle}
                  className="scripture-block pressable flex min-h-16 w-full items-center justify-between gap-3 text-left"
                >
                  <span className="scripture-text flex items-center gap-2 text-lg" style={{ color: 'var(--text-1)' }}>
                    <BookOpen size={16} style={{ color: 'var(--gold)' }} /> {ref}
                  </span>
                  <span className="shrink-0 text-xs font-semibold" style={{ color: 'var(--gold)' }}>{t(lang, 'readInApp')}</span>
                </button>
              )}
            </VerseAccordion>
          )}
        </div>
        {footer}
      </>
    );
  }

  // Supplication: walk today's actual prayers, one at a time.
  const prayer = prayers[prayerIndex];
  const ids = (prayer.prayer_categories || []).map((pc) => pc.category_id);
  const cats = categories.filter((c) => ids.includes(c.id));
  const points = prayer.prayer_points || [];
  const showSupplicationLabel = stages.length > 1; // only in guided / acts paths
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
      <div
        ref={requestScrollRef}
        className="constellation-session__request mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto px-6 py-9 sm:px-10 sm:py-12"
      >
        {showSupplicationLabel && (
          <SectionLabel className="mb-4">{t(lang, 'stageSupplication')}</SectionLabel>
        )}
        {(cats.length > 0 || (prayer.for_other && prayer.person_name) || prayer.origin_group_name) && (
          <div className="mb-5 flex flex-wrap gap-1.5">
            {cats.map((c) => (
              <StatusPill key={c.id} style={{ borderColor: c.color }}>
                {c.emoji} {tr(c.name, lang)}
              </StatusPill>
            ))}
            {prayer.for_other && prayer.person_name && (
              <StatusPill>👤 {prayer.person_name}</StatusPill>
            )}
            {/* Source label — which group this shared request came from */}
            {prayer.origin_group_name && (
              <StatusPill>👥 {prayer.origin_group_name}</StatusPill>
            )}
          </div>
        )}

        <h2 className="constellation-session__title editorial-heading mb-5 text-4xl leading-[1.12] sm:text-5xl" style={{ color: 'var(--text-1)' }}>{tr(prayer.title, lang)}</h2>

        {prayer.description && (
          <RichText text={tr(prayer.description, lang)} className="mb-7 text-base leading-7" style={{ color: 'var(--text-2)' }} />
        )}

        {/* Freshest news to pray from — one line, never the whole history */}
        {latestUpdate?.text && (
          <aside className="mb-8 border-inline-start-2 py-1 ps-4" style={{ borderColor: 'var(--sage)' }}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em]" style={{ color: 'var(--success)' }}>
              {t(lang, 'latestUpdateLabel')}
            </p>
            <RichText text={tr(latestUpdate.text, lang)} className="text-sm leading-6" style={{ color: 'var(--text-2)' }} />
          </aside>
        )}

        {points.length > 0 && (
          <div className="border-block-start" style={{ borderColor: 'var(--border)' }}>
            {points.map((pp, i) => (
              <div key={pp.id || i} className="py-6" style={{ borderBlockEnd: '1px solid var(--border)' }}>
                <p className="text-base font-semibold leading-7" style={{ color: 'var(--text-1)' }}>{tr(pp.title, lang)}</p>
                {(pp.verses || []).map((v, vi) => (
                  <SessionVerse key={pp.id ? `${pp.id}-${vi}` : vi} verse={v} lang={lang} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {footer}
    </>
  );
}
