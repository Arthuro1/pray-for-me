// @vitest-environment jsdom
//
// Deleting content out of a posted update/testimony must never leave an empty
// author+date shell in the timeline: blanking the text keeps the row only
// while attachments remain, and removing the last attachment of a text-less
// entry deletes the whole row (locally + queued server delete, media cleanup).
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub the Supabase client (its realtime layer throws at construct time on older
// Node in CI) and the offline mutation queue (IndexedDB isn't in jsdom).
vi.mock('../lib/supabase', () => {
  const chain = {
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => chain,
    eq: () => Promise.resolve({ data: null, error: null }),
    select: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };
  return { supabase: { auth: { getUser: async () => ({ data: { user: null } }) }, from: () => chain } };
});
vi.mock('../lib/mutationQueue', () => ({ enqueue: vi.fn(), pendingPrayerIds: vi.fn(() => new Set()) }));
vi.mock('../lib/attachments', () => ({ removeAttachmentFiles: vi.fn() }));

import usePrayerStore from './prayerStore';
import { enqueue } from '../lib/mutationQueue';
import { removeAttachmentFiles } from '../lib/attachments';

const att = (id) => ({ id, type: 'link', url: `https://example.com/${id}` });

const seed = ({ updates = [], testimonies = [] } = {}) => ({
  id: 'p1',
  title: 'x',
  status: 'active',
  prayer_updates: updates,
  prayer_testimonies: testimonies,
});

const prayer = () => usePrayerStore.getState().prayers.find((x) => x.id === 'p1');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('update content deletion cascades', () => {
  it('blanks the text but keeps the row while attachments remain', async () => {
    usePrayerStore.setState({ prayers: [seed({ updates: [{ id: 'u1', text: 'news', attachments: [att('a1')] }] })] });
    await usePrayerStore.getState().removeUpdateText('p1', 'u1');
    expect(prayer().prayer_updates).toHaveLength(1);
    expect(prayer().prayer_updates[0].text).toBe('');
    expect(enqueue).toHaveBeenCalledWith('removeUpdateText', { updateId: 'u1' });
  });

  it('deletes the whole row when the text was its last content', async () => {
    usePrayerStore.setState({ prayers: [seed({ updates: [{ id: 'u1', text: 'news', attachments: [] }] })] });
    await usePrayerStore.getState().removeUpdateText('p1', 'u1');
    expect(prayer().prayer_updates).toHaveLength(0);
    expect(enqueue).toHaveBeenCalledWith('deleteUpdate', { updateId: 'u1' });
  });

  it('deletes the whole row when the last attachment of a text-less update goes', async () => {
    usePrayerStore.setState({ prayers: [seed({ updates: [{ id: 'u1', text: '', attachments: [att('a1')] }] })] });
    await usePrayerStore.getState().removeUpdateAttachment('p1', 'u1', 'a1');
    expect(prayer().prayer_updates).toHaveLength(0);
    expect(enqueue).toHaveBeenCalledWith('deleteUpdate', { updateId: 'u1' });
    expect(removeAttachmentFiles).toHaveBeenCalledWith([expect.objectContaining({ id: 'a1' })]);
  });

  it('keeps a row with text when its last attachment goes', async () => {
    usePrayerStore.setState({ prayers: [seed({ updates: [{ id: 'u1', text: 'news', attachments: [att('a1')] }] })] });
    await usePrayerStore.getState().removeUpdateAttachment('p1', 'u1', 'a1');
    expect(prayer().prayer_updates).toHaveLength(1);
    expect(enqueue).toHaveBeenCalledWith('removeUpdateAttachment', expect.objectContaining({ updateId: 'u1' }));
  });
});

describe('testimony content deletion cascades', () => {
  it('blanks the content but keeps the row while attachments remain', async () => {
    usePrayerStore.setState({ prayers: [seed({ testimonies: [{ id: 't1', content: 'thanks', attachments: [att('a1')] }] })] });
    await usePrayerStore.getState().removeTestimonyText('p1', 't1');
    expect(prayer().prayer_testimonies).toHaveLength(1);
    expect(prayer().prayer_testimonies[0].content).toBe('');
    expect(enqueue).toHaveBeenCalledWith('setTestimonyContent', { testimonyId: 't1', content: '' });
  });

  it('deletes the whole row when the content was its last piece', async () => {
    usePrayerStore.setState({ prayers: [seed({ testimonies: [{ id: 't1', content: 'thanks', attachments: [] }] })] });
    await usePrayerStore.getState().removeTestimonyText('p1', 't1');
    expect(prayer().prayer_testimonies).toHaveLength(0);
    expect(enqueue).toHaveBeenCalledWith('deleteTestimony', { testimonyId: 't1' });
  });

  it('deletes the whole row when the last attachment of a content-less testimony goes', async () => {
    usePrayerStore.setState({ prayers: [seed({ testimonies: [{ id: 't1', content: '', attachments: [att('a1')] }] })] });
    await usePrayerStore.getState().removeTestimonyAttachment('p1', 't1', 'a1');
    expect(prayer().prayer_testimonies).toHaveLength(0);
    expect(enqueue).toHaveBeenCalledWith('deleteTestimony', { testimonyId: 't1' });
    expect(removeAttachmentFiles).toHaveBeenCalledWith([expect.objectContaining({ id: 'a1' })]);
  });
});
