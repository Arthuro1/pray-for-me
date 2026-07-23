import { describe, expect, it } from 'vitest';
import {
  faithfulnessMonths,
  faithfulnessShareText,
  prayerSelectionId,
  testimonySelectionId,
} from './faithfulnessRecap';

const prayer = (id, extra = {}) => ({
  id,
  title: `Prayer ${id}`,
  status: 'answered',
  answered_at: '2026-07-12T12:00:00Z',
  prayer_testimonies: [],
  ...extra,
});

describe('faithfulness recap', () => {
  it('groups answered prayers by month without treating them as a score', () => {
    const months = faithfulnessMonths([
      prayer('july'),
      prayer('may', { answered_at: '2026-05-04T12:00:00Z' }),
      prayer('active', { status: 'active' }),
    ]);

    expect(months.map((month) => month.key)).toEqual(['2026-07', '2026-05']);
    expect(months[0].prayers.map(({ prayer: item }) => item.id)).toEqual(['july']);
    expect(months[0]).not.toHaveProperty('score');
  });

  it('uses the gallery fallback date for answered community copies', () => {
    const [month] = faithfulnessMonths([
      prayer('shared', { answered_at: null, updated_at: '2026-06-20T12:00:00Z' }),
    ]);

    expect(month.key).toBe('2026-06');
  });

  it('returns no share text until content is explicitly selected', () => {
    const [month] = faithfulnessMonths([
      prayer('family', {
        title: 'Family',
        prayer_testimonies: [{ id: 'tm1', content: 'Relationship restored' }],
      }),
    ]);

    expect(faithfulnessShareText({
      month,
      selectedIds: new Set(),
      heading: 'Remembering',
    })).toBe('');
  });

  it('includes only the prayer titles and testimonies selected in the preview', () => {
    const [month] = faithfulnessMonths([
      prayer('family', {
        title: 'Family',
        prayer_testimonies: [{ id: 'tm1', content: 'Relationship restored' }],
      }),
      prayer('work', {
        title: 'Work',
        prayer_testimonies: [{ id: 'tm2', content: 'A new role opened' }],
      }),
    ]);

    const text = faithfulnessShareText({
      month,
      selectedIds: new Set([
        prayerSelectionId('family'),
        testimonySelectionId('work', 'tm2', 0),
      ]),
      heading: 'Remembering July',
    });

    expect(text).toContain('• Family');
    expect(text).toContain('“A new role opened” — Work');
    expect(text).not.toContain('Relationship restored');
    expect(text).not.toContain('• Work');
  });
});
