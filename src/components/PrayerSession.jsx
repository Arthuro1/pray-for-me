import { useState } from 'react';
import { X, Check, ChevronRight, ChevronLeft, ChevronDown, BookOpen } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLocalizedVerse } from '../hooks/useLocalizedVerse';
import { movementPassage } from '../lib/prayerMovements';
import Encouragement from './shared/Encouragement';
import VerseAccordion from './VerseAccordion';

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
    <div className="mt-2 pl-3" style={{ borderLeft: '2px solid var(--accent-border)' }}>
      {text && <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-2)' }}>"{text}"</p>}
      {ref && (
        <VerseAccordion reference={ref} lang={lang} initialText={text}>
          {({ toggle }) => (
            <button
              onClick={toggle}
              title={t(lang, 'readInApp')}
              className="text-xs mt-1 flex items-center gap-1"
              style={{ color: 'var(--accent)' }}
            >
              <BookOpen size={11} /> {ref}
            </button>
          )}
        </VerseAccordion>
      )}
    </div>
  );
}

export default function PrayerSession({ prayers, categories, lang, tr, onClose, onComplete, onPrayed }) {
  const [mode, setMode] = useState(initialMode);
  const [stageIndex, setStageIndex] = useState(0);
  const [prayerIndex, setPrayerIndex] = useState(0);
  // How many requests have been prayed THIS session (advanced past). Switching
  // format mid-session resumes the requests from here instead of repeating them.
  const [requestsCompleted, setRequestsCompleted] = useState(0);
  const [done, setDone] = useState(false);
  const [showFormats, setShowFormats] = useState(false);
  const trapRef = useFocusTrap(true);
  useEscapeKey(onClose);

  const stages = MODE_STAGES[mode];
  const stage = stages[stageIndex];
  const total = prayers.length;

  // Overall progress across every step of the chosen path (movements + each prayer).
  const stepsIn = (s) => (s === 'requests' ? total : 1);
  const totalSteps = stages.reduce((sum, s) => sum + stepsIn(s), 0);
  const currentStep =
    stages.slice(0, stageIndex).reduce((sum, s) => sum + stepsIn(s), 0) +
    (stage === 'requests' ? prayerIndex + 1 : 1);
  const isLastStep = currentStep >= totalSteps;

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
      onComplete?.();
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
      onComplete?.();
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
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: 'var(--bg)' }}>
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label={t(lang, 'prayNow')} tabIndex={-1} className="flex flex-col h-full focus:outline-none">
        {children}
      </div>
    </div>
  );

  // Closing is the "pause" — progress is already recorded per prayer, so the
  // session can be resumed later with the first unfinished request.
  const closeButton = (
    <button onClick={onClose} aria-label={t(lang, 'close')} className="w-11 h-11 flex items-center justify-center rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
      <X size={16} />
    </button>
  );

  // Single advancing action — "Continue" until the last step, then "Amen".
  const advanceButton = (
    <button
      onClick={advance}
      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white"
      style={{ background: 'var(--accent)' }}
    >
      {isLastStep ? <><Check size={16} /> {t(lang, 'amenBtn')}</> : <>{t(lang, 'continueBtn')} <ChevronRight size={16} /></>}
    </button>
  );

  // Footer paired with a Back control, shared by the movement and supplication
  // views. Back hides on the very first step — there is no picker to return to.
  const footer = (
    <div className="shrink-0 px-6 py-4 flex items-center gap-3 max-w-xl mx-auto w-full" style={{ borderTop: '0.5px solid var(--border)' }}>
      {currentStep > 1 && (
        <button
          onClick={back}
          className="flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-2)' }}
        >
          <ChevronLeft size={16} /> {t(lang, 'backBtn')}
        </button>
      )}
      {advanceButton}
    </div>
  );

  if (done) {
    return overlay(
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-3">
        <div className="text-6xl mb-1">🙏</div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'sessionDoneTitle')}</h2>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t(lang, 'sessionDoneSub', { n: total })}</p>
        <Encouragement lang={lang} className="max-w-xs" />
        <button
          onClick={onClose}
          className="mt-4 px-6 py-3 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          {t(lang, 'close')}
        </button>
      </div>
    );
  }

  // Shared header: overall progress, the format control, and close. The format
  // control is a small, quiet affordance — the session already started, and the
  // deeper paths (guided / ACTS) live one tap beneath it.
  const header = (
    <div className="shrink-0 px-5 pt-4 pb-3" style={{ background: 'var(--header)' }}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {currentStep} / {totalSteps}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFormats((v) => !v)}
            aria-expanded={showFormats}
            title={t(lang, 'prayerFormat')}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full font-medium"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
          >
            {t(lang, MODE_OPTIONS.find((o) => o.mode === mode).titleKey)}
            <ChevronDown size={12} style={{ transform: showFormats ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>
          {closeButton}
        </div>
      </div>
      {showFormats && (
        <div className="rounded-2xl p-1.5 mb-3 space-y-1" style={{ background: 'rgba(255,255,255,0.1)' }} role="radiogroup" aria-label={t(lang, 'prayerFormat')}>
          {MODE_OPTIONS.map(({ mode: m, titleKey, descKey }) => (
            <button
              key={m}
              role="radio"
              aria-checked={m === mode}
              onClick={() => pickFormat(m)}
              className="w-full text-left rounded-xl px-3 py-2"
              style={m === mode ? { background: 'rgba(255,255,255,0.2)' } : {}}
            >
              <p className="text-xs font-semibold flex items-center gap-1.5 text-white">
                {m === mode && <Check size={12} />} {t(lang, titleKey)}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{t(lang, descKey)}</p>
            </button>
          ))}
        </div>
      )}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(currentStep / totalSteps) * 100}%`, background: '#fff' }} />
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
        <div className="flex-1 overflow-y-auto px-6 py-8 max-w-xl mx-auto w-full">
          <div className="text-4xl mb-3">{meta.emoji}</div>
          <h2 className="text-2xl font-semibold leading-snug mb-3" style={{ color: 'var(--text-1)' }}>{t(lang, meta.titleKey)}</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-2)' }}>{t(lang, meta.promptKey)}</p>
          {ref && (
            <VerseAccordion reference={ref} lang={lang}>
              {({ toggle }) => (
                <button
                  onClick={toggle}
                  className="w-full flex items-center justify-between gap-3 rounded-2xl p-4 text-left"
                  style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
                >
                  <span className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                    <BookOpen size={15} style={{ color: 'var(--accent)' }} /> {ref}
                  </span>
                  <span className="text-xs shrink-0" style={{ color: 'var(--accent)' }}>{t(lang, 'readInApp')}</span>
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
      <div className="flex-1 overflow-y-auto px-6 py-7 max-w-xl mx-auto w-full">
        {showSupplicationLabel && (
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>
            🤲 {t(lang, 'stageSupplication')}
          </p>
        )}
        {(cats.length > 0 || (prayer.for_other && prayer.person_name) || prayer.origin_group_name) && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {cats.map((c) => (
              <span key={c.id} className="text-xs px-3 py-1 rounded-full font-medium text-white" style={{ backgroundColor: c.color }}>
                {c.emoji} {tr(c.name, lang)}
              </span>
            ))}
            {prayer.for_other && prayer.person_name && (
              <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
                👤 {prayer.person_name}
              </span>
            )}
            {/* Source label — which group this shared request came from */}
            {prayer.origin_group_name && (
              <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
                👥 {prayer.origin_group_name}
              </span>
            )}
          </div>
        )}

        <h2 className="text-2xl font-semibold leading-snug mb-3" style={{ color: 'var(--text-1)' }}>{tr(prayer.title, lang)}</h2>

        {prayer.description && (
          <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-2)' }}>{tr(prayer.description, lang)}</p>
        )}

        {/* Freshest news to pray from — one line, never the whole history */}
        {latestUpdate?.text && (
          <div className="rounded-2xl p-3.5 mb-5" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'latestUpdateLabel')}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{tr(latestUpdate.text, lang)}</p>
          </div>
        )}

        {points.length > 0 && (
          <div className="space-y-3">
            {points.map((pp, i) => (
              <div key={pp.id || i} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{tr(pp.title, lang)}</p>
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
