import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  faithfulnessMonths,
  faithfulnessShareText,
  testimonySelectionId,
} from './faithfulnessRecap';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('private faithfulness recap in a real browser', () => {
  it('builds the preview locally and includes only explicitly selected content', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const [month] = faithfulnessMonths([{
      id: 'family',
      title: 'Family',
      status: 'answered',
      answered_at: '2026-07-12T12:00:00Z',
      prayer_testimonies: [
        { id: 'public-choice', content: 'Relationship restored' },
        { id: 'private-default', content: 'Sensitive detail' },
      ],
    }]);

    expect(faithfulnessShareText({
      month,
      selectedIds: new Set(),
      heading: 'Remembering',
    })).toBe('');

    const preview = faithfulnessShareText({
      month,
      selectedIds: new Set([testimonySelectionId('family', 'public-choice', 0)]),
      heading: 'Remembering',
    });

    expect(preview).toContain('Relationship restored');
    expect(preview).not.toContain('Sensitive detail');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
