import { useState, useRef, useEffect } from 'react';
import { X, ArrowLeft, ChevronRight, ChevronLeft, BookOpen } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { pick, localizeRef } from '../content/teaching';
import VerseAccordion from './VerseAccordion';
import ReportWordingLink from './ReportWordingLink';
import RiseMark from './shared/RiseMark';
import { PrimaryButton, QuietButton, SecondaryButton } from './shared/Primitives';

function BackArrow(props) {
  return <ArrowLeft className="rtl-mirror" {...props} />;
}

function BackChevron(props) {
  return <ChevronLeft className="rtl-mirror" {...props} />;
}

// A dedicated, read-only reader for the gospel journey — a gentle, Scripture-first
// walk for someone new to prayer or exploring the Christian faith. It reuses the
// existing modal architecture (focus trap, Escape-to-close, dialog semantics,
// scroll containment, CSS variables) and the shared Scripture reader, so it feels
// like a natural continuation of the app, not a separate one.
//
// It is deliberately NOT built on the generic ArticleReader: it needs a
// progressive sequence, an optional response section, and next steps — so a
// dedicated component keeps ArticleReader's generic read-only purpose intact.
//
// This component NEVER writes data, publishes anything, tracks a spiritual
// decision, or claims to know whether someone has become a Christian. Its only
// side effects are the callbacks the caller passes in (open a private prayer,
// open a Learn article, keep exploring, close).
//
// index: -1 = intro · 0..n-1 = the six sections · n = response + next steps.
export default function GospelJourneyReader({ journey, lang, onClose, onCreatePrayer, onOpenArticle, onExplore }) {
  const sections = journey.sections || [];
  const total = sections.length;
  const [index, setIndex] = useState(-1);
  const [showPrayer, setShowPrayer] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  const trapRef = useFocusTrap(true);
  useEscapeKey(onClose);

  const onIntro = index === -1;
  const onEnd = index >= total;
  const section = !onIntro && !onEnd ? sections[index] : null;

  // Move focus to the heading of the current view whenever the step changes, so
  // assistive tech announces the new content once — without a chatty live region.
  const headingRef = useRef(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [index, showQuestions]);

  const goBack = () => {
    if (showQuestions) { setShowQuestions(false); return; }
    setIndex((i) => Math.max(-1, i - 1));
  };
  const goNext = () => setIndex((i) => i + 1);

  const handleCreatePrayer = () => {
    // Reuse the existing prayer-creation flow with a private, fully-editable
    // starter prompt. We open the form and step out of the reader so the two
    // modals never stack.
    onCreatePrayer?.({ description: pick(journey.starterPrompt, lang) });
    onClose();
  };

  const overlay = (children) => (
    <div className="reader">
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label={pick(journey.title, lang)}
        tabIndex={-1}
        className="reader__dialog"
      >
        {children}
      </div>
    </div>
  );

  const closeButton = (
    <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 shrink-0">
      <X size={20} aria-hidden="true" />
    </button>
  );

  // A Scripture reference you can open in place (shared by sections and the
  // questions panel). Text comes only from authoritative sources — never AI.
  const RefPills = ({ refs }) => (
    <div className="reader__refs mt-2">
      {(refs || []).map((r) => {
        const ref = localizeRef(r, lang);
        return (
          <VerseAccordion key={r} reference={ref} lang={lang}>
            {({ toggle, expanded }) => (
              <button type="button" onClick={toggle} aria-expanded={expanded} className="scripture-ref">
                <BookOpen size={13} aria-hidden="true" /> {ref}
              </button>
            )}
          </VerseAccordion>
        );
      })}
    </div>
  );

  // ── Intro: name the journey and its purpose before beginning. ──
  if (onIntro) {
    return overlay(
      <>
        <div className="reader__bar"><div className="reader__bar-row"><span />{closeButton}</div></div>
        <div className="reader__scroll">
          <div className="reader__page">
            <RiseMark motion="still" size={44} />
            <h2 ref={headingRef} tabIndex={-1} className="reader__title mt-6">{pick(journey.title, lang)}</h2>
            <p className="reader__lede">{pick(journey.summary, lang)}</p>
          </div>
        </div>
        <div className="reader__footer">
          <div className="reader__footer-row">
            <PrimaryButton onClick={goNext}>{t(lang, 'gospelStart')}</PrimaryButton>
          </div>
        </div>
      </>
    );
  }

  // ── Response + next steps (after the six sections). ──
  if (onEnd) {
    const readActions = [
      { key: 'gospelReadWhyPray', id: 'why-pray' },
      { key: 'gospelReadGrace', id: 'grace' },
      { key: 'gospelReadFaith', id: 'faith' },
      { key: 'gospelReadRepentance', id: 'repentance' },
    ].filter((a) => (journey.relatedArticleIds || []).includes(a.id));

    return overlay(
      <>
        <div className="reader__bar">
          <div className="reader__bar-row">
            <QuietButton onClick={goBack} icon={BackArrow} iconSize={16} className="-ms-3">{t(lang, 'gospelBack')}</QuietButton>
            {closeButton}
          </div>
        </div>

        <div className="reader__scroll">
          <div className="reader__page">
            {showQuestions ? (
              // ── "I still have questions": Scripture-rooted pointers, never AI answers. ──
              <>
                <h3 ref={headingRef} tabIndex={-1} className="reader__heading">{t(lang, 'gospelMoreQuestions')}</h3>
                {(journey.questions || []).map((q) => (
                  <div key={q.id} className="reader__card">
                    <p className="reader__card-title">{pick(q.heading, lang)}</p>
                    <RefPills refs={q.refs} />
                    {q.articleId && (
                      <button type="button" onClick={() => onOpenArticle?.(q.articleId)} className="quiet-button pressable -ms-3">
                        {t(lang, 'gospelReadMore')} <ChevronRight size={14} className="rtl-mirror" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <>
                <p className="section-label">{t(lang, 'gospelCompleted')}</p>

                {/* Response section — gentle, optional, never a saving formula. */}
                <h3 ref={headingRef} tabIndex={-1} className="reader__title">{pick(journey.respondHeading, lang)}</h3>
                <p className="reader__lede">{pick(journey.respondBody, lang)}</p>

                <button
                  type="button"
                  onClick={() => setShowPrayer((v) => !v)}
                  aria-expanded={showPrayer}
                  aria-controls="gospel-guided-prayer"
                  className="quiet-button pressable -ms-3 mt-3"
                >
                  {t(lang, showPrayer ? 'gospelHidePrayer' : 'gospelUsePrayer')}
                </button>

                {showPrayer && (
                  <div id="gospel-guided-prayer" className="reader__prayer">
                    <p className="reader__prayer-text">{pick(journey.guidedPrayer, lang)}</p>
                    <p className="q-meta">{pick(journey.formulaDisclaimer, lang)}</p>
                  </div>
                )}

                {/* Next steps — a small number of clear, easy-to-ignore actions. */}
                <h4 className="section-label mb-3 mt-10">{t(lang, 'gospelNextStepsHeading')}</h4>
                <PrimaryButton onClick={handleCreatePrayer} className="w-full">{t(lang, 'gospelCreatePrayer')}</PrimaryButton>

                <div className="plan-list mt-4">
                  <button type="button" onClick={() => onExplore?.()} className="plan-row pressable">
                    <span className="plan-row__body"><span className="plan-row__title">{t(lang, 'gospelContinueExploring')}</span></span>
                    <ChevronRight size={16} className="rtl-mirror shrink-0" style={{ color: 'var(--q-text-tertiary)' }} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => setShowQuestions(true)} className="plan-row pressable">
                    <span className="plan-row__body"><span className="plan-row__title">{t(lang, 'gospelMoreQuestions')}</span></span>
                    <ChevronRight size={16} className="rtl-mirror shrink-0" style={{ color: 'var(--q-text-tertiary)' }} aria-hidden="true" />
                  </button>
                </div>

                {readActions.length > 0 && (
                  <section className="mt-10">
                    <h4 className="section-label mb-2">{t(lang, 'gospelRelatedReading')}</h4>
                    <div className="plan-list">
                      {readActions.map((a) => (
                        <button key={a.id} type="button" onClick={() => onOpenArticle?.(a.id)} className="plan-row pressable">
                          <span className="plan-row__body"><span className="plan-row__sub">{t(lang, a.key)}</span></span>
                          <ChevronRight size={16} className="rtl-mirror shrink-0" style={{ color: 'var(--q-text-tertiary)' }} aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                <QuietButton onClick={onClose} className="mt-10 w-full" style={{ color: 'var(--q-text-secondary)' }}>{t(lang, 'gospelReturnToGrow')}</QuietButton>
                <div className="flex justify-center"><ReportWordingLink lang={lang} surface={`gospel/${journey.id}`} /></div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── One of the six sections. ──
  const stepNo = index + 1;
  return overlay(
    <>
      <div className="reader__bar">
        <div className="reader__bar-row"><span />{closeButton}</div>
        <div className="reader__progress-row">
          <span className="reader__track" aria-hidden="true"><span style={{ width: `${(stepNo / total) * 100}%` }} /></span>
          <p className="reader__progress">{t(lang, 'gospelStep', { n: stepNo, total })}</p>
        </div>
      </div>

      <div className="reader__scroll">
        <div className="reader__page" key={index}>
          <h2 ref={headingRef} tabIndex={-1} className="reader__title">{pick(section.heading, lang)}</h2>
          <p className="reader__lede mb-4">{pick(section.body, lang)}</p>
          <RefPills refs={section.refs} />
        </div>
      </div>

      <div className="reader__footer">
        <div className="reader__footer-row">
          <SecondaryButton onClick={goBack} icon={BackChevron}>{t(lang, 'backBtn')}</SecondaryButton>
          <PrimaryButton onClick={goNext}>{t(lang, 'continueBtn')}</PrimaryButton>
        </div>
      </div>
    </>
  );
}
