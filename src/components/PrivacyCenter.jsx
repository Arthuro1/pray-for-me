import { useEffect } from 'react';
import { X, ShieldCheck, Lock, Users, Sparkles, Bell, Download, Trash2, KeyRound } from 'lucide-react';
import { t } from '../i18n';
import { track, EVENTS } from '../lib/analytics';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';

// A user-facing, plain-language "what leaves your device?" explanation of how
// prayers are stored and shared. Deliberately non-technical and honest: it never
// exposes implementation secrets and never overpromises. Crucially it does NOT
// claim "only you can read everything" — community prayers are readable by the
// group you share them with; the copy states private vs community encryption
// separately and honestly (acceptance criterion #12).
const SECTIONS = [
  { icon: Lock, titleKey: 'pcPrivateTitle', bodyKey: 'pcPrivateBody' },
  { icon: Users, titleKey: 'pcSharedTitle', bodyKey: 'pcSharedBody' },
  { icon: Bell, titleKey: 'pcPushTitle', bodyKey: 'pcPushBody' },
  { icon: Sparkles, titleKey: 'pcAiTitle', bodyKey: 'pcAiBody' },
  { icon: KeyRound, titleKey: 'pcRecoveryTitle', bodyKey: 'pcRecoveryBody' },
  { icon: Download, titleKey: 'pcExportTitle', bodyKey: 'pcExportBody' },
  { icon: Trash2, titleKey: 'pcDeleteTitle', bodyKey: 'pcDeleteBody' },
];

export default function PrivacyCenter({ lang = 'en', onClose }) {
  useEscapeKey(onClose);
  const trapRef = useFocusTrap();

  // Content-free impression: record that the user opened their privacy
  // explanation so understanding-your-privacy can be measured. No prayer data.
  useEffect(() => {
    track(EVENTS.PRIVACY_CENTER_OPENED, { source: 'settings' });
  }, []);

  return (
    <div
      className="dialog-backdrop fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, 'privacyCenterTitle')}
        className="editorial-dialog relative w-full max-w-md px-6 pt-6 pb-8 max-h-[88vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          aria-label={t(lang, 'close')}
          className="phase-icon-button absolute top-4 flex items-center justify-center rounded-full"
          style={{ insetInlineEnd: '1rem' }}
        >
          <X size={15} />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={18} style={{ color: 'var(--accent)' }} />
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'privacyCenterTitle')}</h2>
        </div>
        <p className="text-xs leading-relaxed mb-5" style={{ color: 'var(--text-3)' }}>{t(lang, 'pcIntro')}</p>

        <div className="space-y-4">
          {SECTIONS.map(({ icon: Icon, titleKey, bodyKey }) => (
            <div key={titleKey} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent-soft)' }}>
                <Icon size={15} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h3 className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-1)' }}>{t(lang, titleKey)}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)', lineHeight: 1.6 }}>{t(lang, bodyKey)}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs leading-relaxed mt-5 pt-4" style={{ color: 'var(--text-3)', borderTop: '0.5px solid var(--border-soft)' }}>
          {t(lang, 'pcSecurityNote')}
        </p>
      </div>
    </div>
  );
}
