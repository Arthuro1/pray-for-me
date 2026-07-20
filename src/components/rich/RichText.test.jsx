// @vitest-environment jsdom
//
// The markdown-lite renderer: **bold**, *italic*, "- " lists, auto-linked
// URLs — and, critically, that user content is rendered as TEXT, never markup.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import RichText, { plainText } from './RichText';

afterEach(cleanup);

describe('RichText', () => {
  it('renders plain text unchanged', () => {
    render(<RichText text="Just a simple update" />);
    expect(screen.getByText('Just a simple update')).toBeTruthy();
  });

  it('renders **bold** and *italic* emphasis', () => {
    const { container } = render(<RichText text="a **strong word** and *a soft one*" />);
    expect(container.querySelector('strong').textContent).toBe('strong word');
    expect(container.querySelector('em').textContent).toBe('a soft one');
  });

  it('groups "- " lines into a list', () => {
    const { container } = render(<RichText text={'Please pray for:\n- healing\n- peace\n- the family'} />);
    const items = [...container.querySelectorAll('li')].map((li) => li.textContent);
    expect(items).toEqual(['healing', 'peace', 'the family']);
    expect(container.querySelectorAll('ul').length).toBe(1);
  });

  it('auto-links URLs with safe rel/target', () => {
    const { container } = render(<RichText text="see https://example.com/story for more" />);
    const a = container.querySelector('a');
    expect(a.getAttribute('href')).toBe('https://example.com/story');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toContain('noopener');
  });

  it('never interprets HTML in user content', () => {
    const { container } = render(<RichText text={'<img src=x onerror=alert(1)> **bold**'} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(container.querySelector('strong').textContent).toBe('bold');
  });

  it('supports emphasis inside list items', () => {
    const { container } = render(<RichText text={'- **urgent**: surgery tomorrow'} />);
    expect(container.querySelector('li strong').textContent).toBe('urgent');
  });
});

// Clamped card teasers flatten the same grammar to one readable line.
describe('plainText', () => {
  it('strips emphasis markers and bullet prefixes', () => {
    expect(plainText('**Urgent**: pray for:\n- *healing*\n- peace')).toBe(
      'Urgent: pray for: healing peace'
    );
  });

  it('returns plain text unchanged and empty input as an empty string', () => {
    expect(plainText('a simple note')).toBe('a simple note');
    expect(plainText('')).toBe('');
    expect(plainText(null)).toBe('');
  });
});
