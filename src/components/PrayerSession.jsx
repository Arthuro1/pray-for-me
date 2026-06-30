import { useState } from 'react';
import { X, Check, ChevronRight, BookOpen } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { bibleLink } from '../utils/bibleLink';
import { movementPassage } from '../lib/prayerMovements';

// "Pray now" meets the user where they are, then gently invites them deeper:
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
  { mode: 'requests', titleKey: 'modeRequests', descKey: 'modeRequestsDesc', primary: true },
  { mode: 'guided', titleKey: 'modeGuided', descKey: 'modeGuidedDesc' },
  { mode: 'acts', titleKey: 'modeActs', descKey: 'modeActsDesc' },
];

export default function PrayerSession({ prayers, categories, lang, tr, onClose, onComplete }) {
  const [mode, setMode] = useState(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [prayerIndex, setPrayerIndex] = useState(0);
  const [done, setDone] = useState(false);
  const trapRef = useFocusTrap(true);
  useEscapeKey(onClose);

  const stages = mode ? MODE_STAGES[mode] : [];
  const stage = stages[stageIndex];
  const total = prayers.length;

  // Overall progress across every step of the chosen path (movements + each prayer).
  const stepsIn = (s) => (s === 'requests' ? total : 1);
  const totalSteps = stages.reduce((sum, s) => sum + stepsIn(s), 0);
  const currentStep =
    stages.slice(0, stageIndex).reduce((sum, s) => sum + stepsIn(s), 0) +
    (stage === 'requests' ? prayerIndex + 1 : 1);
  const isLastStep = currentStep >= totalSteps;

  const advance = () => {
    if (stage === 'requests' && prayerIndex + 1 < total) {
      setPrayerIndex(prayerIndex + 1);
    } else if (stageIndex + 1 < stages.length) {
      setStageIndex(stageIndex + 1);
      setPrayerIndex(0);
    } else {
      setDone(true);
      onComplete?.();
    }
  };

  const overlay = (children) => (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: 'var(--bg)' }}>
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label={t(lang, 'prayNow')} tabIndex={-1} className="flex flex-col h-full focus:outline-none">
        {children}
      </div>
    </div>
  );

  const closeButton = (
    <button onClick={onClose} aria-label={t(lang, 'close')} className="w-8 h-8 flex items-center justify-center rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
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

  // Entry: receive the burden first, then gently offer the deeper paths.
  if (!mode) {
    return overlay(
      <>
        <div className="shrink-0 px-5 pt-4 flex justify-end">{closeButton}</div>
        <div className="flex-1 overflow-y-auto px-6 pb-8 max-w-xl mx-auto w-full">
          <div className="text-center mb-7">
            <div className="text-5xl mb-3">🙏</div>
            <h2 className="text-xl font-semibold mb-1.5" style={{ color: 'var(--text-1)' }}>{t(lang, 'prayNowIntroTitle')}</h2>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t(lang, 'prayNowIntroSub', { n: total })}</p>
          </div>
          <div className="space-y-3">
            {MODE_OPTIONS.map(({ mode: m, titleKey, descKey, primary }) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="w-full text-left rounded-2xl px-4 py-3.5"
                style={primary
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-1)' }}
              >
                <p className="text-sm font-semibold flex items-center justify-between gap-2">
                  {t(lang, titleKey)} <ChevronRight size={16} className="shrink-0 opacity-70" />
                </p>
                <p className="text-xs mt-0.5" style={{ color: primary ? 'rgba(255,255,255,0.85)' : 'var(--text-3)' }}>
                  {t(lang, descKey)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (done) {
    return overlay(
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-3">
        <div className="text-6xl mb-1">🙏</div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'sessionDoneTitle')}</h2>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t(lang, 'sessionDoneSub', { n: total })}</p>
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

  // Shared header: overall progress + close.
  const header = (
    <div className="shrink-0 px-5 pt-4 pb-3" style={{ background: 'var(--header)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {currentStep} / {totalSteps}
        </span>
        {closeButton}
      </div>
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
            <a
              href={bibleLink(ref)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-2xl p-4"
              style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
            >
              <span className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                <BookOpen size={15} style={{ color: 'var(--accent)' }} /> {ref}
              </span>
              <span className="text-xs shrink-0" style={{ color: 'var(--accent)' }}>{t(lang, 'readWholeChapter')}</span>
            </a>
          )}
        </div>
        <div className="shrink-0 px-6 py-4 flex items-center gap-3 max-w-xl mx-auto w-full" style={{ borderTop: '0.5px solid var(--border)' }}>
          {advanceButton}
        </div>
      </>
    );
  }

  // Supplication: walk today's actual prayers, one at a time.
  const prayer = prayers[prayerIndex];
  const ids = (prayer.prayer_categories || []).map((pc) => pc.category_id);
  const cats = categories.filter((c) => ids.includes(c.id));
  const points = prayer.prayer_points || [];
  const showSupplicationLabel = stages.length > 1; // only in guided / acts paths

  return overlay(
    <>
      {header}
      <div className="flex-1 overflow-y-auto px-6 py-7 max-w-xl mx-auto w-full">
        {showSupplicationLabel && (
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>
            🤲 {t(lang, 'stageSupplication')}
          </p>
        )}
        {(cats.length > 0 || (prayer.for_other && prayer.person_name)) && (
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
          </div>
        )}

        <h2 className="text-2xl font-semibold leading-snug mb-3" style={{ color: 'var(--text-1)' }}>{tr(prayer.title, lang)}</h2>

        {prayer.description && (
          <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-2)' }}>{tr(prayer.description, lang)}</p>
        )}

        {points.length > 0 && (
          <div className="space-y-3">
            {points.map((pp, i) => (
              <div key={pp.id || i} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{tr(pp.title, lang)}</p>
                {(pp.verses || []).map((v, vi) => (
                  <div key={vi} className="mt-2 pl-3" style={{ borderLeft: '2px solid var(--accent-border)' }}>
                    {v.text && <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-2)' }}>"{v.text}"</p>}
                    {v.ref && (
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                        <BookOpen size={11} /> {v.ref}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 px-6 py-4 flex items-center gap-3 max-w-xl mx-auto w-full" style={{ borderTop: '0.5px solid var(--border)' }}>
        {advanceButton}
      </div>
    </>
  );
}
