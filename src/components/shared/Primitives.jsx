import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export function PageHeader({ eyebrow, title, subtitle, aside, className = '' }) {
  return (
    <header className={`page-header ${className}`}>
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0">
          {eyebrow && <p className="page-header__eyebrow mb-2">{eyebrow}</p>}
          <h1 className="page-header__title">{title}</h1>
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </header>
  );
}

export function PrayerSurface({ as: Tag = 'section', tone = 'default', className = '', children, ...props }) {
  return (
    <Tag className={`prayer-surface prayer-surface--${tone} ${className}`} {...props}>
      {children}
    </Tag>
  );
}

export const PrimaryButton = forwardRef(function PrimaryButton(
  { icon: Icon, children, className = '', type = 'button', ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={`primary-button pressable inline-flex items-center justify-center gap-2 px-5 ${className}`} {...props}>
      {Icon && <Icon size={17} aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
});

export const QuietButton = forwardRef(function QuietButton(
  { icon: Icon, children, className = '', type = 'button', ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={`quiet-button pressable inline-flex items-center justify-center gap-2 px-4 ${className}`} {...props}>
      {Icon && <Icon size={16} aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
});

export function SectionLabel({ as: Tag = 'p', className = '', children, ...props }) {
  return <Tag className={`section-label ${className}`} {...props}>{children}</Tag>;
}

export function SegmentedControl({ label, value, options, onChange, className = '' }) {
  return (
    <div className={`segmented-control ${className}`} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Disclosure({ id, label, count, open, onToggle, children, className = '' }) {
  return (
    <div className={className}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className="pressable flex min-h-11 w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>
          {label}{typeof count === 'number' ? ` · ${count}` : ''}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          style={{ color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform var(--motion) var(--ease)' }}
        />
      </button>
      {open && <div id={id}>{children}</div>}
    </div>
  );
}

export function StatusPill({ tone = 'neutral', icon: Icon, className = '', children, ...props }) {
  return (
    <span className={`status-pill status-pill--${tone} ${className}`} {...props}>
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}

export const BottomSheet = forwardRef(function BottomSheet(
  { as: Tag = 'div', label, children, className = '', backdropClassName = '', ...props },
  ref,
) {
  return (
    <div className={`bottom-sheet-backdrop ${backdropClassName}`}>
      <Tag
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`bottom-sheet ${className}`}
        {...props}
      >
        {children}
      </Tag>
    </div>
  );
});
