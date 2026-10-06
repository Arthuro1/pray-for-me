import { useState } from 'react';
import { X, BookOpen, Sparkles, Check, WifiOff, RefreshCw } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import AiConsentModal from './AiConsentModal';
import AiOutgoingPreview from './AiOutgoingPreview';
import { hasAiConsent } from '../lib/aiConsent';
import { hasReviewedOutgoing, markOutgoingReviewed } from '../lib/aiCore';
import AiDisclaimer from './shared/AiDisclaimer';
import { getScriptureGuidance } from '../scriptureGuidance';
import VerseAccordion from './VerseAccordion';
import RichText from './rich/RichText';

// One suggested passage: reference, why it speaks to the request, an inline
// "read in app" expansion, and an opt-in "add as prayer point". The Bible text
// itself only ever comes from the authoritative pipeline inside VerseAccordion —
// never from the AI, even for guidance saved before the AI stopped sending it.
function Passage({ p, lang, added, onAdd }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--q-surface)', border: '0.5px solid var(--q-border)' }}>
      <p className="text-sm font-semibold flex items-center gap-1.5 mb-1" style={{ color: 'var(--q-royal-text)' }}>
        <BookOpen size={14} /> {p.ref}
      </p>
      {p.why && <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--q-text-tertiary)' }}>{p.why}</p>}
      <VerseAccordion reference={p.ref} lang={lang}>
        {({ toggle }) => (
          <div className="flex items-center justify-between gap-2">
            <button onClick={toggle} className="text-xs font-medium" style={{ color: 'var(--q-royal-text)' }}>
              {t(lang, 'readInApp')} →
            </button>
            {added ? (
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--q-royal-text)' }}>
                <Check size={13} /> {t(lang, 'addedPoint')}
              </span>
            ) : (
              <button
                onClick={onAdd}
                className="text-xs font-medium px-3 py-1.5 rounded-full"
                style={{ background: 'var(--q-selected)', color: 'var(--q-royal-text)', border: '0.5px solid var(--q-selected-border)' }}
              >
                + {t(lang, 'addAsPoint')}
              </button>
            )}
          </div>
        )}
      </VerseAccordion>
    </div>
  );
}

