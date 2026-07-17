// @vitest-environment jsdom
//
// Grow-path progress: ONE recommended next step, with current progress taking
// priority over anything new, and completed guides retiring into History.
import { describe, it, expect, beforeEach } from 'vitest';
import { getGuideProgress, markGuideStarted, markGuideCompleted, recommendNext, completedGuides } from './guideProgress';

const guides = [{ id: 'g1' }, { id: 'g2' }, { id: 'g3' }];

beforeEach(() => localStorage.clear());

describe('recommendNext', () => {
  it('recommends the first new guide when nothing was started', () => {
    expect(recommendNext(guides, {})).toEqual({ type: 'new', guide: guides[0] });
  });

  it('an in-progress guide takes priority over new recommendations', () => {
    markGuideStarted('g2');
    expect(recommendNext(guides, getGuideProgress())).toEqual({ type: 'continue', guide: guides[1] });
  });

  it('a completed guide is no longer recommended — the next new one is', () => {
    markGuideStarted('g1');
    markGuideCompleted('g1');
    expect(recommendNext(guides, getGuideProgress())).toEqual({ type: 'new', guide: guides[1] });
  });

  it('when everything is completed, invites praying one again', () => {
    for (const g of guides) markGuideCompleted(g.id);
    expect(recommendNext(guides, getGuideProgress())).toEqual({ type: 'again', guide: guides[0] });
  });

  it('returns null when there are no guides', () => {
    expect(recommendNext([], {})).toBeNull();
  });
});

describe('progress record', () => {
  it('moves completed guides into History', () => {
    markGuideCompleted('g3');
    expect(completedGuides(guides, getGuideProgress()).map((g) => g.id)).toEqual(['g3']);
  });

  it('keeps the first started timestamp (continue stays honest across reopens)', () => {
    markGuideStarted('g1');
    const first = getGuideProgress().g1.startedAt;
    markGuideStarted('g1');
    expect(getGuideProgress().g1.startedAt).toBe(first);
  });

  it('survives corrupted storage by starting empty', () => {
    localStorage.setItem('pfm_guide_progress', '{not json');
    expect(getGuideProgress()).toEqual({});
  });
});
