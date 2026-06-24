import { describe, it, expect } from 'vitest';
import { testimonyList } from './prayer.js';

describe('testimonyList', () => {
  it('returns the testimonies array when present', () => {
    const arr = [{ id: '1', content: 'Praise', created_at: 'x' }];
    expect(testimonyList({ testimonies: arr })).toBe(arr);
  });

  it('falls back to the legacy single testimony field', () => {
    const out = testimonyList({ testimony: 'Old one', answered_at: '2026-01-01' });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: 'legacy', content: 'Old one', created_at: '2026-01-01' });
  });

  it('prefers the array over the legacy field', () => {
    const arr = [{ id: '1', content: 'New', created_at: 'x' }];
    expect(testimonyList({ testimonies: arr, testimony: 'Old' })).toBe(arr);
  });

  it('returns an empty array when there is nothing', () => {
    expect(testimonyList({})).toEqual([]);
    expect(testimonyList(null)).toEqual([]);
  });
});
