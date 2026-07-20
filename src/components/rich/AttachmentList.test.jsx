// @vitest-environment jsdom
//
// Posted attachments can now be deleted one by one — but only when the caller
// passes onRemove (authors only), and never without an explicit confirmation.
// Link attachments are used throughout: they render without the download +
// decrypt pipeline media types need, so the affordance logic is tested pure.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

import AttachmentList from './AttachmentList';
import { t } from '../../i18n';

const lang = 'fr';

const link = (id) => ({ id, type: 'link', url: `https://example.com/${id}` });

afterEach(cleanup);

describe('AttachmentList removal affordance', () => {
  it('renders no remove control without onRemove', () => {
    render(<AttachmentList attachments={[link('a1')]} lang={lang} />);
    expect(screen.queryByLabelText(t(lang, 'attachRemove'))).toBeNull();
  });

  it('renders one remove control per attachment when onRemove is passed', () => {
    render(<AttachmentList attachments={[link('a1'), link('a2')]} lang={lang} onRemove={vi.fn()} />);
    expect(screen.getAllByLabelText(t(lang, 'attachRemove'))).toHaveLength(2);
  });

  it('confirms first, then calls onRemove with the attachment', async () => {
    const onRemove = vi.fn().mockResolvedValue({});
    render(<AttachmentList attachments={[link('a1')]} lang={lang} onRemove={onRemove} />);

    // Tapping the badge opens a confirmation, not an immediate delete.
    fireEvent.click(screen.getByLabelText(t(lang, 'attachRemove')));
    expect(onRemove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(t(lang, 'delete')));
    await waitFor(() => expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 'a1' })));

    // The dialog closes once the removal settles.
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('cancelling the confirmation removes nothing', () => {
    const onRemove = vi.fn();
    render(<AttachmentList attachments={[link('a1')]} lang={lang} onRemove={onRemove} />);
    fireEvent.click(screen.getByLabelText(t(lang, 'attachRemove')));
    fireEvent.click(screen.getByText(t(lang, 'cancel')));
    expect(onRemove).not.toHaveBeenCalled();
  });
});
