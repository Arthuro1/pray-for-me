// Progressive group tools: search and status filters exist only when the
// group's data makes them useful — a tiny group keeps a clean wall.
import { describe, it, expect } from 'vitest';
import { groupListControls, SEARCH_MIN_REQUESTS } from './groupTools';

const active = (id) => ({ id, is_answered: false });
const answered = (id) => ({ id, is_answered: true });

describe('groupListControls', () => {
  it('hides both controls for a tiny all-active group', () => {
    expect(groupListControls([active('a'), active('b')])).toEqual({ search: false, statusFilter: false });
  });

  it('hides everything for an empty group (the empty state carries one Add action)', () => {
    expect(groupListControls([])).toEqual({ search: false, statusFilter: false });
  });

  it('reveals search once the list is long enough to need it', () => {
    const list = Array.from({ length: SEARCH_MIN_REQUESTS }, (_, i) => active(String(i)));
    expect(groupListControls(list).search).toBe(true);
    expect(groupListControls(list.slice(1)).search).toBe(false);
  });

  it('reveals the status filter only when BOTH states exist', () => {
    expect(groupListControls([active('a'), answered('b')]).statusFilter).toBe(true);
    expect(groupListControls([answered('a'), answered('b')]).statusFilter).toBe(false);
    expect(groupListControls([active('a'), active('b')]).statusFilter).toBe(false);
  });
});
