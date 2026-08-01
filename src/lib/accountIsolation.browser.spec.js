import { beforeEach, describe, expect, it } from 'vitest';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { clearLocalData, loadSnapshot } from './dataCache';
import { clearServiceWorkerUserCaches } from './serviceWorkerSecurity';

describe('cross-account offline isolation in a real browser', () => {
  beforeEach(async () => {
    await clearLocalData('account-a');
    await clearLocalData('account-b');
    await caches.delete('supabase-cache');
  });

  it('never exposes Account A data to Account B after sign-out and offline switch', async () => {
    const legacy = await caches.open('supabase-cache');
    await legacy.put('https://test.supabase.co/rest/v1/prayers', new Response('ACCOUNT_A_PRIVATE'));
    await idbSet('pfm_data_account-a', { prayers: [], marker: 'ACCOUNT_A_PRIVATE' });

    await clearLocalData('account-a');
    await clearServiceWorkerUserCaches();

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    await idbSet('pfm_data_account-b', { prayers: [], marker: 'ACCOUNT_B_PRIVATE' });

    expect(await loadSnapshot('account-b')).toMatchObject({ marker: 'ACCOUNT_B_PRIVATE' });
    expect(await loadSnapshot('account-a')).toBeNull();
    expect(await idbGet('pfm_data_account-a')).toBeUndefined();
    expect(await caches.has('supabase-cache')).toBe(false);
  });
});
