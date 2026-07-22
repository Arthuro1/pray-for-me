// The bridge between the markdown-lite we STORE (**bold**, *italic*, "- " lists)
// and the HTML a contentEditable editor renders, so a styled selection shows as
// real bold/italic text while being written — never the raw "**"/"*"/"-" markers.
// RichText remains the read-only renderer; these two functions only run at the
// editor's edges (fill the editor from stored text, read it back out on input).
//
// Deliberately narrow: bold, italic and unordered lists — the same trio the
// FormatToolbar has always offered. URLs are left as plain text while editing
// (RichText auto-links them once the text is rendered read-only).

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// One line of markdown-lite → inline HTML. Escape first so user text can never
// inject markup, then turn the emphasis markers into <strong>/<em>. Bold runs
// before italic so "**x**" wins over "*x*".
function inlineToHtml(line) {
  return escapeHtml(line)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>');
}

const isListLine = (line) => /^\s*[-*]\s+/.test(line);
const listBody = (line) => line.replace(/^\s*[-*]\s+/, '');

// Stored markdown-lite → the HTML the editor shows. Consecutive "- " lines
// become one <ul>; every other line is its own <div> (contentEditable's own
// block unit), so caret movement and Enter behave natively. An empty line keeps
// its height via <br>.
export function mdToHtml(md) {
  if (!md) return '';
  const lines = String(md).split('\n');
  const blocks = [];
  let list = null;
  const flush = () => { if (list) { blocks.push(`<ul>${list.join('')}</ul>`); list = null; } };
  for (const line of lines) {
    if (isListLine(line)) {
      (list ??= []).push(`<li>${inlineToHtml(listBody(line))}</li>`);
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
  if (tag === 'SPAN') {
    const fw = node.style.fontWeight;
    const bold = fw === 'bold' || (parseInt(fw, 10) >= 600);
    const italic = node.style.fontStyle === 'italic';
    let r = inner;
    if (bold && r.trim()) r = `**${r}**`;
    if (italic && r.trim()) r = `*${r}*`;
    return r;
  }
  return inner; // A, U, and any other inline wrapper: keep its text only
}

const BLOCK_TAGS = new Set(['DIV', 'P']);

// The editor's live HTML → markdown-lite for onChange. Walks the top-level
// nodes, flushing accumulated inline content into a line whenever a block
// boundary (<div>/<p>/list) is reached, so both the browsers that wrap every
// line in a <div> and those that use bare text + <br> serialize the same.
export function htmlToMd(root) {
  if (!root) return '';
  const blocks = [];
  let buffer = null; // pending inline text for the current line (null = none yet)
  const flush = () => { if (buffer !== null) { blocks.push(buffer); buffer = null; } };

  for (const node of root.childNodes) {
    const tag = node.nodeType === 1 ? node.tagName : null;
    if (tag && BLOCK_TAGS.has(tag)) {
      flush();
      blocks.push(inlineToMd(node));
    } else if (tag === 'UL' || tag === 'OL') {
      flush();
      for (const li of node.children) {
        if (li.tagName === 'LI') blocks.push(`- ${inlineToMd(li)}`);
      }
    } else if (tag === 'BR') {
      // A top-level <br> ends the current line.
      buffer = buffer ?? '';
      flush();
    } else {
      buffer = (buffer ?? '') + inlineToMd(node);
    }
  }
  flush();
  // Trim a single trailing empty line browsers often leave after the content.
  if (blocks.length > 1 && blocks[blocks.length - 1] === '') blocks.pop();
  return blocks.join('\n');
}
