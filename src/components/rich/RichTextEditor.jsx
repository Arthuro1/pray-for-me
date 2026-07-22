// A WYSIWYG markdown-lite input: text is typed into a contentEditable surface so
// **bold** shows as real bold while you write, never the raw markers. Formatting
// is offered where the gesture belongs — a small toolbar that surfaces over the
// current selection, applying bold / italic / list to exactly the highlighted
// span. Value in and onChange out are always markdown-lite (mdToHtml/htmlToMd
// convert at the edges), so storage, RichText rendering and translation are all
// unchanged.
import { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bold, Italic, List } from 'lucide-react';
import { mdToHtml, htmlToMd } from './markdownHtml';
import { t } from '../../i18n';

// Rough size of the 3-button toolbar, used to decide which side of the
// selection it fits on and to keep it inside the viewport. It never varies with
// language (icon-only buttons), so a constant is enough — no measure pass.
const TOOLBAR_H = 44; // height incl. padding
const TOOLBAR_HALF_W = 66; // half its width, for horizontal clamping
const GAP = 8; // clearance between the toolbar and the selection
// Touch selections raise a draggable handle just below the selection end; drop
// the toolbar a little further on coarse pointers so it clears that handle.
const HANDLE_CLEARANCE = 24;

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

// Rendered through a portal with `position: fixed`, anchored to the selection's
// on-screen rect — the same escape hatch OverflowMenu uses — so it is never
// clipped by an `overflow-hidden` ancestor (e.g. the inline MessageEditor pill)
// nor buried under the input's stacking context. `pos.below` flips it under the
// selection, where it clears the OS cut/copy/paste bubble that always sits above.
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
  return createPortal(
    <div
      role="toolbar"
      aria-label={t(lang, 'formatBold')}
      className="fixed flex items-center gap-0.5 rounded-xl p-1 shadow-lg"
      style={{
        top: pos.top,
        left: pos.left,
        transform: pos.below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
        zIndex: 61,
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
      }}
    >
      {btn(Bold, t(lang, 'formatBold'), 'bold')}
      {btn(Italic, t(lang, 'formatItalic'), 'italic')}
      {btn(List, t(lang, 'formatList'), 'insertUnorderedList')}
    </div>,
    document.body,
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
  // editor; hide it otherwise. Coordinates are viewport-relative (the toolbar is
  // `position: fixed`), so this also runs on scroll/resize to stay pinned.
  const syncToolbar = useCallback(() => {
    const el = ref.current;
    const sel = typeof window !== 'undefined' ? window.getSelection() : null;
    if (!el || !sel || sel.rangeCount === 0 || sel.isCollapsed) { setToolbar(null); return; }
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) { setToolbar(null); return; }
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) { setToolbar(null); return; }

    // A coarse pointer (touch) raises the OS cut/copy/paste bubble ABOVE the
    // selection, so we drop our toolbar BELOW it; a mouse has no such bubble, so
    // we float above where it reads best. Either side flips when it runs out of
    // room against the viewport edge.
    const coarse = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)')?.matches;
    const roomAbove = rect.top;
    const roomBelow = window.innerHeight - rect.bottom;
    let below = coarse;
    if (below && roomBelow < TOOLBAR_H + GAP) below = false;
    if (!below && roomAbove < TOOLBAR_H + GAP) below = true;

    const left = Math.min(
      Math.max(rect.left + rect.width / 2, TOOLBAR_HALF_W + GAP),
      window.innerWidth - TOOLBAR_HALF_W - GAP,
    );
    const top = below ? rect.bottom + (coarse ? HANDLE_CLEARANCE : GAP) : rect.top - GAP;
    setToolbar({ top, left, below });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', syncToolbar);
    // Keep the fixed toolbar pinned to the selection as the page scrolls/resizes.
    window.addEventListener('scroll', syncToolbar, true);
    window.addEventListener('resize', syncToolbar);
    return () => {
      document.removeEventListener('selectionchange', syncToolbar);
      window.removeEventListener('scroll', syncToolbar, true);
      window.removeEventListener('resize', syncToolbar);
    };
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
        // The list button emits a real <ul>, but Tailwind's preflight resets
        // list markers to none — so the bullet must be restyled here to show
        // WHILE typing, matching RichText's read-only `list-disc ps-5`.
        className={`w-full text-sm bg-transparent px-3.5 py-2.5 focus:outline-none overflow-y-auto whitespace-pre-wrap break-words [&_ul]:list-disc [&_ul]:ps-5 [&_ul]:my-0.5 ${className}`}
        style={{ color: 'var(--text-1)', minHeight, maxHeight }}
      />
      {toolbar && <SelectionToolbar pos={toolbar} lang={lang} onFormat={applyFormat} />}
    </div>
  );
}
