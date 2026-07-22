// @vitest-environment jsdom
//
// The shared composer: sending text, WYSIWYG formatting (styled selections
// serialize back to markdown), link attachments, and the allowEmpty contract
// the answered flow depends on.
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
import { recorderMime } from './recorderMime';
import useAuthStore from '../../store/authStore';
import { t } from '../../i18n';

const lang = 'fr';

afterEach(cleanup);
beforeEach(() => {
  useAuthStore.setState({ user: { id: 'u1' } });
});

// The attach "+" menu holds the media pickers and the link action — open it
// before reaching for either. (Formatting now lives on the selection toolbar.)
const openMenu = () => fireEvent.click(screen.getByRole('button', { name: t(lang, 'attachMenu') }));

// The composer field is a contentEditable WYSIWYG surface, not a <textarea>:
// set its text and fire input so the markdown value flows back out via onChange.
const typeInto = (el, text) => { el.textContent = text; fireEvent.input(el); };

describe('UpdateComposer', () => {
  it('sends trimmed text with no attachments', async () => {
    const onSend = vi.fn(async () => {});
    const { container } = render(<UpdateComposer lang={lang} onSend={onSend} placeholder="..." />);
    typeInto(container.querySelector('[contenteditable]'), '  God answered!  ');
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'tipSaveUpdate') }));
    expect(onSend).toHaveBeenCalledWith('God answered!', []);
  });

  it('shows a mic when empty (chat style) and a send button once there is text', () => {
    const { container } = render(<UpdateComposer lang={lang} onSend={vi.fn()} />);
    // Empty: the right-hand action records a voice note, there is no send button.
    expect(screen.getByRole('button', { name: t(lang, 'recordVoice') })).toBeTruthy();
    expect(screen.queryByRole('button', { name: t(lang, 'tipSaveUpdate') })).toBeNull();
    // Typing swaps the mic for an enabled send button.
    typeInto(container.querySelector('[contenteditable]'), 'hi');
    expect(screen.getByRole('button', { name: t(lang, 'tipSaveUpdate') }).disabled).toBe(false);
  });

  it('keeps a labelled, enabled send button when allowEmpty (answered flow)', () => {
    render(<UpdateComposer lang={lang} onSend={vi.fn()} allowEmpty sendLabel="Confirm" />);
    expect(screen.getByRole('button', { name: 'Confirm' }).disabled).toBe(false);
  });

  // The selection toolbar styles text in place (real <strong>, not "**"); what
  // gets sent is the markdown serialization of that styled HTML. execCommand
  // isn't available in jsdom, so assert the boundary that matters: styled HTML
  // in the field → markers in the sent value.
  it('serialises a styled (bold) span back to markdown on send', () => {
    const onSend = vi.fn(async () => {});
    const { container } = render(<UpdateComposer lang={lang} onSend={onSend} />);
    const editor = container.querySelector('[contenteditable]');
    editor.innerHTML = '<strong>thanks</strong>';
    fireEvent.input(editor);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'tipSaveUpdate') }));
    expect(onSend).toHaveBeenCalledWith('**thanks**', []);
  });

  it('attaches a validated link from the menu and sends it along with the text', async () => {
    const onSend = vi.fn(async () => {});
    const { container } = render(<UpdateComposer lang={lang} onSend={onSend} />);
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'attachLink') }));
    const urlInput = container.querySelector('input[type="url"]');
    fireEvent.change(urlInput, { target: { value: 'example.com/article' } });
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'addBtn') }));

    typeInto(container.querySelector('[contenteditable]'), 'see this');
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
    const editor = container.querySelector('[contenteditable]');
    typeInto(editor, 'first word');
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'tipSaveUpdate') }));
    // send() awaits onSend before clearing.
    await vi.waitFor(() => expect(editor.textContent).toBe(''));
  });
});

// The voice-note format ladder. Bare 'audio/mp4' is a trap: Chromium fills the
// mp4 container with Opus, which iOS cannot decode — members hear silence. The
// ladder must demand AAC explicitly and only trust bare mp4 on browsers that
// cannot record Opus-in-mp4 (Safari).
describe('recorderMime', () => {
  const withRecorder = (supported) => {
    globalThis.MediaRecorder = { isTypeSupported: (m) => supported.includes(m) };
  };

  afterEach(() => {
    delete globalThis.MediaRecorder;
  });

  it('returns null when MediaRecorder is unavailable', () => {
    expect(recorderMime()).toBe(null);
  });

  it('picks explicit AAC on Chromium with a platform AAC encoder', () => {
    withRecorder(['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/mp4;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm']);
    expect(recorderMime()).toBe('audio/mp4;codecs=mp4a.40.2');
  });

  it('never picks bare mp4 when the browser would record Opus into it', () => {
    // Chromium without AAC (e.g. Linux): bare mp4 would be silent on iOS.
    withRecorder(['audio/mp4', 'audio/mp4;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm']);
    expect(recorderMime()).toBe('audio/webm;codecs=opus');
  });

  it('trusts bare mp4 on Safari, which records AAC and rejects codec params', () => {
    withRecorder(['audio/mp4']);
    expect(recorderMime()).toBe('audio/mp4');
  });

  it('falls back to webm/opus on Firefox', () => {
    withRecorder(['audio/webm;codecs=opus', 'audio/webm']);
    expect(recorderMime()).toBe('audio/webm;codecs=opus');
  });
});
