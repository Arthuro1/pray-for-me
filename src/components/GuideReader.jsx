import { useState } from 'react';
import { X, Check, ChevronRight, BookOpen } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { pick, localizeRef } from '../content/teaching';
import VerseModal from './VerseModal';

// A pray-through reader for a prayer guide: an intro, then one step at a time.
// Each step gives a heading and a gentle prompt, and (usually) points to a
// passage to OPEN in the user's own Bible — we never put our words in place of
// God's. The user prays each step themselves; this only paces and guides them.
export default function GuideReader({ guide, lang, onClose }) {
  // index -1 = intro screen; 0..n-1 = steps; n = done
  const [index, setIndex] = useState(-1);
  const [openVerse, setOpenVerse] = useState(null); // a passage tapped to read in-app
  const trapRef = useFocusTrap(true);
  useEscapeKey(onClose);

  const steps = guide.steps || [];
  const total = steps.length;
  const onIntro = index === -1;
  const done = index >= total;
  const step = !onIntro && !done ? steps[index] : null;
  const isLastStep = index === total - 1;

  const advance = () => setIndex((i) => i + 1);

  const overlay = (children) => (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: 'var(--bg)' }}>
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label={pick(guide.title, lang)} tabIndex={-1} className="flex flex-col h-full focus:outline-none">
        {children}
      </div>
    </div>
  );

  const closeButton = (
    <button onClick={onClose} aria-label={t(lang, 'close')} className="w-8 h-8 flex items-center justify-center rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
      <X size={16} />
    </button>
  );

  const advanceButton = (label, last) => (
    <button
      onClick={advance}
      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white"
      style={{ background: 'var(--accent)' }}
    >
      {last ? <><Check size={16} /> {t(lang, 'amenBtn')}</> : <>{label} <ChevronRight size={16} /></>}
    </button>
  );

  // Intro: name the guide and its biblical purpose before praying.
  if (onIntro) {
    return overlay(
      <>
        <div className="shrink-0 px-5 pt-4 flex justify-end">{closeButton}</div>
        <div className="flex-1 overflow-y-auto px-6 pb-8 max-w-xl mx-auto w-full">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{guide.emoji}</div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-1)' }}>{pick(guide.title, lang)}</h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{pick(guide.intro, lang)}</p>
        </div>
        <div className="shrink-0 px-6 py-4 flex items-center gap-3 max-w-xl mx-auto w-full" style={{ borderTop: '0.5px solid var(--border)' }}>
          {advanceButton(t(lang, 'guideBegin'), false)}
        </div>
      </>
    );
  }

  if (done) {
    return overlay(
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-3">
        <div className="text-6xl mb-1">🙏</div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'guideDoneTitle')}</h2>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t(lang, 'guideDoneSub')}</p>
        <button onClick={onClose} className="mt-4 px-6 py-3 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--accent)' }}>
          {t(lang, 'close')}
        </button>
      </div>
    );
  }

  const ref = step.passage ? localizeRef(step.passage, lang) : null;

  return overlay(
    <>
      <div className="shrink-0 px-5 pt-4 pb-3" style={{ background: 'var(--header)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {index + 1} / {total}
          </span>
          {closeButton}
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((index + 1) / total) * 100}%`, background: '#fff' }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-xl mx-auto w-full">
        <h2 className="text-2xl font-semibold leading-snug mb-3" style={{ color: 'var(--text-1)' }}>{pick(step.title, lang)}</h2>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-2)' }}>{pick(step.prompt, lang)}</p>
        {ref && (
          <button
            onClick={() => setOpenVerse(ref)}
            className="w-full flex items-center justify-between gap-3 rounded-2xl p-4"
            style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
          >
            <span className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
              <BookOpen size={15} style={{ color: 'var(--accent)' }} /> {ref}
            </span>
            <span className="text-xs shrink-0" style={{ color: 'var(--accent)' }}>{t(lang, 'readFullPassage')}</span>
          </button>
        )}
      </div>

      <div className="shrink-0 px-6 py-4 flex items-center gap-3 max-w-xl mx-auto w-full" style={{ borderTop: '0.5px solid var(--border)' }}>
        {advanceButton(t(lang, 'continueBtn'), isLastStep)}
      </div>

      {openVerse && (
        <VerseModal reference={openVerse} lang={lang} onClose={() => setOpenVerse(null)} />
      )}
    </>
  );
}
