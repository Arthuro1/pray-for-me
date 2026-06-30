import { X, BookOpen, ArrowLeft } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { bibleLink } from '../utils/bibleLink';
import { pick, localizeRef } from '../content/teaching';

// A read-only reader for a theology explanation. Each section is short prose
// followed by the Scripture references it rests on — rendered as links so the
// reader can open and weigh God's Word for themselves. Teaching points to the
// Bible; it never replaces it.
export default function ArticleReader({ article, lang, onClose }) {
  const trapRef = useFocusTrap(true);
  useEscapeKey(onClose);

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
                        <a
                          key={r}
                          href={bibleLink(ref, lang)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
                          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
                        >
                          <BookOpen size={11} /> {ref}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-center mt-10 mb-2 leading-relaxed" style={{ color: 'var(--text-3)' }}>
            {t(lang, 'growScriptureNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
