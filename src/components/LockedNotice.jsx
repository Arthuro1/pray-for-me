import { Lock } from 'lucide-react';
import { t } from '../i18n';

// Shown in place of prayer content that carries `_locked` — a row whose encrypted
// payload couldn't be decrypted on this device (missing account key, or a group
// key that hasn't reached this device yet). Rendering the blank redacted columns
// as-is looks like data loss; this states honestly that the content is encrypted
// and unavailable here, matching the E2EE model. `inline` renders a compact
// single line (list cards); the default renders a full explanatory card (detail).
export default function LockedNotice({ lang, inline = false }) {
  if (inline) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm italic" style={{ color: 'var(--text-3)' }}>
        <Lock size={13} className="shrink-0" /> {t(lang, 'contentLocked')}
      </span>
    );
  }
  return (
    <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--accent-soft)' }}>
        <Lock size={15} style={{ color: 'var(--accent)' }} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-1)' }}>{t(lang, 'contentLocked')}</p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{t(lang, 'contentLockedHint')}</p>
      </div>
    </div>
  );
}
