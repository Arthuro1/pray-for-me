import { BellRing, X } from 'lucide-react';
import { t } from '../i18n';
import { SecondaryButton } from './shared/Primitives';

// Asks this device, once, to turn notifications on (hooks/useNotificationAsk).
// The button opens the system prompt; the person stays free to say no.
export default function NotificationAskCard({ lang, busy, onTurnOn, onDismiss }) {
  return (
    <section className="today-notice q-card" aria-labelledby="today-notify-title">
      <div className="today-notice__head">
        <span className="icon-tile tone-indigo" aria-hidden="true"><BellRing size={18} strokeWidth={1.8} /></span>
        <div className="min-w-0 flex-1">
          <h2 id="today-notify-title" className="today-notice__title">{t(lang, 'notifyAskTitle')}</h2>
        </div>
        <button type="button" onClick={onDismiss} aria-label={t(lang, 'close')} title={t(lang, 'close')} className="icon-button pressable">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <p className="today-notice__body">{t(lang, 'notifyAskBody')}</p>
      <div>
        <SecondaryButton onClick={onTurnOn} disabled={busy}>{t(lang, 'notifyAskCta')}</SecondaryButton>
      </div>
    </section>
  );
}
