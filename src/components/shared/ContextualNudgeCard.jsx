export default function ContextualNudgeCard({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
  dismissLabel,
  onDismiss,
  titleId,
  ...sectionProps
}) {
  return (
    <section
      className="mb-6 rounded-2xl p-4 sm:flex sm:items-center sm:gap-4"
      style={{ background: 'var(--gold-soft)', border: '1px solid color-mix(in srgb, var(--gold) 24%, var(--border))' }}
      aria-labelledby={titleId}
      {...sectionProps}
    >
      <div
        className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:mb-0"
        style={{ background: 'var(--surface)', color: 'var(--gold)' }}
        aria-hidden="true"
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
          {title}
        </h2>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
          {body}
        </p>
      </div>
      <div className="mt-4 flex items-center gap-2 sm:mt-0 sm:shrink-0">
        <button
          type="button"
          onClick={onAction}
          className="min-h-11 flex-1 rounded-xl px-4 text-xs font-semibold sm:flex-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'var(--accent)' }}
        >
          {actionLabel}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          title={dismissLabel}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg"
          style={{ color: 'var(--text-3)' }}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </section>
  );
}
