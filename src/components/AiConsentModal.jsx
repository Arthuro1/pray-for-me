import { Sparkles, X, Shield } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { grantAiConsent } from '../lib/aiConsent';
import AiDisclaimer from './shared/AiDisclaimer';

// The consent read/grant/revoke helpers (hasAiConsent, grantAiConsent,
// revokeAiConsent) live in lib/aiConsent.js.

// Every AI feature sends one prayer's title plus its details or latest update;
// `context` only scopes the stored consent.
export default function AiConsentModal({ lang = 'en', context = 'prayer', onAccept, onCancel }) {
  useEscapeKey(onCancel);
  const trapRef = useFocusTrap();

  return (
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div ref={trapRef} tabIndex={-1} role="dialog" aria-modal="true" className="editorial-dialog w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--q-selected)' }}>
              <Sparkles size={16} style={{ color: 'var(--q-royal-text)' }} />
            </div>
            <h3 className="font-semibold text-base" style={{ color: 'var(--q-text)' }}>{t(lang, 'aiConsentTitle')}</h3>
          </div>
          <button className="phase-icon-button" onClick={onCancel} aria-label={t(lang, 'close')}><X size={18} /></button>
        </div>

        <AiDisclaimer lang={lang} variant="full" className="mb-3" />

        <div className="rounded-xl p-3 mb-4 flex gap-2.5" style={{ background: 'var(--q-selected)', border: '0.5px solid var(--q-selected-border)' }}>
          <Shield size={15} style={{ color: 'var(--q-royal-text)', flexShrink: 0, marginTop: 2 }} />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--q-royal-text)' }}>
            {t(lang, 'aiConsentNoticePrayer')}
          </p>
        </div>

        <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--q-text-secondary)' }}>
          {t(lang, 'aiConsentBodyPrayer')}
        </p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--q-field)', color: 'var(--q-text-secondary)', border: '0.5px solid var(--q-field-border)' }}
          >
            {t(lang, 'aiConsentDecline')}
          </button>
          <button
            onClick={() => { grantAiConsent(context); onAccept(); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--q-action-primary)', color: 'var(--q-on-action)' }}
          >
            {t(lang, 'aiConsentAccept')}
          </button>
        </div>
        <p className="text-center text-xs mt-3" style={{ color: 'var(--q-text-tertiary)' }}>
          {t(lang, 'aiConsentFooter')}
        </p>
      </div>
    </div>
  );
}
