// The bold / italic / list trio every markdown-lite input shares, plus the
// generic ToolbarButton the composer also uses for its media actions.
import { Bold, Italic, List } from 'lucide-react';
import { t } from '../../i18n';

export function ToolbarButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
      style={{ color: active ? 'var(--accent)' : 'var(--text-3)', background: active ? 'var(--accent-soft)' : 'transparent' }}
    >
      <Icon size={14} aria-hidden="true" />
    </button>
  );
}

export default function FormatToolbar({ lang, onFormat }) {
  return (
    <>
      <ToolbarButton icon={Bold} label={t(lang, 'formatBold')} onClick={() => onFormat('bold')} />
      <ToolbarButton icon={Italic} label={t(lang, 'formatItalic')} onClick={() => onFormat('italic')} />
      <ToolbarButton icon={List} label={t(lang, 'formatList')} onClick={() => onFormat('list')} />
    </>
  );
}
