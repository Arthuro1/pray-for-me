// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../lib/audio/backgroundAudio', async (importOriginal) => ({
  ...await importOriginal(),
  startBackgroundInstrumental: vi.fn(() => Promise.resolve({ started: true })),
  stopBackgroundAudio: vi.fn(() => Promise.resolve()),
}));

import PrayerMusicControl from './PrayerMusicControl';
import { t } from '../i18n';
import { startBackgroundInstrumental, stopBackgroundAudio } from '../lib/audio/backgroundAudio';

const storageKey = 'pfm_prayer_audio_track';
const musicLabel = (key) => `${t('fr', 'prayerMusic')}: ${t('fr', key)}`;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem(storageKey, 'soft-piano');
});

afterEach(cleanup);

describe('PrayerMusicControl explicit guest consent', () => {
  it('starts a new guest prayer in silence while preserving the remembered preference', () => {
    render(<PrayerMusicControl lang="fr" resumePreference={false} />);

    expect(screen.getByRole('button', { name: musicLabel('audioSilence') })).toBeTruthy();
    expect(startBackgroundInstrumental).not.toHaveBeenCalled();
    expect(localStorage.getItem(storageKey)).toBe('soft-piano');
  });

  it('plays and remembers a track only after the guest selects it', () => {
    render(<PrayerMusicControl lang="fr" resumePreference={false} />);
    fireEvent.click(screen.getByRole('button', { name: musicLabel('audioSilence') }));
    expect(startBackgroundInstrumental).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: t('fr', 'audioAmbientPad') }));

    expect(startBackgroundInstrumental).toHaveBeenCalledWith({ trackId: 'ambient-pad', volume: 0.16 });
    expect(localStorage.getItem(storageKey)).toBe('ambient-pad');
    expect(screen.getByRole('button', { name: musicLabel('audioAmbientPad') })).toBeTruthy();
  });

  it('preserves the remembered atmosphere for existing prayer sessions by default', () => {
    render(<PrayerMusicControl lang="fr" />);

    expect(screen.getByRole('button', { name: musicLabel('audioSoftPiano') })).toBeTruthy();
    expect(startBackgroundInstrumental).toHaveBeenCalledWith({ trackId: 'soft-piano', volume: 0.16 });
    expect(localStorage.getItem(storageKey)).toBe('soft-piano');
  });

  it('honors explicit silence and fades out when the prayer control leaves', () => {
    const view = render(<PrayerMusicControl lang="fr" resumePreference={false} />);
    fireEvent.click(screen.getByRole('button', { name: musicLabel('audioSilence') }));
    fireEvent.click(screen.getByRole('button', { name: t('fr', 'audioSilence') }));

    expect(startBackgroundInstrumental).not.toHaveBeenCalled();
    expect(localStorage.getItem(storageKey)).toBe('silence');
    view.unmount();
    expect(stopBackgroundAudio).toHaveBeenCalledWith({ fade: true });
  });
});

