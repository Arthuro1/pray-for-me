import { Sparkles } from 'lucide-react';
import { t } from '../../i18n';

// Single source of truth for how the app frames its AI to the user: a humble
// study companion that points to Scripture and never speaks for God. Rendered
// wherever AI output appears (`compact`) and at the consent + settings teaching
// moments (`full`), so the posture wording can never drift between surfaces.
export default function AiDisclaimer({ lang = 'en', variant = 'compact', className = '' }) {
  if (variant === 'full') {
    return (
      <div className={`rounded-xl p-3 flex gap-2.5 ${className}`} style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
        <Sparkles size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--accent)' }}>
          {t(lang, 'aiPostureFull')}
        </p>
      </div>
    );
  }
  return (
    <p className={`text-xs flex items-center gap-1.5 ${className}`} style={{ color: 'var(--text-3)' }}>
      <Sparkles size={12} style={{ flexShrink: 0 }} /> {t(lang, 'aiSuggestedLabel')}
    </p>
  );
}
