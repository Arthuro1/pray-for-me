// A WYSIWYG markdown-lite input: text is typed into a contentEditable surface so
// **bold** shows as real bold while you write, never the raw markers. Formatting
// is offered where the gesture belongs — a small toolbar that surfaces over the
// current selection, applying bold / italic / list to exactly the highlighted
// span. Value in and onChange out are always markdown-lite (mdToHtml/htmlToMd
// convert at the edges), so storage, RichText rendering and translation are all
// unchanged.
import { useRef, useEffect, useState, useCallback } from 'react';
import { Bold, Italic, List } from 'lucide-react';
import { mdToHtml, htmlToMd } from './markdownHtml';
import { t } from '../../i18n';

// Place the caret at the very end of the editor (used on autoFocus so editing an
// existing word lands ready to append, not at the start).
function caretToEnd(el) {
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } catch { /* selection API unavailable (non-browser env) */ }
}

const exec = (cmd) => {
  try {
    document.execCommand('styleWithCSS', false, false); // prefer <b>/<i> over inline styles
    return document.execCommand(cmd, false);
  } catch { return false; }
};

function SelectionToolbar({ pos, lang, onFormat }) {
  const btn = (icon, label, cmd) => {
    const Icon = icon;
    return (
      <button
        type="button"
        // Keep the text selection alive: mousedown must not blur the editor.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat(cmd)}
        aria-label={label}
        title={label}
        className="w-9 h-9 flex items-center justify-center rounded-lg"
        style={{ color: 'var(--text-1)' }}
      >
        <Icon size={15} aria-hidden="true" />
      </button>
    );
  };
  return (
    <div
      role="toolbar"
      aria-label={t(lang, 'formatBold')}
      className="absolute z-30 flex items-center gap-0.5 rounded-xl p-1 shadow-lg"
      style={{
        top: pos.top,
        left: pos.left,
        transform: 'translate(-50%, -100%)',
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
      }}
    >
      {btn(Bold, t(lang, 'formatBold'), 'bold')}
      {btn(Italic, t(lang, 'formatItalic'), 'italic')}
      {btn(List, t(lang, 'formatList'), 'insertUnorderedList')}
    </div>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  lang,
  ariaLabel,
  inputId,
  autoFocus = false,
  onKeyDown,
  minHeight = 24,
  maxHeight = 120,
  className = '',
}) {
  const ref = useRef(null);
  // The markdown we last emitted, so an external value change (send clears the
  // field, an edit loads existing text) re-renders the DOM, but our own onInput
  // — which already matches — never rewrites innerHTML mid-keystroke (that would
  // fight the caret).
  const lastMd = useRef(value || '');
  const [toolbar, setToolbar] = useState(null); // { top, left } | null

  const isEmpty = !(value && value.trim());

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = mdToHtml(value || '');
    if (autoFocus && ref.current) { ref.current.focus(); caretToEnd(ref.current); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if ((value || '') !== lastMd.current) {
      lastMd.current = value || '';
      if (ref.current) ref.current.innerHTML = mdToHtml(value || '');
    }
  }, [value]);

  const emit = () => {
    if (!ref.current) return;
    const md = htmlToMd(ref.current);
    lastMd.current = md;
    onChange(md);
  };

  // Surface the toolbar over a live, non-empty selection that lives inside this
  // editor; hide it otherwise. Runs on every selectionchange.
  const syncToolbar = useCallback(() => {
    const el = ref.current;
    const sel = typeof window !== 'undefined' ? window.getSelection() : null;
    if (!el || !sel || sel.rangeCount === 0 || sel.isCollapsed) { setToolbar(null); return; }
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) { setToolbar(null); return; }
    const rect = range.getBoundingClientRect();
    const host = el.parentElement?.getBoundingClientRect();
    if (!host || (rect.width === 0 && rect.height === 0)) { setToolbar(null); return; }
    setToolbar({ top: rect.top - host.top - 6, left: rect.left - host.left + rect.width / 2 });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', syncToolbar);
    return () => document.removeEventListener('selectionchange', syncToolbar);
  }, [syncToolbar]);

  const applyFormat = (cmd) => {
    ref.current?.focus();
    exec(cmd);
    emit();
    // Re-measure after the DOM changed so the toolbar tracks the new selection.
    requestAnimationFrame(syncToolbar);
  };

  return (
    <div className="relative w-full">
      {isEmpty && placeholder && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none text-sm px-3.5 py-2.5 select-none"
          style={{ color: 'var(--text-3)' }}
        >
          {placeholder}
        </div>
      )}
      <div
        ref={ref}
        id={inputId}
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel || placeholder}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onKeyDown={onKeyDown}
        onBlur={() => setToolbar(null)}
        className={`w-full text-sm bg-transparent px-3.5 py-2.5 focus:outline-none overflow-y-auto whitespace-pre-wrap break-words ${className}`}
        style={{ color: 'var(--text-1)', minHeight, maxHeight }}
      />
      {toolbar && <SelectionToolbar pos={toolbar} lang={lang} onFormat={applyFormat} />}
    </div>
  );
}
