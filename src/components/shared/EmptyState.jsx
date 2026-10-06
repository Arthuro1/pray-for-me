import { PrimaryButton, SecondaryButton } from './Primitives';
import RiseMark from './RiseMark';

// A calm empty state with one clear next step: one small Rise Mark, a title,
// a line of support, the action. An empty prayer list is an invitation, not a
// score — no illustration, no emoji.
export default function EmptyState({ title, subtitle, actionLabel, onAction, actionIcon: Icon, secondaryLabel, onSecondary, compact = false }) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-14'}`}>
      <RiseMark motion="still" size={compact ? 28 : 36} className="mb-5" />
      <p className="editorial-heading mb-2 max-w-sm text-2xl leading-snug" style={{ color: 'var(--q-text)' }}>{title}</p>
      {subtitle && <p className={`max-w-sm text-sm leading-relaxed ${compact ? 'mb-5' : 'mb-7'}`} style={{ color: 'var(--q-text-secondary)' }}>{subtitle}</p>}
      <div className="flex w-full max-w-xs flex-col gap-2">
        {actionLabel && onAction && (
          <PrimaryButton onClick={onAction} icon={Icon}>{actionLabel}</PrimaryButton>
        )}
        {secondaryLabel && onSecondary && (
          <SecondaryButton onClick={onSecondary}>{secondaryLabel}</SecondaryButton>
        )}
      </div>
    </div>
  );
}
