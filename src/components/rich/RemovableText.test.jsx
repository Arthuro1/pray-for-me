// @vitest-environment jsdom
//
// RemovableText renders a posted update/testimony's text read-only as
// markdown-lite via RichText — no remove affordance.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import RemovableText from './RemovableText';

afterEach(cleanup);

describe('RemovableText', () => {
  it('renders nothing for empty text', () => {
    const { container } = render(<RemovableText text="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the text', () => {
    render(<RemovableText text="God is faithful" />);
    expect(screen.getByText('God is faithful')).toBeTruthy();
  });
});