// Step 2 of creating a prayer: meet God's Word before praying. We show
// Scripture, faithful context, themes and reflection questions FIRST; AI-written
// prayer points stay a separate, opt-in step elsewhere. The prayer already
// exists by the time we get here, so closing without fetching is always fine —
// this is an invitation, never a gate.
//
// `initialGuidance` is the prayer's previously-saved guidance (if any), passed
// in when this is reopened later (see PrayerDetail's "view Scripture" action) so
// it can be recalled without a new AI request.
export default function ScriptureFirstStep({ prayerId, title, description, lang, initialGuidance = null, onClose }) {
  const addPrayerPoint = usePrayerStore((s) => s.addPrayerPoint);
  const setScriptureGuidance = usePrayerStore((s) => s.setScriptureGuidance);
  const trapRef = useFocusTrap(true);
  useEscapeKey(onClose);

  const [status, setStatus] = useState(initialGuidance ? 'done' : 'intro'); // intro | loading | done | offline
  const [guidance, setGuidance] = useState(initialGuidance);
  const [error, setError] = useState(null);
  const [showConsent, setShowConsent] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [added, setAdded] = useState({}); // passage ref -> true

  // Gate: require consent, then a one-time review of the exact outgoing text for
  // this prayer, before the first AI request.
  const fetchGuidance = () => {
    if (!hasAiConsent('prayer')) { setShowConsent(true); return; }
    if (!hasReviewedOutgoing(prayerId)) { setShowPreview(true); return; }
    runGuidance();
  };

  const runGuidance = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) { setStatus('offline'); return; }
    setStatus('loading');
    setError(null);
    const { guidance: g, error: e } = await getScriptureGuidance({ title, description, lang });
    setGuidance(g);
    setError(e);
    setStatus('done');
    if (g) setScriptureGuidance(prayerId, g);
  };

  const addPassage = (p) => {
    addPrayerPoint(prayerId, { title: p.why || p.ref, verses: [{ ref: p.ref }] });
    setAdded((m) => ({ ...m, [p.ref]: true }));
  };

  const body = () => {
    if (status === 'offline') {
      return (
        <div className="flex flex-col items-center text-center gap-3 py-10 px-4">
          <WifiOff size={28} style={{ color: 'var(--q-text-tertiary)' }} />
          <p className="text-sm leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>{t(lang, 'scriptureOffline')}</p>
        </div>
      );
    }

    if (status === 'loading') {
      return (
        <div className="flex flex-col items-center text-center gap-3 py-12">
          <RefreshCw size={22} className="animate-spin" style={{ color: 'var(--q-royal-text)' }} />
          <p className="text-sm" style={{ color: 'var(--q-text-tertiary)' }}>{t(lang, 'scriptureFinding')}</p>
        </div>
      );
    }

    if (status === 'intro') {
      return (
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>{t(lang, 'scriptureFirstIntro')}</p>
          <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--q-selected)', border: '0.5px solid var(--q-selected-border)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--q-text)' }}>{title}</p>
            {description && <RichText text={description} className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--q-text-tertiary)' }} />}
          </div>
          <button
            onClick={fetchGuidance}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--q-action-primary)' }}
          >
            <Sparkles size={16} /> {t(lang, 'findScripture')}
          </button>
          <AiDisclaimer lang={lang} className="justify-center" />
        </div>
      );
    }

    // status === 'done'
    if (!guidance) {
      return (
        <div className="flex flex-col items-center text-center gap-3 py-10 px-4">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>{error || t(lang, 'scriptureNone')}</p>
          <button
            onClick={fetchGuidance}
            className="text-xs font-medium px-4 py-2 rounded-full flex items-center gap-1.5"
            style={{ background: 'var(--q-selected)', color: 'var(--q-royal-text)', border: '0.5px solid var(--q-selected-border)' }}
          >
            <RefreshCw size={13} /> {t(lang, 'retryScripture')}
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4 py-3">
        <AiDisclaimer lang={lang} />

        <div className="space-y-3">
          {guidance.passages.map((p, i) => (
            <Passage key={p.ref || i} p={p} lang={lang} added={!!added[p.ref]} onAdd={() => addPassage(p)} />
          ))}
        </div>

        {guidance.context && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--q-text-tertiary)' }}>{t(lang, 'contextLabel')}</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>{guidance.context}</p>
          </div>
        )}

        {guidance.themes.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--q-text-tertiary)' }}>{t(lang, 'biblicalThemes')}</p>
            <div className="flex flex-wrap gap-1.5">
              {guidance.themes.map((th, i) => (
                <span key={i} className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--q-selected)', color: 'var(--q-royal-text)', border: '0.5px solid var(--q-selected-border)' }}>{th}</span>
              ))}
            </div>
          </div>
        )}

        {guidance.reflections.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--q-text-tertiary)' }}>{t(lang, 'reflectLabel')}</p>
            <ul className="space-y-1.5">
              {guidance.reflections.map((q, i) => (
                <li key={i} className="text-sm leading-relaxed flex gap-2" style={{ color: 'var(--q-text-secondary)' }}>
                  <span style={{ color: 'var(--q-royal-text)' }}>•</span> {q}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6" style={{ background: 'rgba(26,10,46,0.6)' }} onClick={onClose}>
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, 'scriptureFirstTitle')}
        className="w-full max-w-lg mx-auto rounded-t-3xl md:rounded-3xl max-h-[92vh] flex flex-col md:shadow-2xl"
        style={{ background: 'var(--q-canvas)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--q-border)' }} />
        </div>
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <h2 className="font-semibold text-lg flex items-center gap-2" style={{ color: 'var(--q-text)' }}>
            <BookOpen size={18} style={{ color: 'var(--q-royal-text)' }} /> {t(lang, 'scriptureFirstTitle')}
          </h2>
          <button onClick={onClose} aria-label={t(lang, 'close')} className="p-1.5 rounded-full" style={{ background: 'var(--q-selected)', color: 'var(--q-royal-text)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="px-5 overflow-y-auto flex-1">{body()}</div>

        <div className="px-5 py-4 shrink-0" style={{ borderTop: '0.5px solid var(--q-border)' }}>
          <button
            onClick={onClose}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white"
            style={{ background: 'var(--q-action-primary)' }}
          >
            {t(lang, 'prayNowCta')}
          </button>
        </div>
      </div>

      {showConsent && (
        <AiConsentModal
          lang={lang}
          context="prayer"
          onAccept={() => { setShowConsent(false); fetchGuidance(); }}
          onCancel={() => setShowConsent(false)}
        />
      )}

      {showPreview && (
        <AiOutgoingPreview
          lang={lang}
          title={title}
          description={description}
          onSend={() => { setShowPreview(false); markOutgoingReviewed(prayerId); runGuidance(); }}
          onCancel={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
