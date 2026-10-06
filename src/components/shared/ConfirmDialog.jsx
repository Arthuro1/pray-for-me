import { Loader2 } from 'lucide-react';
import { Modal, PrimaryButton, SecondaryButton } from './Primitives';

// Reusable confirmation dialog for destructive actions. Caller passes already
// localised strings so this component stays i18n-agnostic.
export default function ConfirmDialog({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel, loading = false, danger = true }) {
  return (
    <Modal label={title} size="sm" onClose={loading ? null : onCancel}>
      <h2 className="q-dialog__title">{title}</h2>
      {message && <p className="q-dialog__text mt-3">{message}</p>}
      <div className="q-dialog__actions mt-6">
        <SecondaryButton onClick={onCancel} disabled={loading} autoFocus>
          {cancelLabel}
        </SecondaryButton>
        <PrimaryButton onClick={onConfirm} disabled={loading} aria-busy={loading} danger={danger}>
          {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {confirmLabel}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
