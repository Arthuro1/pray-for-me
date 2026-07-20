// @vitest-environment jsdom
//
// The shared composer: sending text, formatting insertion, link attachments,
// and the allowEmpty contract the answered flow depends on.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../lib/supabase', () => {
  const chain = {
    insert: () => chain, select: () => chain, eq: () => chain, order: () => chain,
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve) => resolve({ data: [], error: null }),
  };
  return {
    supabase: {
      auth: { getSession: async () => ({ data: { session: null } }), getUser: async () => ({ data: { user: null } }) },
      from: () => chain,
      storage: { from: () => ({ upload: async () => ({ error: null }), download: async () => ({ data: null, error: 'nope' }), remove: async () => ({}) }) },
    },
  };
});

import UpdateComposer from './UpdateComposer';
import useAuthStore from '../../store/authStore';
import { t } from '../../i18n';

const lang = 'fr';

afterEach(cleanup);
beforeEach(() => {
  useAuthStore.setState({ user: { id: 'u1' } });
});

describe('UpdateComposer', () => {
  it('sends trimmed text with no attachments', async () => {
    const onSend = vi.fn(async () => {});
    const { container } = render(<UpdateComposer lang={lang} onSend={onSend} placeholder="..." />);
    fireEvent.change(container.querySelector('textarea'), { target: { value: '  God answered!  ' } });
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'tipSaveUpdate') }));
    expect(onSend).toHaveBeenCalledWith('God answered!', []);
  });

  it('disables send when empty — unless allowEmpty (answered flow)', () => {
    const { container, unmount } = render(<UpdateComposer lang={lang} onSend={vi.fn()} />);
    expect(screen.getByRole('button', { name: t(lang, 'tipSaveUpdate') }).disabled).toBe(true);
    unmount();
    render(<UpdateComposer lang={lang} onSend={vi.fn()} allowEmpty sendLabel="Confirm" />);
    expect(screen.getByRole('button', { name: 'Confirm' }).disabled).toBe(false);
    expect(container).toBeTruthy();
  });

  it('wraps the textarea content in bold markers via the toolbar', () => {
    const { container } = render(<UpdateComposer lang={lang} onSend={vi.fn()} />);
    const textarea = container.querySelector('textarea');
    fireEvent.change(textarea, { target: { value: 'thanks' } });
    textarea.setSelectionRange(0, 6);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'formatBold') }));
    expect(textarea.value).toBe('**thanks**');
  });

  it('attaches a validated link and sends it along with the text', async () => {
    const onSend = vi.fn(async () => {});
    const { container } = render(<UpdateComposer lang={lang} onSend={onSend} />);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'attachLink') }));
    const urlInput = container.querySelector('input[type="url"]');
    fireEvent.change(urlInput, { target: { value: 'example.com/article' } });
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'addBtn') }));

    fireEvent.change(container.querySelector('textarea'), { target: { value: 'see this' } });
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'tipSaveUpdate') }));

    expect(onSend).toHaveBeenCalledTimes(1);
    const [text, attachments] = onSend.mock.calls[0];
    expect(text).toBe('see this');
    expect(attachments).toEqual([
      expect.objectContaining({ type: 'link', url: 'https://example.com/article' }),
    ]);
  });

  it('clears text and attachments after a successful send', async () => {
    const onSend = vi.fn(async () => {});
    const { container } = render(<UpdateComposer lang={lang} onSend={onSend} />);
    const textarea = container.querySelector('textarea');
    fireEvent.change(textarea, { target: { value: 'first word' } });
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'tipSaveUpdate') }));
    // send() awaits onSend before clearing.
    await vi.waitFor(() => expect(textarea.value).toBe(''));
  });
});
