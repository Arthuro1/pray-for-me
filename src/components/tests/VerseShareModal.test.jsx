// @vitest-environment jsdom
//
// The share sheet has to survive a device that can't draw the card: jsdom has no
// 2D canvas, exactly like a locked-down browser, so this pins the degraded path —
// no image, no image actions, but the verse still leaves as text, with its
// edition, and a reference-only verse copies the reference alone rather than
// empty quotation marks.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import VerseShareModal from '../VerseShareModal';
import { t } from '../../i18n';

const lang = 'fr';
const dayKey = '2026-08-25';
let writeText;

beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

afterEach(cleanup);

const open = (verse) => render(
  <VerseShareModal verse={verse} lang={lang} dayKey={dayKey} onClose={() => {}} />
);

describe('VerseShareModal without a canvas', () => {
  it('names the verse and offers the text actions instead of a broken preview', async () => {
    open({ ref: 'Psaume 145:18', text: 'L’Éternel est près de tous ceux qui l’invoquent.' });

    expect(screen.getByRole('dialog', { name: t(lang, 'shareVerse') })).toBeTruthy();
    expect(screen.getByText('Psaume 145:18')).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole('img')).toBeNull());
    expect(screen.queryByText(t(lang, 'verseSaveImage'))).toBeNull();
    expect(screen.getByText(t(lang, 'verseCopyText'))).toBeTruthy();
  });

  it('copies the verse with its edition and the app link', async () => {
    open({ ref: 'Philippiens 4:6', text: 'Ne vous inquiétez de rien.', source: 'youversion' });

    screen.getByText(t(lang, 'verseCopyText')).click();

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copied = writeText.mock.calls[0][0];
    expect(copied).toContain('Ne vous inquiétez de rien.');
    expect(copied).toContain('Philippiens 4:6');
    // An edition we know is cited, so the quotation can be checked.
    expect(copied).toMatch(/\(.+\)/);
  });

  it('copies the reference alone when no authoritative text exists', async () => {
    open({ ref: 'Ésaïe 41:10', text: '' });

    screen.getByText(t(lang, 'verseCopyText')).click();

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0][0]).toContain('Ésaïe 41:10');
    expect(writeText.mock.calls[0][0]).not.toContain('“');
  });
});
