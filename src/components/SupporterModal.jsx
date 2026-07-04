import { X, Heart, Check } from 'lucide-react';
import { t } from '../i18n';
import { GIVING_LEVELS } from '../lib/plan';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';

// Explains the Supporter membership: a pay-what-you-can way to help sustain
// Pray4Me that receives advanced tools "as a thank-you". Intentionally generous
// and non-manipulative — it repeats that the core app stays free and never says
// "pay to pray" or "unlock prayer".
//
// IMPORTANT (see lib/plan.js): a Supporter membership is NOT a donation. This
// modal only DESCRIBES the model — there is no payment provider wired in yet, so
// it shows a "coming soon" note. A true one-time donation lives separately in
// DonateModal and is always optional. Keep the two apart: on mobile app stores,
// unlocking features for payment may require in-app purchase, so any future
// checkout must stay provider-agnostic.
const LEVEL_LABELS = { supporter: 'giveSupporter', builder: 'giveBuilder', sponsor: 'giveSponsor' };

export default function SupporterModal({ lang = 'en', onClose }) {
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
        aria-label={t(lang, 'supporterTitle')}
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
          <Heart size={18} style={{ color: 'var(--accent)' }} />
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'supporterTitle')}</h2>
        </div>
        <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-2)' }}>{t(lang, 'supporterIntro')}</p>

        {/* What Supporters receive */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
          <h3 className="text-sm font-medium mb-1.5" style={{ color: 'var(--accent)' }}>{t(lang, 'supporterWhatTitle')}</h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--accent)', lineHeight: 1.6 }}>{t(lang, 'supporterWhat')}</p>
        </div>

        {/* Free-forever reassurance */}
        <div className="flex gap-2.5 mb-5">
          <Check size={15} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'supporterFreeNote')}</p>
        </div>

        {/* Suggested giving levels — amounts, not spiritual tiers. Every level
            unlocks the same tools; higher amounts are generosity, not status. */}
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'supporterGiveTitle')}</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {GIVING_LEVELS.map((level) => (
            <div
              key={level.id}
              className="rounded-xl px-2 py-3 text-center"
              style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>€{level.amount}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{t(lang, 'supporterMonthly')}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{t(lang, LEVEL_LABELS[level.id] || 'giveSupporter')}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-center mb-4" style={{ color: 'var(--text-3)' }}>{t(lang, 'supporterCustom')}</p>

        {/* No billing wired yet — soft, honest state. */}
        <div className="rounded-xl px-4 py-3 mb-4 text-center" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-2)' }}>{t(lang, 'supporterComingSoon')}</p>
        </div>

        <p className="text-xs leading-relaxed mb-1" style={{ color: 'var(--text-3)' }}>{t(lang, 'supporterDonateSeparate')}</p>
        <p className="text-center text-xs mt-4 italic" style={{ color: 'var(--accent)' }}>{t(lang, 'supporterThanks')}</p>
      </div>
    </div>
  );
}
