import { Sparkles, X, Shield } from 'lucide-react';
import { t } from '../i18n';

const CONSENT_KEY = 'pfm_ai_consent';

export function hasAiConsent() {
  return localStorage.getItem(CONSENT_KEY) === 'true';
}

export function grantAiConsent() {
  localStorage.setItem(CONSENT_KEY, 'true');
}

export default function AiConsentModal({ lang = 'en', onAccept, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>{t(lang, 'aiConsentTitle')}</h3>
          </div>
          <button onClick={onCancel}><X size={18} style={{ color: 'var(--text-3)' }} /></button>
        </div>

        <div className="rounded-xl p-3 mb-4 flex gap-2.5" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
          <Shield size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--accent)' }}>
            {t(lang, 'aiConsentNotice')}
          </p>
        </div>

        <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-2)' }}>
          {t(lang, 'aiConsentBody')}
        </p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
          >
            {t(lang, 'aiConsentDecline')}
          </button>
          <button
            onClick={() => { grantAiConsent(); onAccept(); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {t(lang, 'aiConsentAccept')}
          </button>
        </div>
        <p className="text-center text-xs mt-3" style={{ color: 'var(--text-3)' }}>
          {t(lang, 'aiConsentFooter')}
        </p>
      </div>
    </div>
  );
}
