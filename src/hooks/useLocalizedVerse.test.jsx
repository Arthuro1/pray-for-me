// @vitest-environment jsdom
//
// useLocalizedVerse is the shared resolver behind every prayer verse (the Pray-now
// session and the prayer-detail pills). Its contract: return an authoritative
// { ref, text } pair — both in the reader's language — or null, so callers can keep
// the stored reference and text together. It must NEVER hand back a mixed pair.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';

vi.mock('../lib/verseText', () => ({ fetchScriptureText: vi.fn() }));

import { useLocalizedVerse } from './useLocalizedVerse';
import { fetchScriptureText } from '../lib/verseText';

afterEach(cleanup);
beforeEach(() => vi.mocked(fetchScriptureText).mockReset());

describe('useLocalizedVerse', () => {
  it('resolves a non-English reference to a localized ref + authoritative text', async () => {
    vi.mocked(fetchScriptureText).mockResolvedValue({ text: 'The LORD is my shepherd' });

    const { result } = renderHook(() => useLocalizedVerse('Psaume 23:1', 'en'));

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toEqual({ ref: 'Psalm 23:1', text: 'The LORD is my shepherd' });

    // The reference was localized before lookup, and a deterministic USFM id was
    // supplied so no AI reference→USFM round-trip is needed.
    expect(fetchScriptureText).toHaveBeenCalledWith({ reference: 'Psalm 23:1', lang: 'en', usfm: 'PSA.23.1' });
  });

  it('returns null when no authoritative text exists (caller keeps the original pair)', async () => {
    vi.mocked(fetchScriptureText).mockResolvedValue(null);

    const { result } = renderHook(() => useLocalizedVerse('Jean 3:16', 'en'));

    // Give the (resolved-null) promise a turn; state must stay null, never a
    // localized ref beside stale text.
    await waitFor(() => expect(fetchScriptureText).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  it('does nothing without a reference', () => {
    const { result } = renderHook(() => useLocalizedVerse('', 'en'));
    expect(result.current).toBeNull();
    expect(fetchScriptureText).not.toHaveBeenCalled();
  });
});
