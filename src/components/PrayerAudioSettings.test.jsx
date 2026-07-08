// @vitest-environment jsdom
//
// PrayerAudioSettings is the pre-session atmosphere chooser. The guarantees that
// matter here: Silence is a real, selectable, default-highlighted option; the
// music-volume control only appears once an instrumental is chosen; and picking
// a track is reported to the parent. French is the always-loaded locale, so
// labels are asserted through t().
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PrayerAudioSettings from './PrayerAudioSettings';
import { t } from '../i18n';

const lang = 'fr';

afterEach(cleanup);

function renderSettings(props = {}) {
  const handlers = {
    onChangeTrack: vi.fn(),
    onChangeVolume: vi.fn(),
    onToggleVoice: vi.fn(),
    onChangePause: vi.fn(),
  };
  render(
    <PrayerAudioSettings
      lang={lang}
      trackId="silence"
      volume={0.18}
      voiceEnabled
      pauseLength="medium"
      speechSupported
      {...handlers}
      {...props}
    />
  );
  return handlers;
}

describe('PrayerAudioSettings', () => {
  it('offers Silence and highlights it as the current (default) choice', () => {
    renderSettings();
    const silence = screen.getByRole('button', { name: new RegExp(t(lang, 'audioSilence')) });
    expect(silence.getAttribute('aria-pressed')).toBe('true');
  });

  it('hides the music-volume slider while Silence is selected', () => {
    renderSettings({ trackId: 'silence' });
    expect(screen.queryByRole('slider')).toBeNull();
  });

  it('shows the music-volume slider once an instrumental is chosen', () => {
    renderSettings({ trackId: 'soft-piano' });
    expect(screen.getByRole('slider')).toBeTruthy();
  });

  it('reports the chosen track to the parent', () => {
    const { onChangeTrack } = renderSettings();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'audioSoftPiano')) }));
    expect(onChangeTrack).toHaveBeenCalledWith('soft-piano');
  });

  it('discloses when the spoken guide is unavailable and disables the toggle', () => {
    const { onToggleVoice } = renderSettings({ speechSupported: false });
    expect(screen.getByText(t(lang, 'audioVoiceUnavailable'))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'audioVoice')) }));
    expect(onToggleVoice).not.toHaveBeenCalled();
  });
});
