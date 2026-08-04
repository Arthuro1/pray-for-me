// Shared rich-text formatting actions, plus the generic ToolbarButton the
// composer also uses for its media actions.
import { Bold, Italic, List, ListOrdered, RemoveFormatting, Underline } from 'lucide-react';
import { t } from '../../i18n';

export function ToolbarButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
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
      <ToolbarButton icon={Underline} label={t(lang, 'formatUnderline')} onClick={() => onFormat('underline')} />
      <ToolbarButton icon={List} label={t(lang, 'formatList')} onClick={() => onFormat('insertUnorderedList')} />
      <ToolbarButton icon={ListOrdered} label={t(lang, 'formatOrderedList')} onClick={() => onFormat('insertOrderedList')} />
      <ToolbarButton icon={RemoveFormatting} label={t(lang, 'formatRemove')} onClick={() => onFormat('removeFormat')} />
    </>
  );
}
