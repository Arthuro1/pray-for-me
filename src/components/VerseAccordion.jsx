import { useState, useEffect, useRef } from 'react';
import { BookOpen, ExternalLink, RefreshCw, WifiOff } from 'lucide-react';
import { t } from '../i18n';
import { bibleLink } from '../utils/bibleLink';
import { fetchVerseText, fetchScriptureText } from '../lib/verseText';
import { localizeAiError } from '../lib/aiCore';
import AiConsentModal, { hasAiConsent } from './AiConsentModal';
import AiDisclaimer from './AiDisclaimer';

// Tap a verse reference to expand it in place and read the passage without
// leaving the page — no modal. Shows whatever text is already known at once,
// pulls the fuller passage on demand through the guardrailed AI helper when no
// authoritative source has it, and offers "read the whole chapter" as the
// deepest dive. The trigger itself is supplied by the caller (as a render
// prop) so each screen keeps its own pill/row styling; this component owns
// only the expand state, the fetch, and the panel underneath.
export default function VerseAccordion({ reference, lang, initialText, className = '', panelStyle, children }) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState(initialText || '');
  const [status, setStatus] = useState('idle'); // idle | loading | full | error | offline
  const [source, setSource] = useState(null);
  const [error, setError] = useState(null);
  const [showConsent, setShowConsent] = useState(false);
  const fetchedOnce = useRef(false);

  const loadPassage = async () => {
    if (!hasAiConsent('prayer')) { setShowConsent(true); return; }
    if (typeof navigator !== 'undefined' && !navigator.onLine) { setStatus('offline'); return; }
    setStatus('loading');
    setError(null);
    const { data, error: e } = await fetchVerseText({ reference, lang });
    if (data?.text) {
      setText(data.text);
      setSource(data.source || 'ai');
      setStatus('full');
    } else if (text) {
      setError(localizeAiError(e, lang));
      setStatus('idle');
    } else {
      setError(localizeAiError(e, lang) || t(lang, 'scriptureNone'));
      setStatus('error');
    }
  };

  // On first expand, try the consent-free source (cache, then YouVersion)
  // before ever falling to the AI path.
  useEffect(() => {
    if (!expanded || fetchedOnce.current) return;
    fetchedOnce.current = true;
    let cancelled = false;
    fetchScriptureText({ reference, lang }).then((res) => {
      if (cancelled) return;
      if (res?.text) {
        setText(res.text);
        setSource(res.source || 'youversion');
        setStatus('full');
      } else if (!initialText) {
        loadPassage();
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const toggle = () => setExpanded((v) => !v);

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

          {status === 'error' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs" style={{ color: 'var(--text-2)' }}>{error}</p>
              <button
                onClick={loadPassage}
                className="self-start text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
              >
                <RefreshCw size={11} /> {t(lang, 'retryScripture')}
              </button>
            </div>
          )}

          {(status === 'idle' || status === 'full') && (
            <>
              {text && <p className="text-sm italic leading-relaxed mb-2" style={{ color: 'var(--text-1)' }}>"{text}"</p>}
              {error && <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>{error}</p>}
              <div className="flex items-center justify-between flex-wrap gap-2">
                {status === 'idle' ? (
                  <button onClick={loadPassage} className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                    <BookOpen size={11} /> {t(lang, 'readFullPassage')}
                  </button>
                ) : <span />}
                <a
                  href={bibleLink(reference, lang)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: 'var(--accent)' }}
                >
                  <ExternalLink size={11} /> {t(lang, 'readWholeChapter')}
                </a>
              </div>
              {status === 'full' && source === 'ai' && <AiDisclaimer lang={lang} className="mt-1.5" />}
            </>
          )}
        </div>
      )}

      {showConsent && (
        <AiConsentModal
          lang={lang}
          context="prayer"
          onAccept={() => { setShowConsent(false); loadPassage(); }}
          onCancel={() => setShowConsent(false)}
        />
      )}
    </div>
  );
}
