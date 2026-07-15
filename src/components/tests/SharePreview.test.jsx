// @vitest-environment jsdom
//
// First DOM-level (UI) test in the suite. Renders a real component into jsdom via
// Testing Library — the lightweight harness chosen over a full browser E2E stack.
// French is the always-loaded fallback locale (see i18n.js), so it renders
// deterministically without loading a code-split locale; assertions go through
// t() so they verify the show/hide LOGIC rather than pinning exact copy.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import SharePreview from '../SharePreview';
import { t } from '../../i18n';

afterEach(cleanup);

const lang = 'fr';

describe('SharePreview', () => {
  it('shows the sharer name and prayer title when sharing publicly', () => {
    render(<SharePreview authorName="Alice" isAnonymous={false} title="Healing for Mom" lang={lang} />);
    expect(screen.getByText(t(lang, 'sharePreviewLabel'))).toBeTruthy();
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('Healing for Mom')).toBeTruthy();
  });

  it('hides the sharer name behind the anonymous label when sharing anonymously', () => {
    render(<SharePreview authorName="Alice" isAnonymous title="Healing for Mom" lang={lang} />);
    expect(screen.queryByText('Alice')).toBeNull();
    expect(screen.getByText(t(lang, 'anonymousAuthor'))).toBeTruthy();
    // The title still previews so the user knows which request they're sharing.
    expect(screen.getByText('Healing for Mom')).toBeTruthy();
  });
});
