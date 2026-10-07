import { describe, expect, it } from 'vitest';
import {
  EMPTY_JOURNAL_FILTERS,
  filterJournalPrayers,
  journalFilterOptions,
  journalFiltersActive,
  journalSearchMatch,
} from './journalSearch';

const prayer = (id, extra = {}) => ({
  id,
  title: `Prayer ${id}`,
  description: '',
  status: 'active',
  prayer_categories: [],
  prayer_updates: [],
  prayer_testimonies: [],
  ...extra,
});

describe('private journal search', () => {
  it.each([
    ['description', prayer('description', { description: 'Recovery after surgery' }), 'surgery'],
    ['person', prayer('person', { person_name: 'Marc Dupont' }), 'marc'],
    ['update', prayer('update', { prayer_updates: [{ text: 'The scan was clear' }] }), 'scan'],
    ['testimony', prayer('testimony', { prayer_testimonies: [{ content: 'Peace returned to our home' }] }), 'peace'],
    ['testimony', prayer('legacy', { testimony: 'A door opened for work' }), 'door'],
  ])('matches %s content already held locally', (field, row, query) => {
    expect(journalSearchMatch(row, query)).toMatchObject({ field });
  });

  it('matches cached translated text without making search responsible for translation', () => {
    const row = prayer('translated', { description: 'Healing' });
    expect(journalSearchMatch(row, 'guérison', (text) => text === 'Healing' ? 'Guérison' : text))
      .toMatchObject({ field: 'description', text: 'Healing' });
  });

  it('supports multi-word queries across fields and ignores diacritics', () => {
    const row = prayer('multi', {
      person_name: 'Élodie',
      prayer_updates: [{ text: 'Operation successful' }],
    });
    expect(journalSearchMatch(row, 'elodie operation')).toMatchObject({ field: 'update' });
  });

  it('does not inspect content while a prayer is locked', () => {
    expect(journalSearchMatch(prayer('locked', { _locked: true, title: 'Secret' }), 'secret')).toBeNull();
  });
});

