// The bridge between the markdown-lite we store and the HTML shown by editors.
// Formatting stays visible while being written instead of exposing raw markers.
// RichText remains the read-only renderer; these two functions only run at the
// editor's edges (fill the editor from stored text, read it back out on input).
//
// Deliberately narrow: bold, italic, underline, and unordered/ordered lists.
// URLs are left as plain text while editing
// (RichText auto-links them once the text is rendered read-only).

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// One line of markdown-lite → inline HTML. Escape first so user text can never
// inject markup, then turn the emphasis markers into <strong>/<em>. Bold runs
// before italic so "**x**" wins over "*x*".
function inlineToHtml(line) {
  return escapeHtml(line)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\+\+([^+]+)\+\+/g, '<u>$1</u>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>');
}

const listKind = (line) => {
  if (/^\s*[-*]\s+/.test(line)) return 'ul';
  if (/^\s*\d+\.\s+/.test(line)) return 'ol';
  return null;
};
const listBody = (line) => line.replace(/^\s*(?:[-*]|\d+\.)\s+/, '');

// Stored markdown-lite → the HTML the editor shows. Consecutive list lines
// become one <ul>/<ol>; every other line is its own <div> (contentEditable's own
// block unit), so caret movement and Enter behave natively. An empty line keeps
// its height via <br>.
export function mdToHtml(md) {
  if (!md) return '';
  const lines = String(md).split('\n');
  const blocks = [];
  let list = null;
  const flush = () => {
    if (list) { blocks.push(`<${list.kind}>${list.items.join('')}</${list.kind}>`); list = null; }
  };
  for (const line of lines) {
    const kind = listKind(line);
    if (kind) {
      if (list && list.kind !== kind) flush();
      (list ??= { kind, items: [] }).items.push(`<li>${inlineToHtml(listBody(line))}</li>`);
    } else {
      flush();
      blocks.push(`<div>${line === '' ? '<br>' : inlineToHtml(line)}</div>`);
    }
  }
  flush();
  return blocks.join('');
}

// One inline DOM node → markdown-lite. Recurses so nested emphasis (and the
// inline-styled <span>s execCommand can emit) serialize correctly. A <br>
// inside a block is a line break.
function inlineToMd(node) {
  if (node.nodeType === 3) return node.nodeValue; // text
  if (node.nodeType !== 1) return '';
  const tag = node.tagName;
  if (tag === 'BR') return '\n';
  const inner = Array.from(node.childNodes).map(inlineToMd).join('');
  const wrap = (marker) => (inner.trim() ? marker + inner + marker : inner);
  if (tag === 'STRONG' || tag === 'B') return wrap('**');
  if (tag === 'EM' || tag === 'I') return wrap('*');
  if (tag === 'U') return wrap('++');
  if (tag === 'SPAN') {
    const fw = node.style.fontWeight;
    const bold = fw === 'bold' || (parseInt(fw, 10) >= 600);
    const italic = node.style.fontStyle === 'italic';
    const underline = (node.style.textDecorationLine || node.style.textDecoration || '').includes('underline');
    let r = inner;
    if (bold && r.trim()) r = `**${r}**`;
    if (italic && r.trim()) r = `*${r}*`;
    if (underline && r.trim()) r = `++${r}++`;
    return r;
  }
  return inner; // A and any other inline wrapper: keep its text only
}

const BLOCK_TAGS = new Set(['DIV', 'P']);
const isList = (tag) => tag === 'UL' || tag === 'OL';

// Does this element directly wrap a list? execCommand('insertUnorderedList')
// only emits a bare top-level <ul> when the FIRST line is selected; for any
// other line the browser nests it as <div><ul>…</ul></div>. Such a block must
// be descended into, not read as one inline line, or the bullets are dropped.
const wrapsList = (node) =>
  node.nodeType === 1 &&
  Array.from(node.childNodes).some((c) => c.nodeType === 1 && isList(c.tagName));

// The editor's live HTML → markdown-lite for onChange. Walks the nodes,
// flushing accumulated inline content into a line whenever a block boundary
// (<div>/<p>/list) is reached, so both the browsers that wrap every line in a
// <div> and those that use bare text + <br> serialize the same. Recurses into
// blocks that wrap a list so nested execCommand output keeps its bullets.
export function htmlToMd(root) {
  if (!root) return '';
  const blocks = [];
  let buffer = null; // pending inline text for the current line (null = none yet)
  const flush = () => { if (buffer !== null) { blocks.push(buffer); buffer = null; } };

  const walk = (parent) => {
    for (const node of parent.childNodes) {
      const tag = node.nodeType === 1 ? node.tagName : null;
      if (isList(tag)) {
        flush();
        let index = 1;
        for (const li of node.children) {
          if (li.tagName === 'LI') {
            blocks.push(`${tag === 'OL' ? `${index++}.` : '-'} ${inlineToMd(li)}`);
          }
        }
      } else if (tag && BLOCK_TAGS.has(tag)) {
        flush();
        if (wrapsList(node)) walk(node); // <div><ul>…</ul></div> → keep bullets
        else blocks.push(inlineToMd(node));
      } else if (tag === 'BR') {
        // A <br> ends the current line.
        buffer = buffer ?? '';
        flush();
      } else {
        buffer = (buffer ?? '') + inlineToMd(node);
      }
    }
  };

  walk(root);
  flush();
  // Trim a single trailing empty line browsers often leave after the content.
  if (blocks.length > 1 && blocks[blocks.length - 1] === '') blocks.pop();
  return blocks.join('\n');
}
