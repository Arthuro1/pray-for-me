import { useState } from 'react';
import useConfirmStore from '../../store/confirmStore';
import ConfirmDialog from './ConfirmDialog';

// Renders the single app-wide confirmation dialog (see confirmStore). Mounted
// once at the app root so any destructive action can request a warning.
export default function ConfirmHost() {
  const { dialog, close } = useConfirmStore();
  const [loading, setLoading] = useState(false);
  if (!dialog) return null;

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await dialog.onConfirm?.();
    } finally {
      close();
      setLoading(false);
    }
  };

  return (
    <ConfirmDialog
      title={dialog.title}
      message={dialog.message}
      confirmLabel={dialog.confirmLabel}
      cancelLabel={dialog.cancelLabel}
      danger={dialog.danger !== false}
      loading={loading}
      onConfirm={handleConfirm}
      onCancel={loading ? undefined : close}
    />
  );
}
