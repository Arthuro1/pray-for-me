// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import CommunityUpdates from '../CommunityUpdates';
import CommunityTestimonies from '../CommunityTestimonies';
import CommunitySafetyActions from '../CommunitySafetyActions';
import useCommunityStore from '../../store/communityStore';
import { supabase } from '../../lib/supabase';
import { toast } from '../../store/toastStore';
import { t } from '../../i18n';

vi.mock('../../lib/supabase', () => ({ supabase: { rpc: vi.fn() } }));
vi.mock('../../store/toastStore', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const word = { id: 'update-1', user_id: 'author-b', author_name: 'Synthetic member', text: 'A synthetic encouragement', created_at: new Date().toISOString() };
const testimony = { id: 'testimony-1', user_id: 'author-b', author_name: 'Synthetic member', content: 'A synthetic testimony', created_at: new Date().toISOString() };

beforeEach(() => {
  vi.clearAllMocks();
  supabase.rpc.mockResolvedValue({ data: 'report-1', error: null });
  useCommunityStore.setState({ blockedAuthorsByViewer: {}, prayers: [], testimonies: [] });
});
afterEach(cleanup);

const openMenu = () => fireEvent.click(screen.getByLabelText(t('en', 'options')));

describe('community content moderation menus', () => {
  it.each([
    ['update', 'update-1', () => <CommunityUpdates updates={[word]} loading={false} loc={(text) => text} lang="en" userId="viewer-a" />],
    ['testimony', 'testimony-1', () => <CommunityTestimonies items={[testimony]} loc={(text) => text} lang="en" userId="viewer-a" />],
  ])('reports the actual %s row after confirmation', async (contentType, contentId, content) => {
    render(content());
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Report', exact: true }));
    expect(supabase.rpc).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Report', exact: true }));
    await waitFor(() => expect(supabase.rpc).toHaveBeenCalledWith('submit_community_report', {
      p_content_type: contentType, p_content_id: contentId, p_category: 'other',
    }));
  });

  it('allows reporting an author through the offending content reference without copying its text', async () => {
    render(<CommunitySafetyActions contentType="update" contentId="update-1" authorId="author-b" userId="viewer-a" lang="en" />);
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Report author' }));
    fireEvent.click(screen.getByRole('button', { name: 'Report', exact: true }));
    await waitFor(() => expect(supabase.rpc).toHaveBeenCalledWith('submit_community_report', {
      p_content_type: 'update', p_content_id: 'update-1', p_category: 'harassment',
    }));
  });

  it('does not offer report/block for self or an unknown author', () => {
    const { rerender } = render(<CommunitySafetyActions contentType="update" contentId="update-1" authorId="viewer-a" userId="viewer-a" lang="en" />);
    expect(screen.queryByLabelText(t('en', 'options'))).toBeNull();
    rerender(<CommunitySafetyActions contentType="update" contentId="update-1" userId="viewer-a" lang="en" />);
    expect(screen.queryByLabelText(t('en', 'options'))).toBeNull();
  });

  it('blocks the row author and immediately hides that author across loaded updates and testimonies', async () => {
    render(<>
      <CommunityUpdates updates={[word]} loading={false} loc={(text) => text} lang="en" userId="viewer-a" />
      <CommunityTestimonies items={[testimony]} loc={(text) => text} lang="en" userId="viewer-a" />
    </>);
    fireEvent.click(screen.getAllByLabelText(t('en', 'options'))[0]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Block author' }));
    expect(supabase.rpc).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Block author' }));
    await waitFor(() => expect(screen.queryByText(word.text)).toBeNull());
    expect(screen.queryByText(testimony.content)).toBeNull();
    expect(supabase.rpc).toHaveBeenCalledWith('set_user_block', { p_blocked_user_id: 'author-b', p_blocked: true });
    expect(useCommunityStore.getState().blockedAuthorsByViewer['viewer-a']).toEqual(['author-b']);
    expect(useCommunityStore.getState().blockedAuthorsByViewer['viewer-c']).toBeUndefined();
  });

  it('keeps content and shows an error if the backend rejects blocking', async () => {
    supabase.rpc.mockResolvedValue({ error: { message: 'not_authenticated' } });
    render(<CommunityUpdates updates={[word]} loading={false} loc={(text) => text} lang="en" userId="viewer-a" />);
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Block author' }));
    fireEvent.click(screen.getByRole('button', { name: 'Block author' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByText(word.text)).toBeTruthy();
    expect(useCommunityStore.getState().blockedAuthorsByViewer).toEqual({});
  });

  it('cancelling a report submits nothing', () => {
    render(<CommunitySafetyActions contentType="testimony" contentId="testimony-1" authorId="author-b" userId="viewer-a" lang="en" />);
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Report', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: t('en', 'cancel') }));
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
