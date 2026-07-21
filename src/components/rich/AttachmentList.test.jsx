// @vitest-environment jsdom
//
// AttachmentList renders an update/testimony's attachments read-only — no
// remove affordance. Link attachments are used throughout: they render without
// the download + decrypt pipeline media types need, so rendering is tested pure.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import AttachmentList from './AttachmentList';

const lang = 'fr';

const link = (id) => ({ id, type: 'link', url: `https://example.com/${id}` });

afterEach(cleanup);

describe('AttachmentList', () => {
  it('renders nothing when there are no attachments', () => {
    const { container } = render(<AttachmentList attachments={[]} lang={lang} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders one link card per attachment', () => {
    render(<AttachmentList attachments={[link('a1'), link('a2')]} lang={lang} />);
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
});
