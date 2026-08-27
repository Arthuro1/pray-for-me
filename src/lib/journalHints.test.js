// @vitest-environment jsdom
//
// The Journal points at its own tools once — in words, at the moment each starts
// being useful — and then never again. These tests pin when each hint may appear,
// that only one ever does, and that dismissing one is permanent.
import { beforeEach, describe, expect, it } from 'vitest';
import {
  JOURNAL_HINTS,
  JOURNAL_HINTS_STORAGE_KEY,
  journalToolsUseful,
  markJournalHintSeen,
  nextJournalHint,
  readJournalHints,
} from './journalHints';

const prayer = (id, extra = {}) => ({ id, title: `private-${id}`, status: 'active', ...extra });
const forPerson = (id, name) => prayer(id, { person_name: name });

beforeEach(() => localStorage.clear());

describe('the search / filter hint', () => {
  it('stays away while the journal is short enough to just read', () => {
    expect(nextJournalHint({ prayers: [prayer('p1'), prayer('p2'), prayer('p3')] })).toBeNull();
  });

  it('appears once the list is long enough for retrieval to matter', () => {
    const many = ['p1', 'p2', 'p3', 'p4'].map((id) => prayer(id));
    expect(nextJournalHint({ prayers: many })).toBe(JOURNAL_HINTS.SEARCH);
    expect(journalToolsUseful(many)).toBe(true);
  });

  it('says nothing to someone already searching or filtering', () => {
    const many = ['p1', 'p2', 'p3', 'p4'].map((id) => prayer(id));
    expect(nextJournalHint({ prayers: many, toolsInUse: true })).toBeNull();
  });
});

describe('the People hint', () => {
  const several = [forPerson('p1', 'Ana'), forPerson('p2', 'Ben'), forPerson('p3', 'Chidi')];

  it('appears only once praying for several people by name is real', () => {
    expect(nextJournalHint({ prayers: [forPerson('p1', 'Ana')] })).toBeNull();
    expect(nextJournalHint({ prayers: several })).toBe(JOURNAL_HINTS.PEOPLE);
  });

  it('says nothing while the People view is already open', () => {
    expect(nextJournalHint({ prayers: several, peopleOpen: true })).toBeNull();
  });

  it('wins over the generic search hint — it says something true about them', () => {
    const many = [...several, forPerson('p4', 'Dara')];
    expect(nextJournalHint({ prayers: many })).toBe(JOURNAL_HINTS.PEOPLE);
    // …and only then does the other one get its turn.
    expect(nextJournalHint({ prayers: many, seen: [JOURNAL_HINTS.PEOPLE] }))
      .toBe(JOURNAL_HINTS.SEARCH);
  });
});

describe('dismissal is permanent and content-free', () => {
  it('never returns after being dismissed', () => {
    const many = ['p1', 'p2', 'p3', 'p4'].map((id) => prayer(id));
    expect(nextJournalHint({ prayers: many })).toBe(JOURNAL_HINTS.SEARCH);
    markJournalHintSeen(JOURNAL_HINTS.SEARCH);
    expect(nextJournalHint({ prayers: many })).toBeNull();
  });

  it('stores one flag and nothing about the prayers themselves', () => {
    markJournalHintSeen(JOURNAL_HINTS.PEOPLE);
    const raw = localStorage.getItem(JOURNAL_HINTS_STORAGE_KEY);
    expect(JSON.parse(raw)).toEqual({ version: 1, seen: ['people'] });
    expect(raw).not.toContain('private');
    expect(raw).not.toContain('Ana');
  });

  it('ignores an unknown hint and survives a corrupt record', () => {
    expect(markJournalHintSeen('not-a-hint').seen).toEqual([]);
    localStorage.setItem(JOURNAL_HINTS_STORAGE_KEY, '{not json');
    expect(readJournalHints()).toEqual({ version: 1, seen: [] });
  });
});
