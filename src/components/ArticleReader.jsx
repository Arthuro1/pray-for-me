import { X, BookOpen, ArrowLeft, Sunrise, ChevronRight } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { pick, localizeRef } from '../content/teaching';
import VerseAccordion from './VerseAccordion';

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
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: 'var(--bg)' }}>
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label={pick(article.title, lang)} tabIndex={-1} className="flex flex-col h-full focus:outline-none">
        <div className="shrink-0 px-5 pt-4 pb-5" style={{ background: 'var(--header)' }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={onClose} className="flex items-center gap-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
              <ArrowLeft size={16} /> {t(lang, 'growLearn')}
            </button>
            <button onClick={onClose} aria-label={t(lang, 'close')} className="w-8 h-8 flex items-center justify-center rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
              <X size={16} />
            </button>
          </div>
          <div className="text-4xl mb-2">{article.emoji}</div>
          <h2 className="text-xl font-semibold text-white">{pick(article.title, lang)}</h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{pick(article.summary, lang)}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-7 max-w-xl mx-auto w-full">
          <div className="space-y-7">
            {(article.sections || []).map((section, i) => (
              <div key={i}>
                <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-1)' }}>{pick(section.heading, lang)}</h3>
                <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-2)' }}>{pick(section.body, lang)}</p>
                {(section.refs || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {section.refs.map((r) => {
                      const ref = localizeRef(r, lang);
                      return (
                        <VerseAccordion key={r} reference={ref} lang={lang}>
                          {({ toggle }) => (
                            <button
                              onClick={toggle}
                              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
                              style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
                            >
                              <BookOpen size={11} /> {ref}
                            </button>
                          )}
                        </VerseAccordion>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Optional, easy-to-ignore invitation to the gospel journey — only for
              articles that opt in. At most one, at the very bottom, never a popup. */}
          {showJourneyInvite && (
            <button
              onClick={() => onOpenJourney(article.relatedJourneyId)}
              className="w-full text-left rounded-2xl p-4 mt-9 flex items-center gap-3 transition-all motion-reduce:transition-none hover:scale-[1.01] motion-reduce:hover:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)', outlineColor: 'var(--accent)' }}
            >
              <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--accent)' }}>
                <Sunrise size={16} className="text-white" aria-hidden="true" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold mb-0.5" style={{ color: 'var(--accent)' }}>{t(lang, 'gospelInviteLabel')}</span>
                <span className="block text-sm font-medium" style={{ color: 'var(--text-1)' }}>{t(lang, article.journeyInviteKey)}</span>
              </span>
              <ChevronRight size={16} className="shrink-0" style={{ color: 'var(--text-3)' }} aria-hidden="true" />
            </button>
          )}

          <p className="text-xs text-center mt-10 mb-2 leading-relaxed" style={{ color: 'var(--text-3)' }}>
            {t(lang, 'growScriptureNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
