import { useState } from 'react';
import { X, BookOpen, Check, Plus, WifiOff, RefreshCw } from 'lucide-react';
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
import { PrimaryButton, QuietButton, SecondaryButton } from './shared/Primitives';

// One suggested passage: reference, why it speaks to the request, an inline
// "read in app" expansion, and an opt-in "add as prayer point". The Bible text
// itself only ever comes from the authoritative pipeline inside VerseAccordion —
// never from the AI, even for guidance saved before the AI stopped sending it.
function Passage({ p, lang, added, onAdd }) {
  return (
    <li className="scripture-guide__passage">
      <p className="scripture-guide__ref">{p.ref}</p>
      {p.why && <p className="scripture-guide__why">{p.why}</p>}
      <VerseAccordion reference={p.ref} lang={lang}>
        {({ toggle }) => (
          <div className="flex flex-wrap items-center justify-between gap-x-4">
            <button type="button" onClick={toggle} className="scripture-ref">
              <BookOpen size={13} aria-hidden="true" /> {t(lang, 'readInApp')}
            </button>
            {added ? (
              <span className="q-meta inline-flex min-h-11 items-center gap-1.5" role="status">
                <Check size={14} aria-hidden="true" /> {t(lang, 'addedPoint')}
              </span>
            ) : (
              <QuietButton icon={Plus} iconSize={16} onClick={onAdd} className="-me-3">{t(lang, 'addAsPoint')}</QuietButton>
            )}
          </div>
        )}
      </VerseAccordion>
    </li>
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
        <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <WifiOff size={24} style={{ color: 'var(--q-text-tertiary)' }} aria-hidden="true" />
          <p className="text-[0.9375rem] leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>{t(lang, 'scriptureOffline')}</p>
        </div>
      );
    }

    if (status === 'loading') {
      return (
        <div className="flex flex-col items-center text-center gap-3 py-12">
          <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--q-text-tertiary)' }} aria-hidden="true" />
          <p className="q-meta">{t(lang, 'scriptureFinding')}</p>
        </div>
      );
    }

    if (status === 'intro') {
      return (
        <div className="flex flex-col gap-5 py-2">
          <p className="text-[0.9375rem] leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>{t(lang, 'scriptureFirstIntro')}</p>
          <div className="scripture-guide__prayer">
            <p className="scripture-guide__prayer-title">{title}</p>
            {description && <RichText text={description} className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--q-text-secondary)' }} />}
          </div>
          <SecondaryButton icon={BookOpen} onClick={fetchGuidance}>{t(lang, 'findScripture')}</SecondaryButton>
          <AiDisclaimer lang={lang} className="justify-center" />
        </div>
      );
    }

    // status === 'done'
    if (!guidance) {
      return (
        <div className="flex flex-col items-center text-center gap-3 py-10 px-4">
          <p className="text-[0.9375rem] leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>{error || t(lang, 'scriptureNone')}</p>
          <QuietButton icon={RefreshCw} iconSize={16} onClick={fetchGuidance}>{t(lang, 'retryScripture')}</QuietButton>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6 py-2">
        <AiDisclaimer lang={lang} />

        <ul className="scripture-guide__passages">
          {guidance.passages.map((p, i) => (
            <Passage key={p.ref || i} p={p} lang={lang} added={!!added[p.ref]} onAdd={() => addPassage(p)} />
          ))}
        </ul>

        {guidance.context && (
          <section>
            <h3 className="section-label mb-2">{t(lang, 'contextLabel')}</h3>
            <p className="text-[0.9375rem] leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>{guidance.context}</p>
          </section>
        )}

        {guidance.themes.length > 0 && (
          <section>
            <h3 className="section-label mb-2">{t(lang, 'biblicalThemes')}</h3>
            <p className="text-[0.9375rem] leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>{guidance.themes.join(' · ')}</p>
          </section>
        )}

        {guidance.reflections.length > 0 && (
          <section>
            <h3 className="section-label mb-2">{t(lang, 'reflectLabel')}</h3>
            <ul className="scripture-guide__reflections">
              {guidance.reflections.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </section>
        )}
      </div>
    );
  };

  return (
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6" onClick={onClose}>
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scripture-first-title"
        className="q-dialog prayer-form mx-auto flex w-full max-w-lg flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="prayer-form__grip" aria-hidden="true" />
        <div className="prayer-form__header shrink-0">
          <div className="min-w-0">
            <h2 id="scripture-first-title" className="prayer-form__title">{t(lang, 'scriptureFirstTitle')}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 shrink-0">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">{body()}</div>

        <div className="shrink-0 border-t px-6 py-4" style={{ borderColor: 'var(--q-border)', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <PrimaryButton onClick={onClose} className="w-full">{t(lang, 'prayNowCta')}</PrimaryButton>
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
