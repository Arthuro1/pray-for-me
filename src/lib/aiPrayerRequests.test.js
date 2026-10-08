import { beforeEach, describe, expect, it, vi } from 'vitest';

const shared = vi.hoisted(() => ({ settings: {}, cacheWait: null }));
const callAiForJson = vi.hoisted(() => vi.fn(async () => ({ data: null, error: null })));
vi.mock('./aiCore', () => ({ callAiForJson, localizeAiError: () => 'Error' }));
vi.mock('./aiClient', () => ({ AI_MODEL_HINT: 'test-model' }));
vi.mock('./aiResultCache', () => ({
  createAiCache: () => new Map(),
  aiCacheKey: async () => { if (shared.cacheWait) await shared.cacheWait; return crypto.randomUUID(); },
}));
vi.mock('../store/authStore', () => ({ default: { getState: () => ({ user: { id: 'u1' } }) } }));
vi.mock('../store/prayerStore', () => ({ default: { getState: () => ({ settings: shared.settings }) } }));

import { getAIRecommendations } from '../aiRecommendations';
import { getScriptureGuidance } from '../scriptureGuidance';
import { preparePrayerAiInput } from './aiPrayerInput';

beforeEach(() => { shared.settings = {}; shared.cacheWait = null; callAiForJson.mockClear(); });

describe('prayer AI sends the reviewed text', () => {
  it.each(['recommendations', 'scripture'])('preserves the %s selection while awaiting a cache key', async (feature) => {
    const reviewedInput = { title: 'Contact test@example.com', description: '  A description. '.repeat(500).trim(), update: feature === 'recommendations' ? 'Latest update at test@example.com' : '' };
    const expected = preparePrayerAiInput(reviewedInput);
    let resolve;
    shared.cacheWait = new Promise((done) => { resolve = done; });
    const invoke = feature === 'recommendations' ? getAIRecommendations : getScriptureGuidance;
    const pending = invoke({ title: 'Original title', description: 'Different description', update: 'Different update', lang: 'en', reviewedInput });
    shared.settings = { aiSendDescription: false, aiSendUpdate: false };
    resolve();
    await pending;
    expect(callAiForJson).toHaveBeenCalledTimes(1);
    expect(callAiForJson.mock.calls[0][0].input).toMatchObject({
      title: expected.title,
      description: feature === 'recommendations' ? expected.context : expected.description,
      lang: 'en',
    });
  });
});
