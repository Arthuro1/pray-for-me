import { X, Heart } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';

const PAYPAL_URL = import.meta.env.VITE_DONATION_URL || 'https://paypal.me/YOUR_USERNAME';

const METHODS = [
  {
    id: 'paypal',
    label: 'PayPal',
    available: true,
    logo: (
      <svg width="64" height="16" viewBox="0 0 64 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="13" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="14" fill="#003087">Pay</text>
        <text x="24" y="13" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="14" fill="#009cde">Pal</text>
      </svg>
    ),
  },
  { id: 'stripe', label: 'Credit card', available: false },
  { id: 'applepay', label: 'Apple Pay', available: false },
];

export default function DonateModal({ onClose }) {
  const settings = usePrayerStore((s) => s.settings);
  const lang = settings?.language || 'en';
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
        className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl px-6 pt-6 pb-8"
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

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Heart size={18} style={{ color: '#16a34a' }} />
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>
            {t(lang, 'donateTitle')}
          </h2>
        </div>

        {/* Explanation */}
        <p className="text-xs leading-relaxed mb-5" style={{ color: 'var(--text-3)' }}>
          {t(lang, 'donateWhy')}
        </p>

        {/* Payment methods */}
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
          {t(lang, 'donateChooseMethod')}
        </p>

        <div className="space-y-2">
          {METHODS.map(({ id, label, available, logo }) => (
            available ? (
              <a
                key={id}
                href={PAYPAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full rounded-xl px-4 py-3.5 transition-all"
                style={{ background: 'var(--input-bg)', border: '0.5px solid var(--accent-border)', textDecoration: 'none' }}
              >
                <div className="flex items-center gap-3">
                  {logo}
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  {t(lang, 'donateSelectBtn')}
                </span>
              </a>
            ) : (
              <div
                key={id}
                className="flex items-center justify-between w-full rounded-xl px-4 py-3.5"
                style={{ background: 'var(--input-bg)', border: '0.5px solid var(--border)', opacity: 0.45 }}
              >
                <span className="text-sm" style={{ color: 'var(--text-2)' }}>{label}</span>
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--input-bg)', color: 'var(--text-3)', border: '0.5px solid var(--border)' }}>
                  {t(lang, 'donateComingSoon')}
                </span>
              </div>
            )
          ))}
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--text-3)' }}>
          {t(lang, 'donateThanks')}
        </p>
      </div>
    </div>
  );
}
