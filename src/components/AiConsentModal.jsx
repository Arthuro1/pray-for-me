import { X } from 'lucide-react';
import { t } from '../i18n';
import { grantAiConsent } from '../lib/aiConsent';
import AiDisclaimer from './shared/AiDisclaimer';
import { Modal, PrimaryButton, SecondaryButton } from './shared/Primitives';

// The consent read/grant/revoke helpers (hasAiConsent, grantAiConsent,
// revokeAiConsent) live in lib/aiConsent.js.

// Every AI feature sends one prayer's title plus its details or latest update;
// `context` only scopes the stored consent.
export default function AiConsentModal({ lang = 'en', context = 'prayer', onAccept, onCancel }) {
  return (
    <Modal label={t(lang, 'aiConsentTitle')} onClose={onCancel} size="sm">
      <div className="q-dialog__header">
        <h2 className="q-dialog__title">{t(lang, 'aiConsentTitle')}</h2>
        <button type="button" onClick={onCancel} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 -mt-2 shrink-0">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <AiDisclaimer lang={lang} variant="full" />
      <p className="ai-note mt-3">{t(lang, 'aiConsentNoticePrayer')}</p>

      <p className="q-dialog__text">{t(lang, 'aiConsentBodyPrayer')}</p>

      <div className="q-dialog__actions">
        <SecondaryButton onClick={onCancel}>{t(lang, 'aiConsentDecline')}</SecondaryButton>
        <PrimaryButton onClick={() => { grantAiConsent(context); onAccept(); }}>{t(lang, 'aiConsentAccept')}</PrimaryButton>
      </div>
      <p className="q-meta mt-3 text-center">{t(lang, 'aiConsentFooter')}</p>
    </Modal>
  );
}
