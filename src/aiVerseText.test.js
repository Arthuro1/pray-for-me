// Guard, not a unit test: AI output must never reach the reader as Bible text
// (CLAUDE.md "Scripture rule"; docs/QETORET_IDENTITY.md §9). Even if the model
// sends verse wording anyway, the client keeps references only — the text comes
// from the authoritative pipeline (lib/verseText.js) or a link to the reader's
// own Bible. If this fails, fix the parser, not the test.
import { describe, expect, it, vi } from 'vitest';

const reply = vi.hoisted(() => ({ data: null }));
vi.mock('./lib/aiCore', () => ({
  callClaudeForJson: async () => ({ data: reply.data, error: null }),
  localizeAiError: (error) => error,
}));

import { getScriptureGuidance } from './scriptureGuidance';
import { getAIRecommendations } from './aiRecommendations';

describe('AI suggestions carry Scripture references, never Scripture text', () => {
  it('drops verse wording from Scripture-first guidance', async () => {
    reply.data = {
      passages: [{ ref: 'Psalm 23', readWhole: 'Psalm 23', text: 'AI-WRITTEN VERSE WORDING', why: 'Trust in the shepherd' }],
      context: 'Context.',
      themes: ['trust'],
      reflections: ['Where do you need rest?'],
    };
    const { guidance } = await getScriptureGuidance({ title: 'Unique title for this guard', lang: 'en' });
    expect(guidance.passages).toEqual([{ ref: 'Psalm 23', readWhole: 'Psalm 23', why: 'Trust in the shepherd' }]);
    expect(JSON.stringify(guidance)).not.toContain('AI-WRITTEN VERSE WORDING');
  });

  it('drops verse wording from suggested prayer points', async () => {
    reply.data = [{ title: 'Pray for peace', verses: [{ ref: 'John 14:27', text: 'AI-WRITTEN VERSE WORDING' }, { ref: 'Philippians 4:6-7' }] }];
    const { recs } = await getAIRecommendations({ title: 'Another unique guard title', lang: 'en' });
    expect(recs[0].verses).toEqual([{ ref: 'John 14:27' }, { ref: 'Philippians 4:6-7' }]);
    expect(JSON.stringify(recs)).not.toContain('AI-WRITTEN VERSE WORDING');
  });
});
