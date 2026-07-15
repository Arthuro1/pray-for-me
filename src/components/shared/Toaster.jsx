import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import useToastStore from '../../store/toastStore';

const ICONS = { success: CheckCircle, error: AlertCircle, info: Info };
const COLORS = { success: 'var(--success)', error: '#e53e3e', info: 'var(--accent)' };

export default function Toaster() {
  const { toasts, dismiss } = useToastStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed z-[100] bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 w-[92%] max-w-sm">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || AlertCircle;
        return (
          <div
            key={t.id}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm animate-[fadeIn_0.15s_ease]"
            style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-1)' }}
          >
            <Icon size={16} style={{ color: COLORS[t.type] || COLORS.error, flexShrink: 0 }} />
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                onClick={() => { t.action.onClick(); dismiss(t.id); }}
                className="text-xs font-semibold px-2 py-1 rounded-lg shrink-0"
                style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}
              >
                {t.action.label}
              </button>
            )}
            <button onClick={() => dismiss(t.id)} style={{ color: 'var(--text-3)' }} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
