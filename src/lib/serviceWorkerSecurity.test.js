import { describe, expect, it, vi } from 'vitest';
import {
  LEGACY_USER_CACHE_NAMES,
  clearServiceWorkerUserCaches,
  deleteLegacyUserCaches,
} from './serviceWorkerSecurity';

describe('service-worker user cache cleanup', () => {
  it('deletes every legacy authenticated cache during an upgrade', async () => {
    const cacheStorage = { delete: vi.fn().mockResolvedValue(true) };
    await deleteLegacyUserCaches(cacheStorage);
    expect(cacheStorage.delete).toHaveBeenCalledTimes(LEGACY_USER_CACHE_NAMES.length);
    expect(cacheStorage.delete).toHaveBeenCalledWith('supabase-cache');
  });

  it('deletes locally and tells all worker states to clear on sign-out', async () => {
    const postMessage = vi.fn();
    const cacheStorage = { delete: vi.fn().mockResolvedValue(true) };
    const serviceWorker = {
      controller: { postMessage },
      getRegistration: vi.fn().mockResolvedValue({
        active: { postMessage }, waiting: { postMessage }, installing: { postMessage },
      }),
    };
    await clearServiceWorkerUserCaches({ cacheStorage, serviceWorker });
    expect(cacheStorage.delete).toHaveBeenCalledWith('supabase-cache');
    expect(postMessage).toHaveBeenCalledTimes(4);
  });
});
