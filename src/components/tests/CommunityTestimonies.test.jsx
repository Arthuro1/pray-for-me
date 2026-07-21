// @vitest-environment jsdom
//
// Testimonies posted for a community prayer can now be deleted as a whole — by
// their author or by a group admin — via the same trash affordance used on
// words and prayer points. The control must appear only for rows the viewer is
// allowed to remove, must confirm before deleting, and must hand the testimony
// id back to the parent (which owns the store call).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

import CommunityTestimonies from '../CommunityTestimonies';
import { t } from '../../i18n';

const lang = 'fr';
const ME = 'user-me';
const OTHER = 'user-other';

const testimony = (over) => ({
  id: 't1',
  user_id: ME,
  author_name: 'Me',
  is_anonymous: false,
  content: 'Dieu a répondu, gloire à lui',
  group_id: 'g1',
  created_at: new Date().toISOString(),
  ...over,
});

const renderList = (props = {}) =>
  render(
    <CommunityTestimonies
      items={props.items || [testimony()]}
      loc={(x) => x}
      lang={lang}
      userId={ME}
      {...props}
    />,
  );

afterEach(cleanup);

describe('CommunityTestimonies delete affordance', () => {
  it("shows a delete control for the viewer's own testimony", () => {
    renderList({ onDelete: vi.fn() });
    expect(screen.getByLabelText(t(lang, 'deleteTestimony'))).toBeTruthy();
  });

  it("hides the control for another member's testimony when the viewer is not an admin", () => {
    renderList({ onDelete: vi.fn(), items: [testimony({ id: 't2', user_id: OTHER, author_name: 'Ana' })] });
    expect(screen.queryByLabelText(t(lang, 'deleteTestimony'))).toBeNull();
  });

  it("shows the control for another member's testimony when the viewer is an admin", () => {
    renderList({ onDelete: vi.fn(), isAdmin: true, items: [testimony({ id: 't2', user_id: OTHER, author_name: 'Ana' })] });
    expect(screen.getByLabelText(t(lang, 'deleteTestimony'))).toBeTruthy();
  });

  it('never offers to delete a locked (undecryptable) testimony', () => {
    renderList({ onDelete: vi.fn(), isAdmin: true, items: [testimony({ _locked: true })] });
    expect(screen.queryByLabelText(t(lang, 'deleteTestimony'))).toBeNull();
  });

  it('offers no control at all when onDelete is not provided', () => {
    renderList();
    expect(screen.queryByLabelText(t(lang, 'deleteTestimony'))).toBeNull();
  });

  it('confirms first, then calls onDelete with the testimony id', async () => {
    const onDelete = vi.fn().mockResolvedValue({});
    renderList({ onDelete });

    // Opening the row control shows a confirmation, not an immediate delete.
    fireEvent.click(screen.getByLabelText(t(lang, 'deleteTestimony')));
    expect(onDelete).not.toHaveBeenCalled();

    // Confirming fires the callback with the testimony id.
    fireEvent.click(screen.getByText(t(lang, 'delete')));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('t1'));
  });

  it('cancelling the confirmation deletes nothing', () => {
    const onDelete = vi.fn();
    renderList({ onDelete });
    fireEvent.click(screen.getByLabelText(t(lang, 'deleteTestimony')));
    fireEvent.click(screen.getByText(t(lang, 'cancel')));
    expect(onDelete).not.toHaveBeenCalled();
  });
});
