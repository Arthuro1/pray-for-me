import { Sparkles } from 'lucide-react';
import { t } from '../i18n';
import { isSupporterFeature } from '../lib/plan';

// A soft, non-blocking "Supporter" hint shown beside an advanced feature. It is a
// gentle thank-you tag, NOT a gate: while BILLING_ENABLED is false nothing is
// locked (see lib/plan.js), and even once billing exists this only labels the
// tier — it never disables the control. Renders nothing for free (or unknown)
// features, so a call site can wrap any control unconditionally.
export default function SupporterTag({ feature, lang = 'en', className = '' }) {
  if (!isSupporterFeature(feature)) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${className}`}
      style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
    >
      <Sparkles size={9} /> {t(lang, 'supporterTag')}
    </span>
  );
}
