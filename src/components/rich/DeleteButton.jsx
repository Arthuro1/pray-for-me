// The app's one "trash" affordance: a hover-revealed Trash2 that deletes a
// whole update or testimony behind a confirmation — the same gesture used to
// remove a prayer point, so deleting reads identically everywhere. Owns its
// own confirm state (like RemovableText / AttachmentList), so callers just pass
// an async onDelete and a localized label. The label doubles as the button's
// accessible name and the confirmation's title.
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import ConfirmDialog from '../shared/ConfirmDialog';
import { t } from '../../i18n';

export default function DeleteButton({ onDelete, lang, label, size = 13, className = '', style }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <>
      {confirming && (
        <ConfirmDialog
          title={label}
          message={t(lang, 'deleteWarning')}
          confirmLabel={t(lang, 'delete')}
          cancelLabel={t(lang, 'cancel')}
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={label}
        title={label}
        // Revealed on hover, but also on keyboard focus — otherwise a keyboard
        // user tabs onto a control they cannot see.
        className={`shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity ${className}`}
        style={{ color: 'var(--text-3)', ...style }}
      >
        <Trash2 size={size} aria-hidden="true" />
      </button>
    </>
  );
}
