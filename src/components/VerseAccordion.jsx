import { useState, useEffect, useRef } from 'react';
import { BookOpen, ExternalLink, RefreshCw, WifiOff } from 'lucide-react';
import { t } from '../i18n';
import { bibleLink } from '../utils/bibleLink';
import { fetchVerseText, fetchScriptureText } from '../lib/verseText';

// Tap a verse reference to expand it in place and read the passage without
// leaving the page — no modal. Shows whatever text is already known at once, and
// pulls the fuller passage on demand from AUTHORITATIVE sources only (cache →
// shared cache → YouVersion). We never generate Scripture text with AI: when no
// authoritative source has the passage, we show the reference with a link to open
// it in the user's own Bible ("reference-only") rather than inventing wording.
// The trigger itself is supplied by the caller (as a render prop) so each screen
// keeps its own pill/row styling; this component owns only the expand state, the
// fetch, and the panel underneath.
export default function VerseAccordion({ reference, lang, initialText, className = '', panelStyle, children }) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState(initialText || '');
  // idle | loading | full | refonly | offline
  const [status, setStatus] = useState('idle');
  const fetchedOnce = useRef(false);

  // Fetch the full passage from authoritative sources. No AI, no consent prompt —
  // only publisher/cached Scripture text is ever requested here.
  const loadPassage = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) { setStatus('offline'); return; }
    setStatus('loading');
    const { data } = await fetchVerseText({ reference, lang });
    if (data?.text) {
      setText(data.text);
      setStatus('full');
    } else {
      // No authoritative text available — show the reference with a Bible link.
      setStatus('refonly');
    }
  };

  // On first expand, try the consent-free authoritative source (cache, then
  // YouVersion). If nothing is available and we have no short text to show, fall
  // to the reference-only state.
  useEffect(() => {
    if (!expanded || fetchedOnce.current) return;
    fetchedOnce.current = true;
    let cancelled = false;
    fetchScriptureText({ reference, lang }).then((res) => {
      if (cancelled) return;
      if (res?.text) {
        setText(res.text);
        setStatus('full');
      } else if (!initialText) {
        loadPassage();
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const toggle = () => setExpanded((v) => !v);

  const chapterLink = (
    <a
      href={bibleLink(reference, lang)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-xs font-medium"
      style={{ color: 'var(--accent)' }}
    >
      <ExternalLink size={11} /> {t(lang, 'readWholeChapter')}
    </a>
  );

  return (
    <div className={className}>
      {children({ expanded, toggle })}

      {expanded && (
        <div className="mt-1.5 rounded-xl p-3" style={panelStyle || { background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
          {status === 'offline' && (
            <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
              <WifiOff size={12} /> {t(lang, 'scriptureOffline')}
            </p>
          )}

          {status === 'loading' && (
            <div className="flex items-center gap-2 py-1">
              <RefreshCw size={13} className="animate-spin" style={{ color: 'var(--accent)' }} />
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'loadingVerse')}</span>
            </div>
          )}

          {/* Reference-only: no authoritative text here — point to the user's Bible. */}
          {status === 'refonly' && (
            <div className="flex flex-col gap-2">
              {text && <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-1)' }}>"{text}"</p>}
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'scriptureRefOnly')}</p>
              {chapterLink}
            </div>
          )}

          {(status === 'idle' || status === 'full') && (
            <>
              {text && <p className="text-sm italic leading-relaxed mb-2" style={{ color: 'var(--text-1)' }}>"{text}"</p>}
              <div className="flex items-center justify-between flex-wrap gap-2">
                {status === 'idle' ? (
                  <button onClick={loadPassage} className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                    <BookOpen size={11} /> {t(lang, 'readFullPassage')}
                  </button>
                ) : <span />}
                {chapterLink}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
