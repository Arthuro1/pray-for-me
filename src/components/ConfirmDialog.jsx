import { Loader2 } from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey';

// Reusable confirmation dialog for destructive actions. Caller passes already
// localised strings so this component stays i18n-agnostic.
export default function ConfirmDialog({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel, loading = false, danger = true }) {
  useEscapeKey(onCancel);
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onCancel}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-sm rounded-2xl p-5" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text-1)' }}>{title}</h3>
        {message && <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>{message}</p>}
        <div className="flex gap-2">
          <button onClick={onCancel} autoFocus className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40" style={{ background: danger ? '#e53e3e' : 'var(--accent)' }}>
            {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
