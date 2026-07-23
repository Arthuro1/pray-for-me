import { PrimaryButton } from './Primitives';

// A calm empty state with one clear next step. It deliberately avoids a large
// celebratory illustration: an empty prayer list is an invitation, not a score.
export default function EmptyState({ emoji = '🙏', title, subtitle, actionLabel, onAction, actionIcon: Icon, secondaryLabel, onSecondary, compact = false }) {
  return (
    <div className={`text-center ${compact ? 'py-7 px-4' : 'py-14 px-6'}`}>
      <p aria-hidden="true" className={compact ? 'text-2xl mb-3' : 'text-4xl mb-4'}>{emoji}</p>
      <p className="editorial-heading text-xl mb-2" style={{ color: 'var(--text-1)' }}>{title}</p>
      {subtitle && <p className={`text-sm ${compact ? 'mb-4' : 'mb-6'} max-w-sm mx-auto leading-relaxed`} style={{ color: 'var(--text-2)' }}>{subtitle}</p>}
      {actionLabel && onAction && (
        <PrimaryButton onClick={onAction} icon={Icon}>{actionLabel}</PrimaryButton>
      )}
      {secondaryLabel && onSecondary && (
        <button onClick={onSecondary} className="pressable mt-3 min-h-11 px-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>
          {secondaryLabel}
        </button>
      )}
    </div>
  );
}
