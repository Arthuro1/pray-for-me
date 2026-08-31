// Markdown-lite renderer for rich user text: **bold**, *italic* / _italic_,
// ++underline++, bullet/numbered lists, and auto-linked http(s) URLs. Builds React
// elements directly (never dangerouslySetInnerHTML), so user content can't
// inject markup. Plain text renders unchanged, which keeps every existing
// update readable without migration.
import { Fragment } from 'react';

// Recognise the forms people naturally paste into messages: full http(s)
// links, www-prefixed links, and bare domains with optional paths. Protocols
// other than http(s) are intentionally excluded.
const URL_RE = /\b(?:(?:https?:\/\/|www\.)[^\s<>()"']+|(?:[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?\.)+[a-z]{2,63}(?::\d{2,5})?(?:\/[^\s<>()"']*)?)/gi;

function trimUrlPunctuation(value) {
  let url = value.replace(/[.,;:!?]+$/g, '');
  // Keep balanced closing delimiters that belong to a URL, while leaving
  // sentence punctuation outside the anchor.
  for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
    while (url.endsWith(close) && url.split(close).length > url.split(open).length) url = url.slice(0, -1);
  }
  return url;
}

function hrefForUrl(value) {
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

// Inline emphasis over one line: longest marker first so ** wins over *.
const INLINE_RE = /(\*\*([^*]+)\*\*|\+\+([^+]+)\+\+|\*([^*]+)\*|_([^_]+)_)/;

function linkify(text, keyBase) {
  const nodes = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(URL_RE)) {
    if (m.index > 0 && text[m.index - 1] === '@') continue; // domain part of an email
    const label = trimUrlPunctuation(m[0]);
    const href = hrefForUrl(label);
    if (!href) continue;
    if (m.index > last) nodes.push(text.slice(last, m.index));
    nodes.push(
      <a
        key={`${keyBase}-a${i++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline break-all"
        style={{ color: 'var(--accent)' }}
      >
        {label}
      </a>
    );
    last = m.index + label.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderInline(text, keyBase = 'n') {
  const nodes = [];
  let rest = text;
  let i = 0;
  while (rest) {
    const m = rest.match(INLINE_RE);
    if (!m) {
      nodes.push(...linkify(rest, `${keyBase}-${i}`));
      break;
    }
    if (m.index > 0) nodes.push(...linkify(rest.slice(0, m.index), `${keyBase}-${i}`));
    const inner = m[2] ?? m[3] ?? m[4] ?? m[5];
    nodes.push(
      m[2] != null
        ? <strong key={`${keyBase}-s${i}`}>{renderInline(inner, `${keyBase}-s${i}`)}</strong>
        : m[3] != null
          ? <u key={`${keyBase}-u${i}`}>{renderInline(inner, `${keyBase}-u${i}`)}</u>
          : <em key={`${keyBase}-e${i}`}>{renderInline(inner, `${keyBase}-e${i}`)}</em>
    );
    rest = rest.slice(m.index + m[0].length);
    i++;
  }
  return nodes;
}

export default function RichText({ text, className, style }) {
  if (!text) return null;
  const lines = String(text).split('\n');
  const blocks = [];
  let list = null;

  const flushList = () => {
    if (list) { blocks.push({ type: 'list', kind: list.kind, items: list.items }); list = null; }
  };

  for (const line of lines) {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);
    const item = bullet || numbered;
    if (item) {
      const kind = numbered ? 'ol' : 'ul';
      if (list && list.kind !== kind) flushList();
      (list ??= { kind, items: [] }).items.push(item[1]);
    } else {
      flushList();
      blocks.push({ type: 'line', text: line });
    }
  }
  flushList();

  return (
    <div className={className} style={style}>
      {blocks.map((b, i) =>
        b.type === 'list' ? (
          b.kind === 'ol' ? (
            <ol key={i} className="list-decimal ps-5 my-0.5 space-y-0.5">
              {b.items.map((item, j) => <li key={j}>{renderInline(item, `l${i}-${j}`)}</li>)}
            </ol>
          ) : (
            <ul key={i} className="list-disc ps-5 my-0.5 space-y-0.5">
              {b.items.map((item, j) => <li key={j}>{renderInline(item, `l${i}-${j}`)}</li>)}
            </ul>
          )
        ) : (
          // Empty lines become paragraph spacing rather than collapsing.
          <Fragment key={i}>
            {b.text === '' ? <div className="h-2" /> : <p className="my-0">{renderInline(b.text, `p${i}`)}</p>}
          </Fragment>
        )
      )}
    </div>
  );
}
