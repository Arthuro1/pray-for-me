// Qetoret primitives. Every screen composes these instead of styling its own
// buttons, headers, rows, labels, dialogs and fields; the look lives in
// src/styles/components.css. Three button kinds only: primary, secondary, quiet.
import { forwardRef, useId } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, ChevronLeft } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import CircleGlyph from './CircleGlyph';

// The quiet "‹ Plans" link back to where a page was opened from. `state` is
// handed back to that page (e.g. which Journal view was open).
export function BackLink({ to, label, ariaLabel, state, className = '' }) {
  return (
    <Link to={to} state={state} aria-label={ariaLabel || label} className={`quiet-button -ms-3 mb-3 no-underline ${className}`}>
      <ChevronLeft className="rtl-mirror" size={18} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

export function PageHeader({ eyebrow, title, subtitle, aside, backTo, backLabel, backAriaLabel, className = '' }) {
  return (
    <header className={`page-header ${className}`}>
      {backTo && backLabel && <BackLink to={backTo} label={backLabel} ariaLabel={backAriaLabel} />}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          {eyebrow && <p className="page-header__eyebrow section-label">{eyebrow}</p>}
          <h1 className="page-header__title">{title}</h1>
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </header>
  );
}

// An eyebrow (sans, small caps), an optional serif title and supporting line.
// `sacred` marks the eyebrow in gold — reserve it for altar, Scripture and
// testimony moments.
export function SectionHeader({ as: Tag = 'h2', eyebrow, title, supporting, action, sacred = false, id, className = '' }) {
  const Eyebrow = title ? 'p' : Tag;
  return (
    <div className={`section-header ${className}`}>
      <div className="section-header__copy">
        {eyebrow && <Eyebrow id={title ? undefined : id} className={`section-label ${sacred ? 'section-label--sacred' : ''}`}>{eyebrow}</Eyebrow>}
        {title && <Tag id={id} className="section-header__title q-section-title">{title}</Tag>}
        {supporting && <p className="section-header__supporting">{supporting}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SectionDivider({ className = '' }) {
  return <hr className={`q-divider ${className}`} />;
}

export function PrayerSurface({ as: Tag = 'section', tone = 'default', className = '', children, ...props }) {
  return (
    <Tag className={`prayer-surface prayer-surface--${tone} ${tone === 'focus' ? 'q-inverse' : ''} ${className}`} {...props}>
      {children}
    </Tag>
  );
}

function makeButton(base, displayName) {
  const Button = forwardRef(function Button(
    { icon: Icon, iconSize = 18, danger = false, children, className = '', type = 'button', ...props },
    ref,
  ) {
    const variants = danger ? `${base}--danger` : '';
    return (
      <button ref={ref} type={type} className={`${base} pressable ${variants} ${className}`} {...props}>
        {Icon && <Icon size={iconSize} strokeWidth={1.85} aria-hidden="true" />}
        {children != null && <span>{children}</span>}
      </button>
    );
  });
  Button.displayName = displayName;
  return Button;
}

export const PrimaryButton = makeButton('primary-button', 'PrimaryButton');
export const SecondaryButton = makeButton('secondary-button', 'SecondaryButton');
export const QuietButton = makeButton('quiet-button', 'QuietButton');

export function SectionLabel({ as: Tag = 'p', sacred = false, className = '', children, ...props }) {
  return <Tag className={`section-label ${sacred ? 'section-label--sacred' : ''} ${className}`} {...props}>{children}</Tag>;
}

// An option may carry a small `icon` beside its word (Light ☀, Dark ☾).
export function SegmentedControl({ label, value, options, onChange, className = '' }) {
  return (
    <div className={`segmented-control ${className}`} role="group" aria-label={label}>
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
        <button
          key={optionValue}
          type="button"
          aria-pressed={value === optionValue}
          onClick={() => onChange(optionValue)}
        >
          {Icon && <Icon size={15} strokeWidth={1.85} aria-hidden="true" />}
          {optionLabel}
        </button>
      ))}
    </div>
  );
}

// A folded section: its name, how many it holds, a chevron. With an `icon` it
// reads as a row of its own — the icon, the name, the count in a pill.
export function Disclosure({ id, label, count, icon: Icon, open, onToggle, children, className = '' }) {
  const counted = typeof count === 'number';
  return (
    <div className={className}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className={`q-disclosure pressable${Icon ? ' q-disclosure--row' : ''}`}
      >
        {Icon ? (
          <>
            <span className="q-disclosure__icon" aria-hidden="true"><Icon size={16} strokeWidth={1.9} /></span>
            <span className="q-disclosure__label">{label}</span>
            {/* The space is never drawn between flex items, but keeps the
                name read as "label 3", not "label3". */}
            {counted && <>{' '}<span className="q-disclosure__count">{count}</span></>}
          </>
        ) : (
          <span>{label}{counted ? ` · ${count}` : ''}</span>
        )}
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && <div id={id}>{children}</div>}
    </div>
  );
}

// One prayer in a list: a serif title, its context, optional circle and status.
// Rows sit on the page — no card around each one.
export function PrayerRow({ as: Tag = 'button', title, context, circle, status, meta, aside, className = '', ...props }) {
  return (
    <Tag className={`prayer-row ${className}`} {...(Tag === 'button' ? { type: 'button' } : {})} {...props}>
      <span className="min-w-0">
        <span className="prayer-row__title">{title}</span>
        {context && <span className="prayer-row__context">{context}</span>}
        {(circle || status || meta) && (
          <span className="prayer-row__meta">
            {circle && <span>{circle}</span>}
            {meta}
            {status}
          </span>
        )}
      </span>
      {aside && <span className="prayer-row__aside">{aside}</span>}
    </Tag>
  );
}

// Quiet text with a small mark. Tones: neutral, answered, sacred, royal.
export function StatusLabel({ tone = 'neutral', plain = false, className = '', children, ...props }) {
  return (
    <span className={`status-label status-label--${tone} ${plain ? 'status-label--plain' : ''} ${className}`} {...props}>
      {children}
    </span>
  );
}

// Compact pill — for filters, tags and true status indicators only.
export function StatusPill({ tone = 'neutral', icon: Icon, className = '', children, ...props }) {
  return (
    <span className={`status-pill status-pill--${tone} ${className}`} {...props}>
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}

// The one modal: overlay, a single clean surface, focus kept inside, Escape
// closes. `onClose` may be null while something is in flight.
export function Modal({ label, labelledBy, onClose, size = 'md', className = '', children }) {
  useEscapeKey(onClose || null);
  const trapRef = useFocusTrap();
  const width = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';
  return (
    <div className="dialog-backdrop fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center" onClick={onClose || undefined}>
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        className={`q-dialog w-full ${width} p-6 sm:p-8 ${className}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
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

// Label + control + hint, wired for screen readers. Children receive the ids.
export function Field({ label, hint, error, children, className = '' }) {
  const id = useId();
  const hintId = hint || error ? `${id}-hint` : undefined;
  return (
    <div className={`q-field ${className}`}>
      {label && <label htmlFor={id} className="q-field__label">{label}</label>}
      {children({ id, 'aria-describedby': hintId, 'aria-invalid': error ? true : undefined })}
      {(error || hint) && <p id={hintId} className={`q-field__hint ${error ? 'q-field__hint--error' : ''}`}>{error || hint}</p>}
    </div>
  );
}

export const Input = forwardRef(function Input({ className = '', ...props }, ref) {
  return <input ref={ref} className={`q-input ${className}`} {...props} />;
});

// `editorial` sets prayer content in the devotional serif.
export const Textarea = forwardRef(function Textarea({ editorial = false, className = '', ...props }, ref) {
  return <textarea ref={ref} className={`q-textarea ${editorial ? 'q-textarea--editorial' : ''} ${className}`} {...props} />;
});

// A real checkbox drawn quietly: the native input stays focusable and
// operable underneath, the box beside it only mirrors its state.
export function Checkbox({ id, checked, onChange, label, disabled = false, className = '' }) {
  return (
    <label htmlFor={id} className={`q-check ${className}`}>
      <span className="q-check__control">
        <input id={id} type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
        <span className="q-check__box" aria-hidden="true">
          {checked && <Check size={14} strokeWidth={2.5} />}
        </span>
      </span>
      <span className="q-check__label">{label}</span>
    </label>
  );
}

// One intercession circle as a deliberate choice: its glyph (how far the
// circle reaches), title, description. Used inside a `role="radiogroup"`, or as
// a toggle (`toggle`) where the one choice can also be taken back.
export function CircleOption({ circle, title, description, selected, onSelect, toggle = false, className = '', ...props }) {
  const state = toggle ? { 'aria-pressed': selected } : { role: 'radio', 'aria-checked': selected };
  return (
    <button type="button" className={`circle-option pressable ${className}`} onClick={onSelect} {...state} {...props}>
      {circle
        ? <CircleGlyph circle={circle} selected={selected} className="circle-option__glyph" />
        : <span className="circle-option__ring" aria-hidden="true" />}
      <span className="min-w-0">
        <span className="circle-option__title">{title}</span>
        {description && <span className="circle-option__description">{description}</span>}
      </span>
    </button>
  );
}

// Scripture is quoted, never generated: the text comes from the verse pipeline
// and the reference is always shown, in gold.
export function ScriptureBlock({ text, reference, lang, dir, className = '', children }) {
  return (
    <figure className={`scripture-block ${className}`}>
      {text && <blockquote className="scripture-block__text" lang={lang} dir={dir}>{text}</blockquote>}
      {children}
      {reference && <figcaption className="scripture-block__reference">{reference}</figcaption>}
    </figure>
  );
}
