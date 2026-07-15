import { useState, useRef, useEffect } from 'react';
import { X, ArrowLeft, ChevronRight, ChevronLeft, ChevronDown, BookOpen, Sunrise, HandHeart, HelpCircle } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { pick, localizeRef } from '../content/teaching';
import VerseAccordion from './VerseAccordion';

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
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: 'var(--bg)' }}>
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label={pick(journey.title, lang)}
        tabIndex={-1}
        className="flex flex-col h-full focus:outline-none"
      >
        {children}
      </div>
    </div>
  );

  const closeButton = (
    <button
      onClick={onClose}
      aria-label={t(lang, 'close')}
      className="w-11 h-11 flex items-center justify-center rounded-full shrink-0"
      style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
    >
      <X size={18} />
    </button>
  );

  // A Scripture reference as an inline-expandable pill (shared by sections and the
  // questions panel). Text comes only from authoritative sources — never AI.
  const RefPills = ({ refs }) => (
    <div className="flex flex-wrap gap-2 mt-3">
      {(refs || []).map((r) => {
        const ref = localizeRef(r, lang);
        return (
          <VerseAccordion key={r} reference={ref} lang={lang}>
            {({ toggle, expanded }) => (
              <button
                onClick={toggle}
                aria-expanded={expanded}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full font-medium"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
              >
                <BookOpen size={11} /> {ref}
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
        <div className="shrink-0 px-5 pt-4 flex justify-end">{closeButton}</div>
        <div className="flex-1 overflow-y-auto px-6 pb-8 max-w-xl mx-auto w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
              <Sunrise size={30} style={{ color: 'var(--accent)' }} aria-hidden="true" />
            </div>
            <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold mb-3 focus:outline-none" style={{ color: 'var(--text-1)' }}>
              {pick(journey.title, lang)}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{pick(journey.summary, lang)}</p>
          </div>
        </div>
        <div className="shrink-0 px-6 py-4 max-w-xl mx-auto w-full" style={{ borderTop: '0.5px solid var(--border)' }}>
          <button
            onClick={goNext}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--accent)' }}
          >
            {t(lang, 'gospelStart')} <ChevronRight size={16} />
          </button>
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
        <div className="shrink-0 px-5 pt-4 pb-3 flex items-center justify-between" style={{ background: 'var(--header)' }}>
          <button onClick={goBack} className="flex items-center gap-2 text-sm font-medium min-h-11 pr-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <ArrowLeft size={16} /> {t(lang, 'gospelBack')}
          </button>
          {closeButton}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-7 max-w-xl mx-auto w-full">
          {showQuestions ? (
            // ── "I still have questions": Scripture-rooted pointers, never AI answers. ──
            <div>
              <h3 ref={headingRef} tabIndex={-1} className="text-lg font-semibold mb-4 focus:outline-none" style={{ color: 'var(--text-1)' }}>
                {t(lang, 'gospelMoreQuestions')}
              </h3>
              <div className="space-y-5">
                {(journey.questions || []).map((q) => (
                  <div key={q.id} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{pick(q.heading, lang)}</p>
                    <RefPills refs={q.refs} />
                    {q.articleId && (
                      <button
                        onClick={() => onOpenArticle?.(q.articleId)}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold min-h-11"
                        style={{ color: 'var(--accent)' }}
                      >
                        {t(lang, 'gospelReadMore')} <ChevronRight size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>
                {t(lang, 'gospelCompleted')}
              </p>

              {/* Response section — gentle, optional, never a saving formula. */}
              <h3 ref={headingRef} tabIndex={-1} className="text-xl font-semibold mb-2 focus:outline-none" style={{ color: 'var(--text-1)' }}>
                {pick(journey.respondHeading, lang)}
              </h3>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-2)' }}>{pick(journey.respondBody, lang)}</p>

              <button
                onClick={() => setShowPrayer((v) => !v)}
                aria-expanded={showPrayer}
                aria-controls="gospel-guided-prayer"
                className="flex items-center gap-1.5 text-sm font-semibold min-h-11"
                style={{ color: 'var(--accent)' }}
              >
                <ChevronDown size={15} className="motion-reduce:transition-none" style={{ transform: showPrayer ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                {t(lang, showPrayer ? 'gospelHidePrayer' : 'gospelUsePrayer')}
              </button>

              {showPrayer && (
                <div id="gospel-guided-prayer" className="mt-3 rounded-2xl p-4" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
                  <p className="text-sm leading-relaxed italic mb-3" style={{ color: 'var(--text-1)' }}>{pick(journey.guidedPrayer, lang)}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{pick(journey.formulaDisclaimer, lang)}</p>
                </div>
              )}

              {/* Next steps — a small number of clear, easy-to-ignore actions. */}
              <h4 className="text-sm font-semibold mt-8 mb-3" style={{ color: 'var(--text-1)' }}>{t(lang, 'gospelNextStepsHeading')}</h4>

              <button
                onClick={handleCreatePrayer}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white mb-3"
                style={{ background: 'var(--accent)' }}
              >
                <HandHeart size={16} /> {t(lang, 'gospelCreatePrayer')}
              </button>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onExplore?.()}
                  className="w-full text-left rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between min-h-11"
                  style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-1)' }}
                >
                  {t(lang, 'gospelContinueExploring')} <ChevronRight size={15} style={{ color: 'var(--text-3)' }} />
                </button>
                <button
                  onClick={() => setShowQuestions(true)}
                  className="w-full text-left rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between min-h-11"
                  style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-1)' }}
                >
                  <span className="flex items-center gap-2"><HelpCircle size={15} style={{ color: 'var(--text-3)' }} /> {t(lang, 'gospelMoreQuestions')}</span>
                  <ChevronRight size={15} style={{ color: 'var(--text-3)' }} />
                </button>
              </div>

              {readActions.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'gospelRelatedReading')}</p>
                  <div className="flex flex-col gap-2">
                    {readActions.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => onOpenArticle?.(a.id)}
                        className="w-full text-left rounded-xl px-4 py-3 text-sm flex items-center justify-between min-h-11"
                        style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-2)' }}
                      >
                        <span className="flex items-center gap-2"><BookOpen size={14} style={{ color: 'var(--accent)' }} /> {t(lang, a.key)}</span>
                        <ChevronRight size={15} style={{ color: 'var(--text-3)' }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full text-center mt-8 py-3 text-sm font-medium min-h-11"
                style={{ color: 'var(--text-3)' }}
              >
                {t(lang, 'gospelReturnToGrow')}
              </button>
            </>
          )}
        </div>
      </>
    );
  }

  // ── One of the six sections. ──
  const stepNo = index + 1;
  return overlay(
    <>
      <div className="shrink-0 px-5 pt-4 pb-3" style={{ background: 'var(--header)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {t(lang, 'gospelStep', { n: stepNo, total })}
          </span>
          {closeButton}
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }} aria-hidden="true">
          <div className="h-full rounded-full transition-all duration-300 motion-reduce:transition-none" style={{ width: `${(stepNo / total) * 100}%`, background: '#fff' }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-xl mx-auto w-full">
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold leading-snug mb-3 focus:outline-none" style={{ color: 'var(--text-1)' }}>
          {pick(section.heading, lang)}
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{pick(section.body, lang)}</p>
        <RefPills refs={section.refs} />
      </div>

      <div className="shrink-0 px-6 py-4 flex items-center gap-3 max-w-xl mx-auto w-full" style={{ borderTop: '0.5px solid var(--border)' }}>
        <button
          onClick={goBack}
          className="flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-2)' }}
        >
          <ChevronLeft size={16} /> {t(lang, 'backBtn')}
        </button>
        <button
          onClick={goNext}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--accent)' }}
        >
          {t(lang, 'continueBtn')} <ChevronRight size={16} />
        </button>
      </div>
    </>
  );
}
