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
      <span className="locked-inline">
        <Lock size={13} aria-hidden="true" /> {t(lang, 'contentLocked')}
      </span>
    );
  }
  return (
    <div className="locked-notice">
      <p className="locked-notice__title"><Lock size={15} aria-hidden="true" /> {t(lang, 'contentLocked')}</p>
      <p className="locked-notice__hint">{t(lang, 'contentLockedHint')}</p>
    </div>
  );
}
