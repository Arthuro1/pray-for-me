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
  });

  it('groups "- " lines into one list and keeps other lines as blocks', () => {
    expect(mdToHtml('- a\n- b')).toBe('<ul><li>a</li><li>b</li></ul>');
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
  });

  it('reads execCommand-style inline-styled spans', () => {
    expect(md('<span style="font-weight: bold;">bold</span>')).toBe('**bold**');
    expect(md('<span style="font-style: italic;">it</span>')).toBe('*it*');
  });

  it('turns block divs and lists into lines', () => {
    expect(md('<div>a</div><div>b</div>')).toBe('a\nb');
    expect(md('<ul><li>x</li><li>y</li></ul>')).toBe('- x\n- y');
  });

  it('handles the bare-first-line + <div> shape browsers produce', () => {
    expect(md('hello<div>world</div>')).toBe('hello\nworld');
  });

  it('serialises mixed inline emphasis inside a block', () => {
    expect(md('<div><strong>bold</strong> and <em>it</em></div>')).toBe('**bold** and *it*');
  });
});

describe('round trip', () => {
  for (const source of ['**bold**', '*italic*', '- a\n- b', 'plain line', '**a** then *b*']) {
    it(`preserves ${JSON.stringify(source)}`, () => {
      expect(md(mdToHtml(source))).toBe(source);
    });
  }
});
