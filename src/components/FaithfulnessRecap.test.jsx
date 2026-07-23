// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));

import FaithfulnessRecap from './FaithfulnessRecap';
import { t } from '../i18n';

const lang = 'fr';
const prayers = [
  {
    id: 'family',
    title: 'Paix dans la famille',
    status: 'answered',
    answered_at: '2026-07-12T12:00:00Z',
    prayer_testimonies: [{ id: 'tm1', content: 'La relation a été restaurée' }],
  },
  {
    id: 'work',
    title: 'Nouveau travail',
    status: 'answered',
    answered_at: '2026-07-04T12:00:00Z',
    prayer_testimonies: [{ id: 'tm2', content: 'Une porte inattendue' }],
  },
];

const renderRecap = () => render(
  <FaithfulnessRecap prayers={prayers} lang={lang} tr={(text) => text} />
);

afterEach(cleanup);

describe('FaithfulnessRecap', () => {
  it('opens as a private monthly reflection and closes with Escape', () => {
    renderRecap();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'faithfulnessRecapTitle'), 'i') }));

    const dialog = screen.getByRole('dialog', { name: t(lang, 'faithfulnessRecapTitle') });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('Paix dans la famille')).toBeTruthy();
    expect(screen.getByText('“La relation a été restaurée”')).toBeTruthy();
    expect(screen.getByText(t(lang, 'faithfulnessRecapPrivate'))).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: t(lang, 'faithfulnessRecapTitle') })).toBeNull();
  });

  it('starts sharing with no private content selected and requires a preview', () => {
    renderRecap();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'faithfulnessRecapTitle'), 'i') }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'faithfulnessPrepareShare') }));

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.every((checkbox) => !checkbox.checked)).toBe(true);
    expect(screen.getByRole('button', { name: t(lang, 'faithfulnessPreviewAction') }).disabled).toBe(true);
  });

  it('previews only explicitly selected content before sharing', () => {
    renderRecap();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'faithfulnessRecapTitle'), 'i') }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'faithfulnessPrepareShare') }));

    fireEvent.click(screen.getByRole('checkbox', { name: 'Paix dans la famille' }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'faithfulnessPreviewAction') }));

    expect(screen.getByText(t(lang, 'faithfulnessPreviewTitle'))).toBeTruthy();
    expect(screen.getByText(/• Paix dans la famille/)).toBeTruthy();
    expect(screen.queryByText(/La relation a été restaurée/)).toBeNull();
    expect(screen.queryByText(/Nouveau travail/)).toBeNull();
  });
});
