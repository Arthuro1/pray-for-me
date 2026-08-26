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
      // A formatting control is a toggle: say so when its state is known, so it
      // isn't only the accent colour that reports "bold is on".
      aria-pressed={typeof active === 'boolean' ? active : undefined}
      title={label}
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
      style={{ color: active ? 'var(--accent)' : 'var(--text-3)', background: active ? 'var(--accent-soft)' : 'transparent' }}
    >
      <Icon size={14} aria-hidden="true" />
    </button>
  );
}

// `active` maps a command name to whether it currently applies at the caret.
export default function FormatToolbar({ lang, onFormat, active = {} }) {
  return (
    <>
      <ToolbarButton icon={Bold} label={t(lang, 'formatBold')} active={active.bold} onClick={() => onFormat('bold')} />
      <ToolbarButton icon={Italic} label={t(lang, 'formatItalic')} active={active.italic} onClick={() => onFormat('italic')} />
      <ToolbarButton icon={Underline} label={t(lang, 'formatUnderline')} active={active.underline} onClick={() => onFormat('underline')} />
      <ToolbarButton icon={List} label={t(lang, 'formatList')} active={active.insertUnorderedList} onClick={() => onFormat('insertUnorderedList')} />
      <ToolbarButton icon={ListOrdered} label={t(lang, 'formatOrderedList')} active={active.insertOrderedList} onClick={() => onFormat('insertOrderedList')} />
      <ToolbarButton icon={RemoveFormatting} label={t(lang, 'formatRemove')} onClick={() => onFormat('removeFormat')} />
    </>
  );
}
