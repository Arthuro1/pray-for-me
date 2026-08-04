// Selection-aware markdown-lite formatting shared by every writing surface
// (UpdateComposer, the prayer-note field). Pure text math lives in
// applyMarkdownFormat; the hook adds the textarea glue (read the selection,
// restore focus and cursor after React re-renders).
import { useCallback } from 'react';

export function applyMarkdownFormat(text, start, end, kind) {
  const unordered = kind === 'list' || kind === 'insertUnorderedList';
  const ordered = kind === 'orderedList' || kind === 'insertOrderedList';
  if (unordered || ordered) {
    // Prefix each selected line (or the current line) with a list marker.
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const block = text.slice(lineStart, end === start ? text.length : end);
    const prefixed = block.split('\n').map((line, index) => {
      if (unordered) return /^\s*[-*]\s+/.test(line) ? line : `- ${line}`;
      return /^\s*\d+\.\s+/.test(line) ? line : `${index + 1}. ${line}`;
    }).join('\n');
    return {
      text: text.slice(0, lineStart) + prefixed + text.slice(lineStart + block.length),
      cursor: lineStart + prefixed.length,
    };
  }

  const selected = text.slice(start, end);
  if (kind === 'removeFormat') {
    const plain = selected
      .replace(/^\s*(?:[-*]|\d+\.)\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\+\+([^+]+)\+\+/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1');
    return {
      text: text.slice(0, start) + plain + text.slice(end),
      cursor: start + plain.length,
    };
  }

  const marker = kind === 'bold' ? '**' : kind === 'underline' ? '++' : '*';
  return {
    text: text.slice(0, start) + marker + selected + marker + text.slice(end),
    // With a selection the cursor lands after the wrapped text; with none it
    // lands between the markers, ready to type.
    cursor: selected ? start + marker.length * 2 + selected.length : start + marker.length,
  };
}

export function useMarkdownFormatting(textareaRef, value, onChange) {
  return useCallback((kind) => {
    const el = textareaRef.current;
    if (!el) return;
    const { text, cursor } = applyMarkdownFormat(value, el.selectionStart, el.selectionEnd, kind);
    onChange(text);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(cursor, cursor); });
  }, [textareaRef, value, onChange]);
}
