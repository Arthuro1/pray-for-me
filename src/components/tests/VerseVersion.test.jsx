// @vitest-environment jsdom
//
// The version tag must name the EXACT edition a verse's wording came from, so the
// reader can verify it. Two things matter most:
//   1. Source-accuracy: bundle and YouVersion are DIFFERENT translations for some
//      languages (e.g. zh: 和合本 vs CCB), so the label follows the source, not
//      just the language.
//   2. A bare reference is attributed to the edition its "open in Bible" link opens.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';

vi.mock('../../lib/verseBundle', () => ({ getBundledVerse: vi.fn() }));

import VerseVersion from '../VerseVersion';
import { getBundledVerse } from '../../lib/verseBundle';

beforeEach(() => { vi.mocked(getBundledVerse).mockResolvedValue(null); });
afterEach(cleanup);

describe('VerseVersion — source-accurate labelling', () => {
  it('labels YouVersion-sourced text with the licensed edition', () => {
    const { container } = render(<VerseVersion source="youversion" lang="zh" reference="约翰福音 3:16" />);
    expect(container.textContent).toContain('CCB');
  });

  it('labels bundle-sourced text with the offline edition — different from YouVersion', () => {
    const { container } = render(<VerseVersion source="bundle" lang="zh" reference="约翰福音 3:16" />);
    // Same language, different source → different (correct) translation label.
    expect(container.textContent).toContain('和合本');
    expect(container.textContent).not.toContain('CCB');
  });

  it('renders nothing when the source/edition is unknown', () => {
    const { container } = render(<VerseVersion source="ai" lang="zh" reference="约翰福音 3:16" />);
    expect(container.textContent).toBe('');
  });
});

describe('VerseVersion — bare reference resolution', () => {
  it('uses the offline edition when the verse ships in the bundle (what the app shows)', async () => {
    vi.mocked(getBundledVerse).mockResolvedValue({ text: '...', ref: 'x', source: 'bundle' });
    const { container } = render(<VerseVersion lang="zh" reference="约翰福音 3:16" />);
    await waitFor(() => expect(container.textContent).toContain('和合本'));
  });

  it('falls back to the edition the Bible link opens when not bundled', async () => {
    vi.mocked(getBundledVerse).mockResolvedValue(null);
    const { container } = render(<VerseVersion lang="zh" reference="约翰福音 3:16" />);
    await waitFor(() => expect(container.textContent).toContain('CCB'));
  });
});
