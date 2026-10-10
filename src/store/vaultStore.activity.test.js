import { beforeEach, describe, expect, it, vi } from 'vitest';

const activity = vi.hoisted(() => ({ reset: vi.fn() }));
vi.mock('../lib/crypto/keyManager', () => ({
  isVaultInitialized: () => false, isUnlocked: () => false,
  onLockChange: () => {}, resetAutoLock: activity.reset,
}));
vi.mock('../lib/crypto/accountKey', () => ({ lockAccountKey: vi.fn(), rememberAccountKey: vi.fn() }));
vi.mock('../lib/vaultSync', () => ({ pushVaultRecord: vi.fn() }));
vi.mock('../lib/analytics', () => ({ track: vi.fn(), EVENTS: {} }));
vi.mock('./translationStore', () => ({ clearTranslationCache: vi.fn() }));
vi.mock('../lib/aiResultCache', () => ({ clearAllAiResultCaches: vi.fn() }));
vi.mock('../lib/aiCore', () => ({ resetAiRequestState: vi.fn() }));

// Real EventTargets exercise which surface receives the visibility event.
const browserWindow = new EventTarget();
const browserDocument = new EventTarget();
browserDocument.visibilityState = 'visible';
vi.stubGlobal('window', browserWindow);
vi.stubGlobal('document', browserDocument);
await import('./vaultStore');

beforeEach(() => {
  activity.reset.mockClear();
  browserDocument.visibilityState = 'visible';
});

describe('vault user activity events', () => {
  it('does not extend the deadline on a hidden document event', () => {
    browserDocument.visibilityState = 'hidden';
    browserDocument.dispatchEvent(new Event('visibilitychange'));
    expect(activity.reset).not.toHaveBeenCalled();
    browserDocument.visibilityState = 'visible';
    browserDocument.dispatchEvent(new Event('visibilitychange'));
    expect(activity.reset).toHaveBeenCalledTimes(1);
  });

  it('checks the deadline on focus, typing and pointer interaction', () => {
    for (const event of ['focus', 'keydown', 'pointerdown']) browserWindow.dispatchEvent(new Event(event));
    expect(activity.reset).toHaveBeenCalledTimes(3);
  });
});
