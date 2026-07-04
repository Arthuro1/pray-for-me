import { X, ShieldCheck, Lock, Users, Sparkles, Bell, Download, Trash2, Heart } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';

// A user-facing, plain-language explanation of how prayers are stored and shared.
// Deliberately non-technical and honest: it never exposes implementation secrets
// and never overpromises "perfect" security. It also makes clear that basic
// privacy (private prayers, the encrypted vault, export, deletion) is free for
// everyone — never a Supporter upgrade.
const SECTIONS = [
  { icon: Lock, titleKey: 'pcPrivateTitle', bodyKey: 'pcPrivateBody' },
  { icon: ShieldCheck, titleKey: 'pcVaultTitle', bodyKey: 'pcVaultBody' },
  { icon: Users, titleKey: 'pcSharedTitle', bodyKey: 'pcSharedBody' },
  { icon: Sparkles, titleKey: 'pcAiTitle', bodyKey: 'pcAiBody' },
  { icon: Bell, titleKey: 'pcPushTitle', bodyKey: 'pcPushBody' },
  { icon: Download, titleKey: 'pcExportTitle', bodyKey: 'pcExportBody' },
  { icon: Trash2, titleKey: 'pcDeleteTitle', bodyKey: 'pcDeleteBody' },
  { icon: Heart, titleKey: 'pcTiersTitle', bodyKey: 'pcTiersBody' },
];

export default function PrivacyCenter({ lang = 'en', onClose }) {
  useEscapeKey(onClose);
  const trapRef = useFocusTrap();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, 'privacyCenterTitle')}
        className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl px-6 pt-6 pb-8 max-h-[88vh] overflow-y-auto"
        style={{ background: 'var(--surface)' }}
      >
        <button
          onClick={onClose}
          aria-label={t(lang, 'close')}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: 'var(--input-bg)', color: 'var(--text-3)' }}
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
