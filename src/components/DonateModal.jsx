import { ExternalLink, X } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { Modal, SectionLabel } from './shared/Primitives';

const PAYPAL_URL = import.meta.env.VITE_DONATION_URL || 'https://paypal.me/YOUR_USERNAME';

// Named in plain text — no payment brand colours inside the product's palette.
const METHODS = [
  { id: 'paypal', label: 'PayPal', available: true },
  { id: 'stripe', label: 'Credit card', available: false },
  { id: 'applepay', label: 'Apple Pay', available: false },
];

export default function DonateModal({ onClose }) {
  const settings = usePrayerStore((s) => s.settings);
  const lang = settings?.language || 'en';

  return (
    <Modal label={t(lang, 'donateTitle')} onClose={onClose}>
      <div className="q-dialog__header">
        <div className="min-w-0">
          <h2 className="q-dialog__title">{t(lang, 'donateTitle')}</h2>
          <p className="q-meta mt-2">{t(lang, 'donateWhy')}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 -mt-2 shrink-0">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <SectionLabel className="mb-2">{t(lang, 'donateChooseMethod')}</SectionLabel>
      <ul className="menu-list">
        {METHODS.map(({ id, label, available }) => (
          <li key={id}>
            {available ? (
              <a href={PAYPAL_URL} target="_blank" rel="noopener noreferrer" className="menu-row menu-row--compact">
                <span className="menu-row__body"><span className="menu-row__title">{label}</span></span>
                <span className="menu-row__action">{t(lang, 'donateSelectBtn')}</span>
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            ) : (
              <div className="menu-row menu-row--compact menu-row--unavailable">
                <span className="menu-row__body"><span className="menu-row__title">{label}</span></span>
                <span className="menu-row__description">{t(lang, 'donateComingSoon')}</span>
              </div>
            )}
          </li>
        ))}
      </ul>

      <p className="q-meta mt-5 text-center">{t(lang, 'donateThanks')}</p>
    </Modal>
  );
}
