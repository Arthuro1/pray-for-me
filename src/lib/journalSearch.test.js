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
    });
  });

  it('does not count an answered-date choice as active-segment filtering', () => {
    const filters = { ...EMPTY_JOURNAL_FILTERS, answeredDate: 'month' };
    expect(journalFiltersActive(filters, 'active')).toBe(false);
    expect(journalFiltersActive(filters, 'answered')).toBe(true);
  });
});
