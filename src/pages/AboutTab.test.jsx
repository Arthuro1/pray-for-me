// @vitest-environment jsdom
//
// About Qetoret: a reference opens its passage in place, under the row of
// references — the reader stays on the page. One passage is open at a time.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => ({ text: 'Que ma prière soit devant ta face comme l’encens', source: 'bundle' })),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));

import AboutTab from './AboutTab';
import usePrayerStore from '../store/prayerStore';
import { localizeRef } from '../content/teaching';

const lang = 'fr';
const refButton = (ref) => screen.getByRole('button', { name: localizeRef(ref, lang) });

afterEach(cleanup);
beforeEach(() => {
  usePrayerStore.setState({ settings: { language: lang } });
});

describe('AboutTab — Scripture references', () => {
  it('are buttons that unfold the passage in place, not links away', async () => {
    render(<MemoryRouter><AboutTab /></MemoryRouter>);
    expect(screen.queryByRole('link', { name: localizeRef('Psalm 141:2', lang) })).toBeNull();

    const psalm = refButton('Psalm 141:2');
    expect(psalm.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(psalm);
    expect(psalm.getAttribute('aria-expanded')).toBe('true');
    expect(await screen.findByText(/comme l’encens/)).toBeTruthy();
    expect(document.getElementById(psalm.getAttribute('aria-controls'))).toBeTruthy();

    fireEvent.click(psalm);
    expect(psalm.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText(/comme l’encens/)).toBeNull();
  });

  it('keeps one passage open per section', () => {
    render(<MemoryRouter><AboutTab /></MemoryRouter>);
    fireEvent.click(refButton('Psalm 141:2'));
    fireEvent.click(refButton('Revelation 5:8'));
    expect(refButton('Psalm 141:2').getAttribute('aria-expanded')).toBe('false');
    expect(refButton('Revelation 5:8').getAttribute('aria-expanded')).toBe('true');
  });
});
