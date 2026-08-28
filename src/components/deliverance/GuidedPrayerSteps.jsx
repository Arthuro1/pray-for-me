import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { t } from '../../i18n';
import { pick } from '../../content/teaching';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import VersePill from '../shared/VersePill';

// "Guide me in prayer" — one step at a time.
//
// A fifteen-hundred-word renunciation dropped on someone who has never prayed
// a deliverance prayer is not guidance, it is an obstacle. So the assembled
// session (src/lib/freedomSession.js) is walked ONE step at a time: a short
// heading, a short prayer, the passages it leans on, and Back / Next. The reader
// can move backwards to reread, and Pause simply closes — nothing is recorded,
// nothing is lost, and nothing is marked incomplete.
//
// THE TEXT IS NOT SCRIPTURE. Each step's body is Pray4Me guided prayer based on
// Scripture, labelled as such, and visually distinct from the verse pills below
// it — which are the only place authoritative Bible text ever appears.
//
// FUTURE AUDIO ("Listen & pray along" / "Repeat after me") fits this shape
// without changing it: each step is already a discrete, ordered unit with its
// own text and its own natural pause at the step boundary. The text version must
// always remain fully usable on its own, and audio must never be required to
// finish a step, a day or the plan.
export default function GuidedPrayerSteps({ steps, lang, dayTitle, onClose, onFinish }) {
  const [index, setIndex] = useState(0);
  const trapRef = useFocusTrap(true);
  const headingRef = useRef(null);
  useEscapeKey(onClose);

  const total = steps.length;
  const step = steps[index];
  const isLast = index >= total - 1;

  // Move focus to the new step's heading so a screen reader announces the step
  // rather than leaving the reader on a Next button that changed underneath them.
  useEffect(() => { headingRef.current?.focus?.(); }, [index]);

  if (!step) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--bg)' }}
      role="dialog"
      aria-modal="true"
      aria-label={t(lang, 'freedomGuidedSessionLabel')}
      ref={trapRef}
    >
      <header className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBlockEnd: '0.5px solid var(--border)' }}>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
            {dayTitle}
          </p>
          {/* Progress announced politely: a screen-reader user hears "Step 3 of 9"
              on each move without the whole panel being re-read. */}
          <p aria-live="polite" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
            {t(lang, 'freedomStepOf', { n: index + 1, total })}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="pressable flex min-h-11 min-w-11 items-center justify-center rounded-full"
          style={{ color: 'var(--text-3)' }}
          aria-label={t(lang, 'freedomPausePrayer')}
          title={t(lang, 'freedomPausePrayer')}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      <div className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto px-6 py-8 sm:px-10">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="editorial-heading mb-5 text-3xl leading-tight sm:text-4xl"
          style={{ color: 'var(--text-1)' }}
        >
          {t(lang, step.titleKey)}
        </h2>

        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
          {t(lang, 'freedomGuidedPrayerLabel')}
        </p>
        <p className="mb-6 text-lg leading-relaxed" style={{ color: 'var(--text-1)' }}>
          {pick(step.body, lang)}
        </p>

        {step.refs?.length > 0 && (
          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'planRelatedScripture')}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {step.refs.map((ref) => <VersePill key={ref} reference={ref} lang={lang} tone="quiet" />)}
            </div>
          </section>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 px-6 py-4" style={{ borderBlockStart: '0.5px solid var(--border)' }}>
        <button
          type="button"
          onClick={() => setIndex((n) => Math.max(0, n - 1))}
          disabled={index === 0}
          className="pressable flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium disabled:opacity-40"
          style={{ color: 'var(--text-2)' }}
        >
          <ChevronLeft size={15} aria-hidden="true" /> {t(lang, 'backBtn')}
        </button>
        <button
          type="button"
          onClick={() => (isLast ? onFinish?.() : setIndex((n) => n + 1))}
          className="pressable flex min-h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold text-white"
          style={{ background: 'var(--accent)' }}
        >
          {isLast ? t(lang, 'freedomAmenFinish') : t(lang, 'freedomNextStep')}
          {!isLast && <ChevronRight size={15} aria-hidden="true" />}
        </button>
      </footer>
    </div>
  );
}
