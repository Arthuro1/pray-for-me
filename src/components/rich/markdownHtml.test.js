// @vitest-environment jsdom
//
// The WYSIWYG editor stores markdown-lite but shows real HTML. These two
// converters run at its edges; correctness here is what keeps "**bold**" from
// ever leaking into the field and keeps stored text unchanged across an edit.
import { describe, it, expect } from 'vitest';
import { mdToHtml, htmlToMd } from './markdownHtml';

const md = (html) => { const el = document.createElement('div'); el.innerHTML = html; return htmlToMd(el); };

describe('mdToHtml', () => {
  it('renders emphasis as real tags, never markers', () => {
    expect(mdToHtml('**bold**')).toBe('<div><strong>bold</strong></div>');
    expect(mdToHtml('*italic*')).toBe('<div><em>italic</em></div>');
    expect(mdToHtml('_italic_')).toBe('<div><em>italic</em></div>');
    expect(mdToHtml('++underlined++')).toBe('<div><u>underlined</u></div>');
  });

  it('groups "- " lines into one list and keeps other lines as blocks', () => {
    expect(mdToHtml('- a\n- b')).toBe('<ul><li>a</li><li>b</li></ul>');
    expect(mdToHtml('1. a\n2. b')).toBe('<ol><li>a</li><li>b</li></ol>');
    expect(mdToHtml('line1\nline2')).toBe('<div>line1</div><div>line2</div>');
  });

  it('escapes HTML so user text can never inject markup', () => {
    expect(mdToHtml('a < b & c')).toBe('<div>a &lt; b &amp; c</div>');
  });

  it('is empty for empty input', () => {
    expect(mdToHtml('')).toBe('');
  });
});

describe('htmlToMd', () => {
  it('serialises styled spans back to markers', () => {
    expect(md('<strong>thanks</strong>')).toBe('**thanks**');
    expect(md('<b>x</b>')).toBe('**x**');
    expect(md('<em>y</em>')).toBe('*y*');
    expect(md('<i>z</i>')).toBe('*z*');
    expect(md('<u>u</u>')).toBe('++u++');
  });

  it('reads execCommand-style inline-styled spans', () => {
    expect(md('<span style="font-weight: bold;">bold</span>')).toBe('**bold**');
    expect(md('<span style="font-style: italic;">it</span>')).toBe('*it*');
    expect(md('<span style="text-decoration: underline;">under</span>')).toBe('++under++');
  });

  it('turns block divs and lists into lines', () => {
    expect(md('<div>a</div><div>b</div>')).toBe('a\nb');
    expect(md('<ul><li>x</li><li>y</li></ul>')).toBe('- x\n- y');
    expect(md('<ol><li>x</li><li>y</li></ol>')).toBe('1. x\n2. y');
  });

  it('keeps bullets when the browser nests the list in a block', () => {
    // execCommand('insertUnorderedList') wraps every non-first line this way.
    expect(md('<div><ul><li>one</li></ul></div>')).toBe('- one');
    expect(md('<div>one</div><div><ul><li>two</li></ul></div>')).toBe('one\n- two');
    expect(md('<div><ul><li>one</li><li>two</li></ul></div>')).toBe('- one\n- two');
  });

  it('handles the bare-first-line + <div> shape browsers produce', () => {
    expect(md('hello<div>world</div>')).toBe('hello\nworld');
  });

  it('serialises mixed inline emphasis inside a block', () => {
    expect(md('<div><strong>bold</strong> and <em>it</em></div>')).toBe('**bold** and *it*');
  });
});

describe('round trip', () => {
  for (const source of ['**bold**', '*italic*', '++underlined++', '- a\n- b', '1. a\n2. b', 'plain line', '**a** then *b*']) {
    it(`preserves ${JSON.stringify(source)}`, () => {
      expect(md(mdToHtml(source))).toBe(source);
    });
  }
});