describe('journal retrieval filters', () => {
  const rows = [
    prayer('personal', {
      person_name: 'Anna',
      prayer_categories: [{ category_id: 'family' }],
    }),
    prayer('shared', {
      person_name: 'Marc',
      prayer_categories: [{ category_id: 'health' }],
    }),
    prayer('saved', {
      status: 'answered',
      community_origin_id: 'community-1',
      origin_group_name: 'Hope Group',
      answered_at: '2026-07-10T10:00:00Z',
      prayer_testimonies: [{ content: 'The treatment worked' }],
    }),
    prayer('older', {
      status: 'answered',
      answered_at: '2026-05-10T10:00:00Z',
    }),
  ];
  const prayerShares = {
    shared: [{ groupName: 'Hope Group' }, { groupName: 'Hope Group' }],
  };

  it('searches both active and answered segments', () => {
    expect(filterJournalPrayers({
      prayers: rows,
      status: 'answered',
      query: 'treatment',
    }).map(({ prayer: row }) => row.id)).toEqual(['saved']);
  });

  it('filters by category, person, personal source, and a specific group', () => {
    const withFilter = (patch) => filterJournalPrayers({
      prayers: rows,
      status: 'active',
      prayerShares,
      filters: { ...EMPTY_JOURNAL_FILTERS, ...patch },
    }).map(({ prayer: row }) => row.id);

    expect(withFilter({ category: 'family' })).toEqual(['personal']);
    expect(withFilter({ person: 'marc' })).toEqual(['shared']);
    expect(withFilter({ source: 'personal' })).toEqual(['personal', 'shared']);
    expect(withFilter({ source: 'group:Hope Group' })).toEqual(['shared']);
  });

  // A guided plan run is a prayer carrying schedule.plan, so it sits in Active
  // beside ordinary requests. "Prayer plans" is how a reader asks for only the
  // journeys they are walking.
  it('filters down to guided plan runs', () => {
    const withPlan = [
      ...rows,
      prayer('plan', {
        schedule: {
          type: 'recurring', freq: 'daily', startDate: '2026-01-01',
          end: { kind: 'count', count: 3 },
          plan: { id: 'fast3', startDate: '2026-01-01' },
        },
      }),
    ];
    expect(filterJournalPrayers({
      prayers: withPlan,
      status: 'active',
      filters: { ...EMPTY_JOURNAL_FILTERS, source: 'plan' },
    }).map(({ prayer: row }) => row.id)).toEqual(['plan']);
    expect(journalFilterOptions(withPlan).hasPlans).toBe(true);
  });

  it('filters answered prayers by this month or earlier', () => {
    const now = new Date('2026-07-23T12:00:00Z');
    const withDate = (answeredDate) => filterJournalPrayers({
      prayers: rows,
      status: 'answered',
      now,
      filters: { ...EMPTY_JOURNAL_FILTERS, answeredDate },
    }).map(({ prayer: row }) => row.id);

    expect(withDate('month')).toEqual(['saved']);
    expect(withDate('earlier')).toEqual(['older']);
  });

  it('derives deduplicated local person and group options', () => {
    expect(journalFilterOptions(rows, prayerShares)).toEqual({
      people: ['Anna', 'Marc'],
      groups: ['Hope Group'],
      hasPersonal: true,
      hasPlans: false,
      // No prayer has been placed in a circle, so no circle filter is offered.
      circles: [],
    });
  });

  it('offers only the Intercession Circles in use, inner to outer', () => {
    const placed = [
      { id: 'c1', status: 'active', title: 'Nation', circle: 'nations' },
      { id: 'c2', status: 'active', title: 'Home', circle: 'household' },
      { id: 'c3', status: 'active', title: 'Unplaced' },
      { id: 'c4', status: 'active', title: 'Odd', circle: 'not-a-circle' },
    ];
    expect(journalFilterOptions(placed).circles).toEqual(['household', 'nations']);
  });

  it('filters by circle, and "none" finds the prayers not yet placed', () => {
    const placed = [
      { id: 'c1', status: 'active', title: 'Nation', circle: 'nations' },
      { id: 'c2', status: 'active', title: 'Home', circle: 'household' },
      { id: 'c3', status: 'active', title: 'Unplaced' },
    ];
    const ids = (circle) => filterJournalPrayers({ prayers: placed, status: 'active', filters: { ...EMPTY_JOURNAL_FILTERS, circle } })
      .map(({ prayer }) => prayer.id);
    expect(ids('household')).toEqual(['c2']);
    expect(ids('none')).toEqual(['c3']);
    expect(ids('all')).toEqual(['c1', 'c2', 'c3']);
    expect(journalFiltersActive({ ...EMPTY_JOURNAL_FILTERS, circle: 'none' }, 'active')).toBe(true);
  });

  it('looks back over answered prayers by circle — carried requests included — without counting anything', () => {
    const remembered = [
      { id: 'a1', status: 'answered', title: 'Sarah', circle: 'household', answered_at: '2026-03-01T00:00:00Z' },
      { id: 'a2', status: 'answered', title: 'Group request', circle: 'household', community_origin_id: 'c-1', origin_group_name: 'Église', answered_at: '2026-04-01T00:00:00Z' },
      { id: 'a3', status: 'answered', title: 'Our church', circle: 'church', answered_at: '2026-05-01T00:00:00Z' },
      { id: 'x1', status: 'active', title: 'Still carried', circle: 'household' },
    ];
    const ids = filterJournalPrayers({ prayers: remembered, status: 'answered', filters: { ...EMPTY_JOURNAL_FILTERS, circle: 'household' } })
      .map(({ prayer }) => prayer.id);
    expect(ids.sort()).toEqual(['a1', 'a2']);
    expect(journalFiltersActive({ ...EMPTY_JOURNAL_FILTERS, circle: 'household' }, 'answered')).toBe(true);
  });

  it('does not count an answered-date choice as active-segment filtering', () => {
    const filters = { ...EMPTY_JOURNAL_FILTERS, answeredDate: 'month' };
    expect(journalFiltersActive(filters, 'active')).toBe(false);
    expect(journalFiltersActive(filters, 'answered')).toBe(true);
  });
});
