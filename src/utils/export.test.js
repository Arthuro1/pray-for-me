import { describe, it, expect } from 'vitest';
import { buildExport } from './export.js';

describe('buildExport', () => {
  const categories = [
    { id: 'c1', name: 'Family', emoji: '👨‍👩‍👧', color: '#f00', week_days: [1, 3] },
    { id: 'c2', name: 'Health', emoji: '❤️', color: '#0f0' },
  ];
  const prayers = [
    {
      title: 'Heal mum', description: 'd', status: 'answered',
      prayer_categories: [{ category_id: 'c2' }, { category_id: 'unknown' }],
      prayer_points: [{ title: 'point', verses: [{ ref: 'Ps 23' }] }],
      prayer_updates: [{ text: 'better', created_at: '2026-01-02' }],
      testimonies: [{ id: 't', content: 'healed!', created_at: '2026-01-05' }],
      created_at: '2026-01-01', answered_at: '2026-01-05',
    },
  ];

  it('maps category ids to names and drops unknown ones', () => {
    const out = buildExport(prayers, categories);
    expect(out.prayers[0].categories).toEqual(['Health']);
  });

  it('includes points, updates and testimonies in readable form', () => {
    const p = buildExport(prayers, categories).prayers[0];
    expect(p.prayer_points[0]).toEqual({ title: 'point', verses: [{ ref: 'Ps 23' }] });
    expect(p.updates).toEqual([{ text: 'better', created_at: '2026-01-02' }]);
    expect(p.testimonies).toEqual([{ content: 'healed!', created_at: '2026-01-05' }]);
    expect(p.answered_at).toBe('2026-01-05');
  });

  it('carries an app tag and category list, and is empty-safe', () => {
    const out = buildExport();
    expect(out.app).toBe('Pray4Me');
    expect(out.prayers).toEqual([]);
    expect(out.categories).toEqual([]);
  });
});
