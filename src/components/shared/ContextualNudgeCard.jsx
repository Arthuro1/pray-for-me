import { X } from 'lucide-react';
import { QuietButton, SecondaryButton } from './Primitives';

// One quiet, dismissible invitation at the moment it becomes useful. A plain
// surface with a hairline — never a coloured card competing with the prayer
// above it — one action, and a way to say "not now".
export default function ContextualNudgeCard({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
  dismissLabel,
  onDismiss,
  titleId,
  // An optional quiet text link under the body — a second way in, never a
  // second button competing with the action.
  secondaryLabel,
  onSecondary,
  ...sectionProps
}) {
  return (
    <section className="nudge" aria-labelledby={titleId} {...sectionProps}>
      <div className="nudge__copy">
        <h2 id={titleId} className="nudge__title">
          {Icon && <Icon size={16} aria-hidden="true" />}
          {title}
        </h2>
        <div className="nudge__body">{body}</div>
        {secondaryLabel && (
          <QuietButton onClick={onSecondary} className="-ms-3">
            {secondaryLabel}
          </QuietButton>
        )}
      </div>
      <div className="nudge__actions">
        <SecondaryButton onClick={onAction}>{actionLabel}</SecondaryButton>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          title={dismissLabel}
          className="icon-button pressable"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
