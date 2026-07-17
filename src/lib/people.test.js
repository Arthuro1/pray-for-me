// People view grouping: derived entirely from existing prayer rows — person
// name, status, updates and per-prayer follow-ups — and hidden until there is
// enough person data to be useful.
import { describe, it, expect } from 'vitest';
import { peopleFromPrayers, peopleViewAvailable, MIN_PEOPLE_FOR_VIEW } from './people';

const prayer = (id, person, extra = {}) => ({
  id, title: `P ${id}`, status: 'active', person_name: person, prayer_updates: [], ...extra,
});

describe('peopleFromPrayers', () => {
  it('groups prayers by person (case-insensitive) with active/answered counts', () => {
    const people = peopleFromPrayers([
      prayer('a', 'Marc'),
      prayer('b', 'marc', { status: 'answered' }),
      prayer('c', 'Julie'),
      prayer('d', ''), // no person → not in the view
    ]);
    expect(people.map((p) => p.name)).toEqual(['Julie', 'Marc']); // equal actives → alphabetical
    const marc = people.find((p) => p.name === 'Marc');
    expect(marc.prayers).toHaveLength(2);
    expect(marc.activeCount).toBe(1);
    expect(marc.answeredCount).toBe(1);
  });

  it('surfaces the latest update across all of a person\'s prayers', () => {
    const people = peopleFromPrayers([
      prayer('a', 'Marc', { prayer_updates: [{ id: 'u1', text: 'old', created_at: '2026-07-01' }] }),
      prayer('b', 'Marc', { prayer_updates: [{ id: 'u2', text: 'newer', created_at: '2026-07-15' }] }),
    ]);
    expect(people[0].latestUpdate.text).toBe('newer');
  });

  it('carries the earliest pending follow-up date as nextFollowUp', () => {
    const followUps = {
      a: { date: '2026-07-20', status: 'pending' },
      b: { date: '2026-07-18', status: 'pending' },
      c: { date: '2026-07-01', status: 'done' }, // not pending → ignored
    };
    const people = peopleFromPrayers([prayer('a', 'Marc'), prayer('b', 'Marc'), prayer('c', 'Marc')], followUps);
    expect(people[0].nextFollowUp).toBe('2026-07-18');
  });

  it('sorts people with the most active requests first', () => {
    const people = peopleFromPrayers([
      prayer('a', 'Julie'),
      prayer('b', 'Marc'),
      prayer('c', 'Marc'),
    ]);
    expect(people[0].name).toBe('Marc');
  });
});

describe('peopleViewAvailable', () => {
  it(`stays hidden below ${MIN_PEOPLE_FOR_VIEW} distinct people`, () => {
    expect(peopleViewAvailable([])).toBe(false);
    expect(peopleViewAvailable([prayer('a', 'Marc'), prayer('b', 'marc')])).toBe(false);
    expect(peopleViewAvailable([prayer('a', 'Marc'), prayer('b', 'Julie')])).toBe(true);
  });
});
