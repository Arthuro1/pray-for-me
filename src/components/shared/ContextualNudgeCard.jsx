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
    <section
      className="mb-6 rounded-2xl p-4 sm:flex sm:items-center sm:gap-4"
      style={{ background: 'var(--q-gold-soft)', border: '1px solid color-mix(in srgb, var(--q-gold) 24%, var(--q-border))' }}
      aria-labelledby={titleId}
      {...sectionProps}
    >
      <div
        className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:mb-0"
        style={{ background: 'var(--q-surface)', color: 'var(--q-gold-text)' }}
        aria-hidden="true"
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="text-sm font-semibold" style={{ color: 'var(--q-text)' }}>
          {title}
        </h2>
        <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>
          {body}
        </div>
        {secondaryLabel && (
          <button
            type="button"
            onClick={onSecondary}
            className="mt-1 inline-flex min-h-11 items-center text-xs font-semibold underline-offset-2 hover:underline"
            style={{ color: 'var(--q-royal-text)' }}
          >
            {secondaryLabel}
          </button>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2 sm:mt-0 sm:shrink-0">
        <button
          type="button"
          onClick={onAction}
          className="min-h-11 flex-1 rounded-xl px-4 text-xs font-semibold sm:flex-none"
          style={{ background: 'var(--q-surface)', border: '1px solid var(--q-border-strong)', color: 'var(--q-royal-text)' }}
        >
          {actionLabel}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          title={dismissLabel}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg"
          style={{ color: 'var(--q-text-tertiary)' }}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </section>
  );
}
