import { testimonyList } from './prayer';

// Builds a portable, human-readable snapshot of the user's prayer journal.
// Pure (no I/O) so it can be unit-tested; the caller turns it into a download.
export function buildExport(prayers = [], categories = []) {
  const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  return {
    app: 'Pray4Me',
    version: 1,
    exported_at: new Date().toISOString(),
    categories: categories.map((c) => ({
      name: c.name, emoji: c.emoji, color: c.color, week_days: c.week_days || [],
    })),
    prayers: prayers.map((p) => ({
      title: p.title,
      description: p.description || '',
      status: p.status,
      categories: (p.prayer_categories || []).map((pc) => catName[pc.category_id]).filter(Boolean),
      prayer_points: (p.prayer_points || []).map((pp) => ({ title: pp.title, verses: pp.verses || [] })),
      updates: (p.prayer_updates || []).map((u) => ({ text: u.text, created_at: u.created_at })),
      testimonies: testimonyList(p).map((tm) => ({ content: tm.content, created_at: tm.created_at })),
      created_at: p.created_at,
      answered_at: p.answered_at || null,
    })),
  };
}
