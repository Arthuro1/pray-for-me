import useConfirmStore from '../store/confirmStore';
import ConfirmDialog from './ConfirmDialog';

// Renders the single app-wide confirmation dialog (see confirmStore). Mounted
// once at the app root so any destructive action can request a warning.
export default function ConfirmHost() {
  const { dialog, close } = useConfirmStore();
  if (!dialog) return null;
  return (
    <ConfirmDialog
      title={dialog.title}
      message={dialog.message}
      confirmLabel={dialog.confirmLabel}
      cancelLabel={dialog.cancelLabel}
      danger={dialog.danger !== false}
      onConfirm={() => { close(); dialog.onConfirm?.(); }}
      onCancel={close}
    />
  );
}
