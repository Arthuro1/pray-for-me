// @vitest-environment jsdom
//
// Member "words" on a community prayer can now be deleted — by their author or
// by a group admin. The delete control must appear only for rows the viewer is
// allowed to remove, must confirm before deleting, and must hand the update id
// back to the parent (which owns the store call + optimistic list update).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

import CommunityUpdates from '../CommunityUpdates';
import { t } from '../../i18n';

const lang = 'fr';
const ME = 'user-me';
const OTHER = 'user-other';

const word = (over) => ({
  id: 'u1',
  user_id: ME,
  author_name: 'Me',
  is_anonymous: false,
  text: 'Courage, je prie pour toi',
  created_at: new Date().toISOString(),
  ...over,
});

const renderList = (props = {}) =>
  render(
    <CommunityUpdates
      updates={props.updates || [word()]}
      loading={false}
      loc={(x) => x}
      lang={lang}
      userId={ME}
      onSend={vi.fn()}
      {...props}
    />,
  );

afterEach(cleanup);

describe('CommunityUpdates delete affordance', () => {
  it('shows a delete control for the viewer\'s own word', () => {
    renderList({ onDelete: vi.fn() });
    expect(screen.getByLabelText(t(lang, 'deleteWord'))).toBeTruthy();
  });

  it('hides the control for another member\'s word when the viewer is not an admin', () => {
    renderList({ onDelete: vi.fn(), updates: [word({ id: 'u2', user_id: OTHER, author_name: 'Ana' })] });
    expect(screen.queryByLabelText(t(lang, 'deleteWord'))).toBeNull();
  });

  it('shows the control for another member\'s word when the viewer is an admin', () => {
    renderList({ onDelete: vi.fn(), isAdmin: true, updates: [word({ id: 'u2', user_id: OTHER, author_name: 'Ana' })] });
    expect(screen.getByLabelText(t(lang, 'deleteWord'))).toBeTruthy();
  });

  it('never offers to delete a locked (undecryptable) word', () => {
    renderList({ onDelete: vi.fn(), isAdmin: true, updates: [word({ _locked: true })] });
    expect(screen.queryByLabelText(t(lang, 'deleteWord'))).toBeNull();
  });

  it('offers no control at all when onDelete is not provided', () => {
    renderList();
    expect(screen.queryByLabelText(t(lang, 'deleteWord'))).toBeNull();
  });

  it('confirms first, then calls onDelete with the word id', () => {
    const onDelete = vi.fn().mockResolvedValue({});
    renderList({ onDelete });

    // Opening the row control shows a confirmation, not an immediate delete.
    fireEvent.click(screen.getByLabelText(t(lang, 'deleteWord')));
    expect(onDelete).not.toHaveBeenCalled();

    // Confirming fires the callback with the update id.
    fireEvent.click(screen.getByText(t(lang, 'delete')));
    expect(onDelete).toHaveBeenCalledWith('u1');
  });

  it('cancelling the confirmation deletes nothing', () => {
    const onDelete = vi.fn();
    renderList({ onDelete });
    fireEvent.click(screen.getByLabelText(t(lang, 'deleteWord')));
    fireEvent.click(screen.getByText(t(lang, 'cancel')));
    expect(onDelete).not.toHaveBeenCalled();
  });
});
