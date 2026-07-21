// @vitest-environment jsdom
//
// A posted update/testimony's text can now be deleted like its attachments —
// but only when the caller passes onRemove (authors only), and never without
// an explicit confirmation. Mirrors AttachmentList's affordance contract.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

import RemovableText from './RemovableText';
import { t } from '../../i18n';

const lang = 'fr';

afterEach(cleanup);

describe('RemovableText removal affordance', () => {
  it('renders nothing for empty text', () => {
    const { container } = render(<RemovableText text="" lang={lang} onRemove={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the text but no remove control without onRemove', () => {
    render(<RemovableText text="God is faithful" lang={lang} />);
    expect(screen.getByText('God is faithful')).toBeTruthy();
    expect(screen.queryByLabelText(t(lang, 'textRemove'))).toBeNull();
  });

  it('confirms first, then calls onRemove', async () => {
    const onRemove = vi.fn().mockResolvedValue({});
    render(<RemovableText text="God is faithful" lang={lang} onRemove={onRemove} />);

    // Tapping the control opens a confirmation, not an immediate delete.
    fireEvent.click(screen.getByLabelText(t(lang, 'textRemove')));
    expect(onRemove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(t(lang, 'delete')));
    await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));

    // The dialog closes once the removal settles.
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('cancelling the confirmation removes nothing', () => {
    const onRemove = vi.fn();
    render(<RemovableText text="God is faithful" lang={lang} onRemove={onRemove} />);
    fireEvent.click(screen.getByLabelText(t(lang, 'textRemove')));
    fireEvent.click(screen.getByText(t(lang, 'cancel')));
    expect(onRemove).not.toHaveBeenCalled();
  });
});
