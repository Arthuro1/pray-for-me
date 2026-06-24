import { describe, it, expect } from 'vitest';
import { addItem, removeItem, bumpTries, isPermanentError, isAuthError } from './queueCore.js';

describe('addItem', () => {
  it('appends a mutation with id, kind, args and zeroed tries (FIFO order kept)', () => {
    let q = [];
    q = addItem(q, 'createPrayer', { title: 'A' }, 'id1', 1000);
    q = addItem(q, 'addUpdate', { text: 'B' }, 'id2', 2000);
    expect(q).toEqual([
      { id: 'id1', kind: 'createPrayer', args: { title: 'A' }, createdAt: 1000, tries: 0 },
      { id: 'id2', kind: 'addUpdate', args: { text: 'B' }, createdAt: 2000, tries: 0 },
    ]);
  });
  it('does not mutate the input queue', () => {
    const q = [];
    addItem(q, 'x', {}, 'id', 1);
    expect(q).toEqual([]);
  });
});

describe('removeItem', () => {
  it('drops the matching item only', () => {
    const q = [{ id: 'a' }, { id: 'b' }];
    expect(removeItem(q, 'a')).toEqual([{ id: 'b' }]);
  });
});

describe('bumpTries', () => {
  it('increments tries for the matching item immutably', () => {
    const q = [{ id: 'a', tries: 0 }, { id: 'b', tries: 1 }];
    const out = bumpTries(q, 'a');
    expect(out[0].tries).toBe(1);
    expect(q[0].tries).toBe(0);
  });
});

describe('isPermanentError', () => {
  it('treats 4xx as permanent', () => {
    expect(isPermanentError({ status: 400 })).toBe(true);
    expect(isPermanentError({ status: 404 })).toBe(true);
    expect(isPermanentError({ statusCode: 409 })).toBe(true);
  });
  it('treats auth/timeout/rate-limit as transient', () => {
    expect(isPermanentError({ status: 401 })).toBe(false);
    expect(isPermanentError({ status: 408 })).toBe(false);
    expect(isPermanentError({ status: 429 })).toBe(false);
  });
  it('treats network/unknown and 5xx as transient', () => {
    expect(isPermanentError({})).toBe(false);
    expect(isPermanentError(null)).toBe(false);
    expect(isPermanentError({ status: 500 })).toBe(false);
  });
});

describe('isAuthError', () => {
  it('detects 401', () => {
    expect(isAuthError({ status: 401 })).toBe(true);
    expect(isAuthError({ status: 403 })).toBe(false);
  });
});
