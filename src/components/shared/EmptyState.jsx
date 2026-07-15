// A friendly empty state with one clear next-step CTA, so an empty tab points
// the user forward instead of being a dead end.
export default function EmptyState({ emoji = '🙏', title, subtitle, actionLabel, onAction, actionIcon: Icon, compact = false }) {
  return (
    <div className={`text-center ${compact ? 'py-6 px-4' : 'py-14 px-6'}`}>
      <p className={compact ? 'text-3xl mb-2' : 'text-5xl mb-3'}>{emoji}</p>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-1)' }}>{title}</p>
      {subtitle && <p className={`text-xs ${compact ? 'mb-3' : 'mb-5'} max-w-xs mx-auto leading-relaxed`} style={{ color: 'var(--text-3)' }}>{subtitle}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          {Icon && <Icon size={15} />} {actionLabel}
        </button>
      )}
    </div>
  );
}
