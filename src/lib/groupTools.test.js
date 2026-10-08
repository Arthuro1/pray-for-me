// Progressive group tools: search exists only when the group's data makes it
// useful — a tiny group keeps a clean wall.
import { describe, it, expect } from 'vitest';
import { groupListControls, SEARCH_MIN_REQUESTS } from './groupTools';

const active = (id) => ({ id, is_answered: false });

describe('groupListControls', () => {
  it('hides search for a tiny group', () => {
    expect(groupListControls([active('a'), active('b')])).toEqual({ search: false });
  });

  it('hides everything for an empty group (the empty state carries one Add action)', () => {
    expect(groupListControls([])).toEqual({ search: false });
  });

  it('reveals search once the list is long enough to need it', () => {
    const list = Array.from({ length: SEARCH_MIN_REQUESTS }, (_, i) => active(String(i)));
    expect(groupListControls(list).search).toBe(true);
    expect(groupListControls(list.slice(1)).search).toBe(false);
  });
});
