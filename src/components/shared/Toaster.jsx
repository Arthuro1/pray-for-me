import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import useToastStore from '../../store/toastStore';
import usePrayerStore from '../../store/prayerStore';
import { t } from '../../i18n';
import { QuietButton } from './Primitives';

const ICONS = { success: CheckCircle, error: AlertCircle, info: Info };

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
      className={`q-toasts ${toasts.length === 0 ? 'q-toasts--empty' : ''}`}
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || AlertCircle;
        return (
          <div key={toast.id} className={`q-toast q-toast--${toast.type || 'error'}`}>
            <Icon size={16} aria-hidden="true" className="q-toast__icon" />
            <span className="q-toast__message">{toast.message}</span>
            {toast.action && (
              <QuietButton onClick={() => { toast.action.onClick(); dismiss(toast.id); }} className="shrink-0">
                {toast.action.label}
              </QuietButton>
            )}
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label={t(lang, 'close')}
              className="icon-button pressable -me-2 shrink-0"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
