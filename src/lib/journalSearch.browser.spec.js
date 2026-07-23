import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EMPTY_JOURNAL_FILTERS,
  filterJournalPrayers,
} from './journalSearch';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('private journal retrieval in a real browser', () => {
  it('searches decrypted updates and testimonies without a network request', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const prayers = [
      {
        id: 'active',
        title: 'Marc',
        status: 'active',
        prayer_updates: [{ text: 'Opération réussie' }],
        prayer_testimonies: [],
        prayer_categories: [],
      },
      {
        id: 'answered',
        title: 'Family',
        status: 'answered',
        prayer_updates: [],
        prayer_testimonies: [{ content: 'Relationship restored' }],
        prayer_categories: [],
      },
    ];

    expect(filterJournalPrayers({
      prayers,
      status: 'active',
      query: 'operation',
    }).map(({ prayer }) => prayer.id)).toEqual(['active']);
    expect(filterJournalPrayers({
      prayers,
      status: 'answered',
      query: 'restored',
    }).map(({ prayer }) => prayer.id)).toEqual(['answered']);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('applies group filters only to the local share map', () => {
    const prayers = [{
      id: 'shared',
      title: 'Request',
      status: 'active',
      prayer_updates: [],
      prayer_testimonies: [],
      prayer_categories: [],
    }];
    const results = filterJournalPrayers({
      prayers,
      status: 'active',
      prayerShares: { shared: [{ groupName: 'Hope Group' }] },
      filters: { ...EMPTY_JOURNAL_FILTERS, source: 'group:Hope Group' },
    });
    expect(results.map(({ prayer }) => prayer.id)).toEqual(['shared']);
  });
});
