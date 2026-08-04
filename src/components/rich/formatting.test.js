// The shared selection math behind every bold / italic / list toolbar.
import { describe, it, expect } from 'vitest';
import { applyMarkdownFormat } from './formatting';

describe('applyMarkdownFormat', () => {
  it('wraps the selection in bold markers, cursor after the wrap', () => {
    expect(applyMarkdownFormat('pray for peace', 9, 14, 'bold')).toEqual({
      text: 'pray for **peace**',
      cursor: 18,
    });
  });

  it('with no selection, inserts markers and puts the cursor between them', () => {
    expect(applyMarkdownFormat('note ', 5, 5, 'italic')).toEqual({
      text: 'note **',
      cursor: 6,
    });
  });

  it('prefixes each selected line with "- ", skipping lines already listed', () => {
    const text = 'healing\n- peace\nfamily';
    expect(applyMarkdownFormat(text, 0, text.length, 'list').text).toBe(
      '- healing\n- peace\n- family'
    );
  });

  it('wraps underline and creates numbered lists', () => {
    expect(applyMarkdownFormat('peace', 0, 5, 'underline').text).toBe('++peace++');
    expect(applyMarkdownFormat('healing\npeace', 0, 13, 'insertOrderedList').text).toBe(
      '1. healing\n2. peace'
    );
  });

  it('removes inline and list formatting from a selection', () => {
    const source = '1. **urgent**\n2. ++today++';
    expect(applyMarkdownFormat(source, 0, source.length, 'removeFormat').text).toBe(
      'urgent\ntoday'
    );
  });

  it('with no selection, lists from the current line to the end', () => {
    const { text } = applyMarkdownFormat('intro\nitem', 8, 8, 'list');
    expect(text).toBe('intro\n- item');
  });
});
