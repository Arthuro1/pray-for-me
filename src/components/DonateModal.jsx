import { CreditCard, ExternalLink, HandHeart, Heart, Smartphone, Wallet, X } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { Modal, SectionLabel, StatusLabel } from './shared/Primitives';

const PAYPAL_URL = import.meta.env.VITE_DONATION_URL || 'https://paypal.me/YOUR_USERNAME';

// Named in plain text — no payment brand colours inside the product's palette.
// Brand names stay as they are; a generic method is translated.
const METHODS = [
  { id: 'paypal', label: 'PayPal', icon: Wallet, tone: 'indigo', available: true },
  { id: 'stripe', labelKey: 'donateMethodCard', icon: CreditCard, tone: 'teal', available: false },
  { id: 'applepay', label: 'Apple Pay', icon: Smartphone, tone: 'plum', available: false },
];

export default function DonateModal({ onClose }) {
  const settings = usePrayerStore((s) => s.settings);
  const lang = settings?.language || 'en';

  return (
    <Modal label={t(lang, 'donateTitle')} onClose={onClose}>
      <div className="q-dialog__header">
        <div className="q-dialog__lead">
          <span className="icon-tile tone-rose" aria-hidden="true"><Heart size={18} strokeWidth={1.85} /></span>
          <h2 className="q-dialog__title">{t(lang, 'donateTitle')}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 -mt-2 shrink-0">
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <p className="q-dialog__intro">{t(lang, 'donateWhy')}</p>

      <SectionLabel className="mb-2">{t(lang, 'donateChooseMethod')}</SectionLabel>
      <ul className="menu-list donate-methods">
        {METHODS.map(({ id, label, labelKey, icon: Icon, tone, available }) => {
          const name = label || t(lang, labelKey);
          const tile = <span className={`icon-tile tone-${tone}`} aria-hidden="true"><Icon size={18} strokeWidth={1.85} /></span>;
          return (
            <li key={id}>
              {available ? (
                <a href={PAYPAL_URL} target="_blank" rel="noopener noreferrer" className="menu-row menu-row--compact">
                  {tile}
                  <span className="menu-row__body"><span className="menu-row__title">{name}</span></span>
                  <span className="menu-row__action">{t(lang, 'donateSelectBtn')}</span>
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              ) : (
                <div className="menu-row menu-row--compact menu-row--unavailable">
                  {tile}
                  <span className="menu-row__body"><span className="menu-row__title">{name}</span></span>
                  <StatusLabel plain>{t(lang, 'donateComingSoon')}</StatusLabel>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="donate-thanks">
        <HandHeart size={15} aria-hidden="true" /> {t(lang, 'donateThanks')}
      </p>
    </Modal>
  );
}
