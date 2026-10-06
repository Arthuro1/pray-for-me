import { useState } from 'react';
import { X, Check, ChevronLeft, ChevronDown, BookOpen } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { pick, localizeRef } from '../content/teaching';
import { guideDurationMinutes } from '../lib/guideMeta';
import VerseAccordion from './VerseAccordion';
import ReportWordingLink from './ReportWordingLink';
import RiseMark from './shared/RiseMark';
import { PrimaryButton, SecondaryButton } from './shared/Primitives';

// Back points the reading direction's way.
function BackChevron(props) {
  return <ChevronLeft className="rtl-mirror" {...props} />;
}

// A pray-through reader for a prayer guide: an intro, then one step at a time.
// Each step gives a heading and a gentle prompt, and (usually) points to a
// passage to OPEN in the user's own Bible — we never put our words in place of
// God's. The user prays each step themselves; this only paces and guides them.
export default function GuideReader({ guide, lang, onClose, onStarted, onCompleted }) {
  // index -1 = intro screen; 0..n-1 = steps; n = done
  const [index, setIndex] = useState(-1);
  // "Why this step?" disclosure — collapsed on every new step.
  const [whyOpen, setWhyOpen] = useState(false);
  const trapRef = useFocusTrap(true);
  useEscapeKey(onClose);

  const steps = guide.steps || [];
  const total = steps.length;
  const onIntro = index === -1;
  const done = index >= total;
  const step = !onIntro && !done ? steps[index] : null;
  const isLastStep = index === total - 1;
  const duration = guideDurationMinutes(guide);

  // Progress signals for the Grow path: begun past the intro, completed on the
  // final Amen. Both callbacks are optional and content-free.
  const advance = () => {
    if (onIntro) onStarted?.(guide.id);
    if (index === total - 1) onCompleted?.(guide.id);
    setWhyOpen(false);
    setIndex(index + 1);
  };
  // Step back to the previous slide — from the first step this returns to the
  // intro so the whole guide stays re-readable in either direction.
  const back = () => { setWhyOpen(false); setIndex((i) => i - 1); };

  // The same deep-violet place to pray as the prayer session: a guide is
  // prayed through, not read past.
  const overlay = (children) => (
    <div className="reader q-immersive">
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label={pick(guide.title, lang)} tabIndex={-1} className="reader__dialog">
        {children}
      </div>
    </div>
  );

  const closeButton = (
    <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 shrink-0">
      <X size={20} aria-hidden="true" />
    </button>
  );

  const advanceButton = (label, last) => (
    <PrimaryButton onClick={advance} icon={last ? Check : undefined}>
      {last ? t(lang, 'amenBtn') : label}
    </PrimaryButton>
  );

  const backButton = (
    <SecondaryButton onClick={back} icon={BackChevron}>{t(lang, 'backBtn')}</SecondaryButton>
  );

  // Intro: name the guide and its biblical purpose before praying.
  if (onIntro) {
    return overlay(
      <>
        <div className="reader__bar"><div className="reader__bar-row"><span />{closeButton}</div></div>
        <div className="reader__scroll">
          <div className="reader__page">
            <RiseMark motion="still" size={44} />
            <h2 className="reader__title mt-6">{pick(guide.title, lang)}</h2>
            {duration && <p className="reader__meta">{t(lang, 'aboutMinutes', { n: duration })}</p>}
            <p className="reader__lede">{pick(guide.intro, lang)}</p>
          </div>
        </div>
        <div className="reader__footer">
          <div className="reader__footer-row">{advanceButton(t(lang, 'guideBegin'), false)}</div>
        </div>
      </>
    );
  }

  if (done) {
    return overlay(
      <div className="reader__scroll">
        <div className="reader__done" role="status">
          <RiseMark size={56} />
          <p className="reader__done-title">{t(lang, 'guideDoneTitle')}</p>
          <p className="reader__lede mt-0">{t(lang, 'guideDoneSub')}</p>
          <PrimaryButton onClick={onClose} className="mt-6 min-w-40">{t(lang, 'remainFinish')}</PrimaryButton>
          <ReportWordingLink lang={lang} surface={`guides/${guide.id}`} />
        </div>
      </div>
    );
  }

  const ref = step.passage ? localizeRef(step.passage, lang) : null;

  return overlay(
    <>
      <div className="reader__bar">
        <div className="reader__bar-row"><span />{closeButton}</div>
        <div className="reader__progress-row">
          <span className="reader__track" aria-hidden="true"><span style={{ width: `${((index + 1) / total) * 100}%` }} /></span>
          <p className="reader__progress"><span dir="ltr">{index + 1} / {total}</span></p>
        </div>
      </div>

      <div className="reader__scroll">
        <div className="reader__page" key={index}>
          <h2 className="reader__title">{pick(step.title, lang)}</h2>
          <p className="reader__lede mb-6">{pick(step.prompt, lang)}</p>

          {/* Optional authored "why this step" — a collapsed one-liner that never
              blocks Continue and simply doesn't exist for unexplained steps.
              Scripture below stays its own separate expandable. */}
          {step.why && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setWhyOpen((v) => !v)}
                aria-expanded={whyOpen}
                aria-controls="guide-step-why"
                className="quiet-button pressable -ms-3"
              >
                <ChevronDown size={16} aria-hidden="true" style={{ transform: whyOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--q-motion-standard) var(--q-ease)' }} />
                {t(lang, 'whyThisStep')}
              </button>
              {whyOpen && (
                <p id="guide-step-why" className="reader__why">{pick(step.why, lang)}</p>
              )}
            </div>
          )}

          {ref && (
            <VerseAccordion reference={ref} lang={lang}>
              {({ toggle }) => (
                <button type="button" onClick={toggle} className="scripture-passage pressable">
                  <span className="scripture-passage__ref">{ref}</span>
                  <span className="scripture-passage__action"><BookOpen size={14} aria-hidden="true" /> {t(lang, 'readFullPassage')}</span>
                </button>
              )}
            </VerseAccordion>
          )}
        </div>
      </div>

      <div className="reader__footer">
        <div className="reader__footer-row">
          {backButton}
          {advanceButton(t(lang, 'continueBtn'), isLastStep)}
        </div>
      </div>
    </>
  );
}
