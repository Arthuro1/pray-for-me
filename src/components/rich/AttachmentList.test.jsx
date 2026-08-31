// @vitest-environment jsdom
//
// AttachmentList renders an update/testimony's attachments read-only — no
// remove affordance. Link attachments are used throughout: they render without
// the download + decrypt pipeline media types need, so rendering is tested pure.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

import AttachmentList, { AttachmentPreview, PendingAttachmentList } from './AttachmentList';
import { t } from '../../i18n';

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

  it('makes pending audio and video playable and pending links clickable', () => {
    const onRemove = vi.fn();
    const entries = [
      { id: 'voice', status: 'ready', type: 'audio', name: 'voice-note.m4a', previewUrl: 'blob:voice', meta: { id: 'voice', type: 'audio', name: 'voice-note.m4a' } },
      { id: 'video', status: 'ready', type: 'video', name: 'clip.mp4', previewUrl: 'blob:video', meta: { id: 'video', type: 'video', name: 'clip.mp4' } },
      { id: 'link', status: 'ready', type: 'link', meta: link('article') },
    ];
    const { container } = render(<PendingAttachmentList entries={entries} lang={lang} onRemove={onRemove} />);

    expect(container.querySelector('audio')?.getAttribute('src')).toBe('blob:voice');
    expect(container.querySelector('video')?.getAttribute('src')).toBe('blob:video');
    expect(screen.getAllByRole('button', { name: t(lang, 'mediaPlay') })).toHaveLength(2);
    expect(screen.getByRole('link', { name: /example\.com/i }).getAttribute('href')).toBe('https://example.com/article');

    const removeButtons = screen.getAllByRole('button', { name: t(lang, 'attachRemove') });
    expect(removeButtons).toHaveLength(3);
    fireEvent.click(removeButtons[0]);
    expect(onRemove).toHaveBeenCalledWith(entries[0]);
  });

  it('starts video from the explicit mobile-friendly play control', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const { container } = render(
      <AttachmentPreview att={{ id: 'video', type: 'video', name: 'clip.mp4' }} url="blob:video" lang={lang} />
    );
    const video = container.querySelector('video');

    fireEvent.click(screen.getByRole('button', { name: t(lang, 'mediaPlay') }));
    expect(play).toHaveBeenCalledTimes(1);

    fireEvent.play(video);
    expect(screen.queryByRole('button', { name: t(lang, 'mediaPlay') })).toBeNull();
    fireEvent.pause(video);
    expect(screen.getByRole('button', { name: t(lang, 'mediaPlay') })).toBeTruthy();

    play.mockRestore();
    pause.mockRestore();
  });
});
