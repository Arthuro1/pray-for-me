import { useState, useEffect } from 'react';
import { X, BookOpen, ExternalLink, RefreshCw, WifiOff } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { bibleLink } from '../utils/bibleLink';
import { fetchVerseText } from '../lib/verseText';
import { localizeAiError } from '../lib/aiCore';
import AiConsentModal, { hasAiConsent } from './AiConsentModal';
import AiDisclaimer from './AiDisclaimer';

// Read a Bible passage without leaving the app. Tapping any verse reference
// opens this sheet: it shows whatever text we already have immediately, can pull
// the fuller passage on demand through the guardrailed AI helper, and keeps the
// "read the whole chapter" link to Bible.com as the deepest dive.
//
// `reference`   — the citation to read (e.g. "Philippians 4:6").
// `initialText` — verse text we already hold (daily verse, a saved point); shown
//                 at once so the sheet is never empty while a fuller passage loads.
export default function VerseModal({ reference, lang, initialText, onClose }) {
  const trapRef = useFocusTrap(true);
  useEscapeKey(onClose);

  const [text, setText] = useState(initialText || '');
  // idle (have preview text, not yet enriched) | loading | full | error | offline
  const [status, setStatus] = useState(initialText ? 'idle' : 'loading');
  const [source, setSource] = useState(null); // 'youversion' | 'ai' — provenance of fetched text
  const [error, setError] = useState(null);
  const [showConsent, setShowConsent] = useState(false);

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
      // Keep the preview we already had; just surface that the fuller read failed.
      setError(localizeAiError(e, lang));
      setStatus('idle');
    } else {
      setError(localizeAiError(e, lang) || t(lang, 'scriptureNone'));
      setStatus('error');
    }
  };

  // With no preview text there's nothing to read yet, so fetch on open.
  useEffect(() => {
    if (!initialText) loadPassage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const body = () => {
    if (status === 'offline') {
      return (
        <div className="flex flex-col items-center text-center gap-3 py-10 px-4">
          <WifiOff size={26} style={{ color: 'var(--text-3)' }} />
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'scriptureOffline')}</p>
        </div>
      );
    }

    if (status === 'loading') {
      return (
        <div className="flex flex-col items-center text-center gap-3 py-12">
          <RefreshCw size={22} className="animate-spin" style={{ color: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t(lang, 'loadingVerse')}</p>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="flex flex-col items-center text-center gap-3 py-10 px-4">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{error}</p>
          <button
            onClick={loadPassage}
            className="text-xs font-medium px-4 py-2 rounded-full flex items-center gap-1.5"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
          >
            <RefreshCw size={13} /> {t(lang, 'retryScripture')}
          </button>
        </div>
      );
    }

    // idle (preview) or full
    return (
      <div className="flex flex-col gap-3 py-3">
        <p className="text-base italic leading-loose" style={{ color: 'var(--text-1)' }}>"{text}"</p>
        <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>— {reference}</p>

        {error && <p className="text-xs" style={{ color: 'var(--text-3)' }}>{error}</p>}

        {/* When only a single saved verse is shown, offer to pull the fuller passage. */}
        {status === 'idle' && (
          <button
            onClick={loadPassage}
            className="self-start mt-1 text-xs font-medium px-4 py-2 rounded-full flex items-center gap-1.5"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
          >
            <BookOpen size={13} /> {t(lang, 'readFullPassage')}
          </button>
        )}

        {/* Be honest about provenance: AI-written text carries the disclaimer;
            YouVersion text is authoritative and is attributed instead. */}
        {status === 'full' && source === 'ai' && <AiDisclaimer lang={lang} className="mt-1" />}
        {status === 'full' && source === 'youversion' && (
          <p className="text-xs flex items-center gap-1.5 mt-1" style={{ color: 'var(--text-3)' }}>
            <BookOpen size={12} style={{ flexShrink: 0 }} /> YouVersion
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center md:p-6" style={{ background: 'rgba(26,10,46,0.6)' }} onClick={onClose}>
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={reference}
        className="w-full max-w-lg mx-auto rounded-t-3xl md:rounded-3xl max-h-[88vh] flex flex-col md:shadow-2xl"
        style={{ background: 'var(--bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <h2 className="font-semibold text-lg flex items-center gap-2 min-w-0" style={{ color: 'var(--text-1)' }}>
            <BookOpen size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span className="truncate">{reference}</span>
          </h2>
          <button onClick={onClose} aria-label={t(lang, 'close')} className="p-1.5 rounded-full shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="px-5 overflow-y-auto flex-1">{body()}</div>

        <div className="px-5 py-4 shrink-0" style={{ borderTop: '0.5px solid var(--border)' }}>
          <a
            href={bibleLink(reference)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
          >
            <ExternalLink size={15} /> {t(lang, 'readWholeChapter')}
          </a>
        </div>
      </div>

      {showConsent && (
        <AiConsentModal
          lang={lang}
          context="prayer"
          onAccept={() => { setShowConsent(false); loadPassage(); }}
          onCancel={() => { setShowConsent(false); if (!text) onClose(); }}
        />
      )}
    </div>
  );
}
