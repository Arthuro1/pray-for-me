import { X, BookOpen, ArrowLeft, ChevronRight } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { pick, localizeRef } from '../content/teaching';
import VerseAccordion from './VerseAccordion';
import ReportWordingLink from './ReportWordingLink';
import { QuietButton } from './shared/Primitives';

function BackArrow(props) {
  return <ArrowLeft className="rtl-mirror" {...props} />;
}

// A read-only reader for a theology explanation. Each section is short prose
// followed by the Scripture references it rests on — rendered as links so the
// reader can open and weigh God's Word for themselves. Teaching points to the
// Bible; it never replaces it.
//
// Its generic read-only purpose is intact: the only optional addition is a single,
// subtle related-content card at the very bottom, shown ONLY for articles that
// explicitly opt in (article.relatedJourneyId + article.journeyInviteKey) and only
// when the caller provides onOpenJourney. It never pops up or interrupts reading.
export default function ArticleReader({ article, lang, onClose, onOpenJourney }) {
  const trapRef = useFocusTrap(true);
  useEscapeKey(onClose);
  const showJourneyInvite = !!(article.relatedJourneyId && article.journeyInviteKey && onOpenJourney);

  return (
    <div className="reader">
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label={pick(article.title, lang)} tabIndex={-1} className="reader__dialog">
        <div className="reader__bar">
          <div className="reader__bar-row">
            <QuietButton onClick={onClose} icon={BackArrow} iconSize={16} className="-ms-3">{t(lang, 'growLearn')}</QuietButton>
            <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 shrink-0">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="reader__scroll">
          <article className="reader__page">
            <p className="section-label">{t(lang, 'growLearn')}</p>
            <h2 className="reader__title">{pick(article.title, lang)}</h2>
            <p className="reader__lede">{pick(article.summary, lang)}</p>

            <div className="mt-10">
              {(article.sections || []).map((section, i) => (
                <section key={i} className="reader__section">
                  <h3 className="reader__heading">{pick(section.heading, lang)}</h3>
                  <p className="reader__prose">{pick(section.body, lang)}</p>
                  {(section.refs || []).length > 0 && (
                    <div className="reader__refs">
                      {section.refs.map((r) => {
                        const ref = localizeRef(r, lang);
                        return (
                          <VerseAccordion key={r} reference={ref} lang={lang}>
                            {({ toggle }) => (
                              <button type="button" onClick={toggle} className="scripture-ref">
                                <BookOpen size={13} aria-hidden="true" /> {ref}
                              </button>
                            )}
                          </VerseAccordion>
                        );
                      })}
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* Optional, easy-to-ignore invitation to the gospel journey — only for
                articles that opt in. At most one, at the very bottom, never a popup. */}
            {showJourneyInvite && (
              <div className="plan-list mt-12">
                <button type="button" onClick={() => onOpenJourney(article.relatedJourneyId)} className="plan-row pressable">
                  <span className="plan-row__body">
                    <span className="section-label">{t(lang, 'gospelInviteLabel')}</span>
                    <span className="plan-row__title">{t(lang, article.journeyInviteKey)}</span>
                  </span>
                  <ChevronRight size={16} className="rtl-mirror shrink-0" style={{ color: 'var(--q-text-tertiary)' }} aria-hidden="true" />
                </button>
              </div>
            )}

            <p className="q-meta mt-12 text-center">{t(lang, 'growScriptureNote')}</p>
            <div className="flex justify-center"><ReportWordingLink lang={lang} surface={`theology/${article.id}`} /></div>
          </article>
        </div>
      </div>
    </div>
  );
}
