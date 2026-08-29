import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';

// Loads the REAL service-worker file (public/push-sw.js) into a mocked SW global
// and drives its push / notificationclick handlers — so these assertions cover
// exactly what ships, not a re-implementation.
const SW_CODE = readFileSync(new URL('../../public/push-sw.js', import.meta.url), 'utf8');

function makeSelf(clientsList = []) {
  const self = {
    handlers: {},
    addEventListener: (type, cb) => { self.handlers[type] = cb; },
    location: { origin: 'https://app.example' },
    registration: { showNotification: vi.fn(() => Promise.resolve()) },
    clients: {
      matchAll: vi.fn(() => Promise.resolve(clientsList)),
      openWindow: vi.fn(() => Promise.resolve()),
    },
  };
  new Function('self', SW_CODE)(self);
  return self;
}

function firePush(self, data) {
  let waited;
  self.handlers.push({ data, waitUntil: (p) => { waited = p; } });
  return waited;
}

function fireClick(self, notification) {
  let waited;
  self.handlers.notificationclick({ notification, waitUntil: (p) => { waited = p; } });
  return waited;
}

describe('push-sw push handler', () => {
  it('displays a valid payload and preserves url + notificationId', async () => {
    const self = makeSelf([]);
    await firePush(self, { json: () => ({ title: 'T', body: 'B', url: '/community/group/g/prayer/p', tag: 'x', notificationId: 'n1' }) });
    expect(self.registration.showNotification).toHaveBeenCalledWith('T', expect.objectContaining({
      body: 'B', tag: 'x', data: { url: '/community/group/g/prayer/p', notificationId: 'n1' },
    }));
  });

  it('falls back safely for a malformed (non-JSON) payload', async () => {
    const self = makeSelf([]);
    await firePush(self, { json: () => { throw new Error('bad'); } });
    expect(self.registration.showNotification).toHaveBeenCalledWith('Praystead 🙏', expect.objectContaining({
      data: { url: '/', notificationId: null },
    }));
  });

  it('never trusts an external origin in the payload url', async () => {
    const self = makeSelf([]);
    await firePush(self, { json: () => ({ title: 'T', url: 'https://evil.example/steal' }) });
    const arg = self.registration.showNotification.mock.calls[0][1];
    expect(arg.data.url).toBe('/');
  });

  it('suppresses the push when a visible window is already on the target route', async () => {
    const self = makeSelf([{ url: 'https://app.example/community', visibilityState: 'visible' }]);
    await firePush(self, { json: () => ({ title: 'T', url: '/community' }) });
    expect(self.registration.showNotification).not.toHaveBeenCalled();
  });
});

describe('push-sw notificationclick handler', () => {
  it('focuses and navigates an existing window instead of opening a new one', async () => {
    const focus = vi.fn();
    const navigate = vi.fn(() => Promise.resolve());
    const self = makeSelf([{ url: 'https://app.example/x', navigate, focus }]);
    await fireClick(self, { close: vi.fn(), data: { url: '/community' } });
    expect(navigate).toHaveBeenCalledWith('https://app.example/community');
    expect(focus).toHaveBeenCalled();
    expect(self.clients.openWindow).not.toHaveBeenCalled();
  });

  it('opens a new window when none exists', async () => {
    const self = makeSelf([]);
    await fireClick(self, { close: vi.fn(), data: { url: '/community' } });
    expect(self.clients.openWindow).toHaveBeenCalledWith('https://app.example/community');
  });

  it('normalizes an external data url back to the app origin', async () => {
    const self = makeSelf([]);
    await fireClick(self, { close: vi.fn(), data: { url: 'https://evil.example' } });
    expect(self.clients.openWindow).toHaveBeenCalledWith('https://app.example/');
  });
});
