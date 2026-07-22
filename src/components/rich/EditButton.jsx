// The author's "edit" affordance on a posted word or testimony: a hover- and
// focus-revealed pencil, styled to sit beside DeleteButton so a row's controls
// read as one cluster. No confirmation — tapping it just opens the inline
// editor the caller renders; the caller decides who sees it (authors only).
import { Pencil } from 'lucide-react';

export default function EditButton({ onEdit, label, size = 13, className = '', style }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={label}
      title={label}
      className={`shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity ${className}`}
      style={{ color: 'var(--text-3)', ...style }}
    >
      <Pencil size={size} aria-hidden="true" />
    </button>
  );
}
