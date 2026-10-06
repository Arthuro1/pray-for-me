import { MessageSquareText } from 'lucide-react';
import { t } from '../../i18n';

// Single source of truth for how the app frames its AI to the user: a humble
// study companion that points to Scripture and never speaks for God. Rendered
// wherever AI output appears (`compact`) and at the consent + settings teaching
// moments (`full`), so the posture wording can never drift between surfaces.
// A plain message icon, never sparkles: the AI is a helper, not something magic.
export default function AiDisclaimer({ lang = 'en', variant = 'compact', className = '' }) {
  if (variant === 'full') {
    return <p className={`ai-note ${className}`}>{t(lang, 'aiPostureFull')}</p>;
  }
  return (
    <p className={`ai-label ${className}`}>
      <MessageSquareText size={13} aria-hidden="true" /> {t(lang, 'aiSuggestedLabel')}
    </p>
  );
}
