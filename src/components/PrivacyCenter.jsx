import { useEffect } from 'react';
import { X, Lock, Users, MessageSquareText, Bell, Download, Trash2, KeyRound } from 'lucide-react';
import { t } from '../i18n';
import { track, EVENTS } from '../lib/analytics';
import { Modal } from './shared/Primitives';

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
  { icon: MessageSquareText, titleKey: 'pcAiTitle', bodyKey: 'pcAiBody' },
  { icon: KeyRound, titleKey: 'pcRecoveryTitle', bodyKey: 'pcRecoveryBody' },
  { icon: Download, titleKey: 'pcExportTitle', bodyKey: 'pcExportBody' },
  { icon: Trash2, titleKey: 'pcDeleteTitle', bodyKey: 'pcDeleteBody' },
];

export default function PrivacyCenter({ lang = 'en', onClose }) {
  // Content-free impression: record that the user opened their privacy
  // explanation so understanding-your-privacy can be measured. No prayer data.
  useEffect(() => {
    track(EVENTS.PRIVACY_CENTER_OPENED, { source: 'settings' });
  }, []);

  return (
    <Modal label={t(lang, 'privacyCenterTitle')} onClose={onClose} className="max-h-[88vh] overflow-y-auto">
      <div className="q-dialog__header">
        <div className="min-w-0">
          <h2 className="q-dialog__title">{t(lang, 'privacyCenterTitle')}</h2>
          <p className="q-meta mt-2">{t(lang, 'pcIntro')}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 -mt-2 shrink-0">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <ul className="explain-list">
        {SECTIONS.map(({ icon: Icon, titleKey, bodyKey }) => (
          <li key={titleKey}>
            <Icon size={18} strokeWidth={1.85} aria-hidden="true" />
            <div>
              <h3 className="explain-list__title">{t(lang, titleKey)}</h3>
              <p className="explain-list__body">{t(lang, bodyKey)}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="q-meta mt-5">{t(lang, 'pcSecurityNote')}</p>
    </Modal>
  );
}
