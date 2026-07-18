import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import useToastStore from '../../store/toastStore';
import usePrayerStore from '../../store/prayerStore';
import { t } from '../../i18n';

const ICONS = { success: CheckCircle, error: AlertCircle, info: Info };
const COLORS = { success: 'var(--success)', error: '#e53e3e', info: 'var(--accent)' };

// Saved / copied / completed / offline all land here, so this is where a screen
// reader hears about them. `polite` waits for a pause instead of cutting the
// user off mid-sentence, and the region is always mounted so an added toast
// registers as a change rather than as new content appearing from nowhere.
export default function Toaster() {
  const { toasts, dismiss } = useToastStore();
  const lang = usePrayerStore((s) => s.settings.language) || 'fr';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="fixed z-[100] bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 w-[92%] max-w-sm"
      style={toasts.length === 0 ? { pointerEvents: 'none' } : undefined}
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || AlertCircle;
        return (
          <div
            key={toast.id}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm animate-[fadeIn_0.15s_ease]"
            style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-1)' }}
          >
            <Icon size={16} aria-hidden="true" style={{ color: COLORS[toast.type] || COLORS.error, flexShrink: 0 }} />
            <span className="flex-1">{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => { toast.action.onClick(); dismiss(toast.id); }}
                className="min-h-[44px] text-xs font-semibold px-2 py-1 rounded-lg shrink-0 focus-visible:ring-2"
                style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(toast.id)}
              aria-label={t(lang, 'close')}
              className="w-11 h-11 -my-2 -mr-2 shrink-0 flex items-center justify-center rounded-full focus-visible:ring-2"
              style={{ color: 'var(--text-3)' }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
