import { Loader2 } from 'lucide-react';
import { Modal, PrimaryButton, SecondaryButton } from './Primitives';

// Reusable confirmation dialog for destructive actions. Caller passes already
// localised strings so this component stays i18n-agnostic.
export default function ConfirmDialog({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel, loading = false, danger = true }) {
  return (
    <Modal label={title} size="sm" onClose={loading ? null : onCancel}>
      <h3 className="mb-2 text-base font-semibold" style={{ color: 'var(--q-text)', fontFamily: 'var(--q-font-ui)' }}>{title}</h3>
      {message && <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>{message}</p>}
      <div className="flex gap-2">
        <SecondaryButton onClick={onCancel} disabled={loading} autoFocus className="flex-1">
          {cancelLabel}
        </SecondaryButton>
        <PrimaryButton onClick={onConfirm} disabled={loading} aria-busy={loading} danger={danger} className="flex-1">
          {loading ? <Loader2 size={16} className="mx-auto animate-spin" aria-hidden="true" /> : confirmLabel}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
