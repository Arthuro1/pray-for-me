// @vitest-environment jsdom
//
// "Pray now" walks today's prayers, and each prayer point may cite Scripture.
// Verses are stored in the language the prayer was created in, so the session must
// show each citation and its text in ONE language: the reader's when authoritative
// text is available for it, otherwise the original — but never a localized
// reference paired with stale, differently-languaged text.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';

vi.mock('../../lib/verseText', () => ({
  fetchScriptureText: vi.fn(),
  fetchVerseText: vi.fn(),
}));
vi.mock('../../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
const backgroundAudioMocks = vi.hoisted(() => ({
  start: vi.fn(async ({ trackId }) => ({ started: trackId !== 'silence', trackId })),
  stop: vi.fn(async () => {}),
}));
vi.mock('../../lib/audio/backgroundAudio', () => ({
  AUDIO_TRACKS: [
    { id: 'soft-piano', src: '/audio/piano-and-rain.mp3', labelKey: 'audioSoftPiano' },
    { id: 'ambient-pad', src: '/audio/ambient-pad.mp3', labelKey: 'audioAmbientPad' },
    { id: 'nature', src: '/audio/nature.mp3', labelKey: 'audioNature' },
    { id: 'soft-pad', src: '/audio/soft-pad.mp3', labelKey: 'audioSoftPad' },
    { id: 'silence', src: null, labelKey: 'audioSilence' },
  ],
  DEFAULT_AUDIO_TRACK_ID: 'silence',
  resolveTrack: (id) => ({
    'soft-piano': { id: 'soft-piano', src: '/audio/piano-and-rain.mp3', labelKey: 'audioSoftPiano' },
    'ambient-pad': { id: 'ambient-pad', src: '/audio/ambient-pad.mp3', labelKey: 'audioAmbientPad' },
    nature: { id: 'nature', src: '/audio/nature.mp3', labelKey: 'audioNature' },
    'soft-pad': { id: 'soft-pad', src: '/audio/soft-pad.mp3', labelKey: 'audioSoftPad' },
    silence: { id: 'silence', src: null, labelKey: 'audioSilence' },
  }[id] || null),
  startBackgroundInstrumental: backgroundAudioMocks.start,
  stopBackgroundAudio: backgroundAudioMocks.stop,
}));

import PrayerSession from '../PrayerSession';
import { fetchScriptureText, fetchVerseText } from '../../lib/verseText';
import { readActivationProgress } from '../../lib/activationProgress';
import { todayKey } from '../../lib/prayedLog';
import { t } from '../../i18n';

const lang = 'en';
const tr = (text) => text; // personal prayers pass through unchanged in these tests

// A prayer created in French: one point cites a Psalm we CAN resolve to
// authoritative English text, one cites a verse we cannot (no edition mocked).
const prayer = {
  id: 'p1',
  title: 'Pour ma famille',
  description: '',
  prayer_categories: [],
  for_other: false,
  prayer_points: [
    { id: 'pt1', title: 'Confiance', verses: [{ ref: 'Psaume 23:1', text: 'L’Éternel est mon berger' }] },
    { id: 'pt2', title: 'Amour', verses: [{ ref: 'Jean 3:16', text: 'Car Dieu a tant aimé le monde' }] },
  ],
};

beforeEach(() => {
  localStorage.clear();
  backgroundAudioMocks.start.mockClear();
  backgroundAudioMocks.stop.mockClear();
  vi.mocked(fetchScriptureText).mockClear();
  // Only the Psalm resolves to authoritative English text; everything else has
  // none, exercising the "keep the original pair" fallback.
  vi.mocked(fetchScriptureText).mockImplementation(async ({ reference }) =>
    reference === 'Psalm 23:1' ? { text: 'The LORD is my shepherd', ref: reference } : null,
  );
  vi.mocked(fetchVerseText).mockResolvedValue({ data: null, error: null });
});
afterEach(cleanup);

// The session starts straight in the "requests" path (no upfront picker), so the
// supplication view (with the prayer's own verses) renders immediately.
function openRequests(props = {}) {
  render(<PrayerSession prayers={[prayer]} categories={[]} lang={lang} tr={tr} onClose={() => {}} onComplete={() => {}} {...props} />);
}

describe('PrayerSession — Scripture localization', () => {
  it('shows authoritative text and a localized reference when one is available', async () => {
    openRequests();
    expect(await screen.findByText(/The LORD is my shepherd/)).toBeTruthy();
    expect(screen.getByText(/Psalm 23:1/)).toBeTruthy();
    // The stored French wording/citation is fully replaced — no stale leak.
    expect(screen.queryByText(/L’Éternel est mon berger/)).toBeNull();
    expect(screen.queryByText(/Psaume 23:1/)).toBeNull();
  });

  it('keeps the reference and text in ONE language when no authoritative text exists', async () => {
    openRequests();
    // John 3:16 has no mocked English edition: rather than pair a localized "John
    // 3:16" with untranslatable French text, both stay in the original language.
    expect(await screen.findByText(/Car Dieu a tant aimé le monde/)).toBeTruthy();
    expect(screen.getByText(/Jean 3:16/)).toBeTruthy();
    expect(screen.queryByText(/John 3:16/)).toBeNull();
  });
});

describe('PrayerSession — guided plan day content', () => {
  // A running plan is ONE recurring prayer carrying schedule.plan; the session
  // must lead with the day-specific theme + Scripture (what changes each day),
  // not the unchanging plan name. Day 1 of the fast3 plan starts today.
  const planPrayer = {
    id: 'plan1',
    title: 'Three-Day Fast',
    description: 'A short, focused fast',
    prayer_categories: [],
    for_other: false,
    prayer_points: [],
    schedule: {
      type: 'recurring', freq: 'daily', startDate: todayKey(),
      end: { kind: 'count', count: 3 },
      plan: { id: 'fast3', startDate: todayKey() },
    },
  };

  it("leads with today's day counter, theme, and Scripture passage", () => {
    render(<PrayerSession prayers={[planPrayer]} categories={[]} lang={lang} tr={tr} onClose={() => {}} onComplete={() => {}} />);
    // Eyebrow: the day counter (plan name rides alongside it, no longer the heading).
    expect(screen.getByText(new RegExp(t(lang, 'planDayOf', { n: 1, total: 3 })))).toBeTruthy();
    // Heading: day 1's theme, not the plan title.
    expect(screen.getByText(/Consecrate the fast/)).toBeTruthy();
    // The day's passage is offered to read in place.
    expect(screen.getByText(/Joel 2:12/)).toBeTruthy();
  });

  // The older plans carry a theme and a verse only — the rich sections a plan
  // like "Preparing in Prayer" adds must stay absent for them.
  it('adds no reflection, prompts or practice to a plain theme-and-verse plan', () => {
    render(<PrayerSession prayers={[planPrayer]} categories={[]} lang={lang} tr={tr} onClose={() => {}} onComplete={() => {}} />);
    expect(screen.queryByText(t(lang, 'planPrayerPrompts'))).toBeNull();
    expect(screen.queryByText(t(lang, 'planPrayForYourself'))).toBeNull();
    expect(screen.queryByText(t(lang, 'planPracticeToday'))).toBeNull();
    expect(screen.queryByText(t(lang, 'goDeeper'))).toBeNull();
  });

  // A rich plan day walks through the SAME session — same prayer, same
  // completion, same notes — and simply carries more content.
  it('walks a rich plan day through the ordinary session, with its prompts and practice', () => {
    const richPrayer = {
      ...planPrayer,
      id: 'plan2',
      title: 'Preparing in Prayer',
      schedule: {
        type: 'recurring', freq: 'daily', startDate: todayKey(),
        end: { kind: 'count', count: 21 },
        plan: { id: 'preparing21', startDate: todayKey() },
      },
    };
    render(<PrayerSession prayers={[richPrayer]} categories={[]} lang={lang} tr={tr} onClose={() => {}} onComplete={() => {}} />);
    expect(screen.getByText(new RegExp(t(lang, 'planDayOf', { n: 1, total: 21 })))).toBeTruthy();
    expect(screen.getByText(/God is enough|Dieu suffit/)).toBeTruthy();
    expect(screen.getByText(/Psalm 73:25-26|Psaume 73:25-26/)).toBeTruthy();
    expect(screen.getByText(t(lang, 'planPrayerPrompts'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'planPrayForYourself'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'planPracticeToday'))).toBeTruthy();
    // Still the ORDINARY session underneath: the same closing action, and the
    // same optional prayer note (so notes, voice notes and completion all keep
    // working on a plan day exactly as they do on any other prayer).
    expect(screen.getByRole('button', { name: t(lang, 'amenBtn') })).toBeTruthy();
    expect(screen.getByRole('button', { name: t(lang, 'noteAdd') })).toBeTruthy();
  });

  it.each([
    ['covenant21', 21, 1, 'Matthew 6:33', 'Christ at the center'],
    ['marriage30', 30, 1, 'Matthew 6:33', 'Christ at the center'],
  ])('walks %s through the same PrayerSession and Scripture reader', async (planId, total, version, ref, theme) => {
    const relationshipPrayer = {
      ...planPrayer,
      id: `${planId}-run`,
      title: planId,
      schedule: {
        type: 'recurring', freq: 'daily', startDate: todayKey(),
        end: { kind: 'count', count: total },
        plan: { id: planId, version, startDate: todayKey() },
      },
    };
    render(<PrayerSession prayers={[relationshipPrayer]} categories={[]} lang={lang} tr={tr} onClose={() => {}} onComplete={() => {}} />);
    expect(screen.getByText(new RegExp(t(lang, 'planDayOf', { n: 1, total })))).toBeTruthy();
    expect(screen.getByText(theme)).toBeTruthy();
    const scriptureTrigger = screen.getByText(ref).closest('button');
    expect(scriptureTrigger).toBeTruthy();
    fireEvent.click(scriptureTrigger);
    await waitFor(() => expect(fetchScriptureText).toHaveBeenCalledWith({ reference: ref, lang }));
    expect(screen.getByRole('button', { name: t(lang, 'amenBtn') })).toBeTruthy();
    expect(screen.getByRole('button', { name: t(lang, 'noteAdd') })).toBeTruthy();
  });
});

describe('PrayerSession — immediate start & format control', () => {
  it('starts directly on the first prayer, with no upfront mode picker', () => {
    openRequests();
    // The prayer content is already on screen; the old intro title is gone.
    expect(screen.getByText('Pour ma famille')).toBeTruthy();
    // No Back button on the very first step (there is no picker to return to).
    expect(screen.queryByText(t(lang, 'backBtn'))).toBeNull();
  });

  it('offers Guided/ACTS under the Prayer format control and remembers the choice', () => {
    openRequests();
    fireEvent.click(screen.getByTitle(t(lang, 'prayerFormat')));
    fireEvent.click(screen.getByText(t(lang, 'modeActs')));
    // ACTS opens with the adoration movement, and the choice persists.
    expect(screen.getByText(t(lang, 'stageAdoration'))).toBeTruthy();
    expect(localStorage.getItem('pfm_prayer_mode')).toBe('acts');
    cleanup();
    // A new session reopens straight into the remembered format.
    openRequests();
    expect(screen.getByText(t(lang, 'stageAdoration'))).toBeTruthy();
  });

  it('starts silently and only plays music after an explicit choice', async () => {
    openRequests();
    expect(backgroundAudioMocks.start).not.toHaveBeenCalled();
    expect(screen.getByText(t(lang, 'audioSilence'))).toBeTruthy();

    fireEvent.click(screen.getByTitle(t(lang, 'prayerMusic')));
    fireEvent.click(screen.getByText(t(lang, 'audioSoftPiano')));

    expect(localStorage.getItem('pfm_prayer_audio_track')).toBe('soft-piano');
    await waitFor(() => {
      expect(backgroundAudioMocks.start).toHaveBeenCalledWith({ trackId: 'soft-piano', volume: 0.16 });
    });
  });

  it('remembers a changed atmosphere for the next prayer session', async () => {
    openRequests();
    fireEvent.click(screen.getByTitle(t(lang, 'prayerMusic')));
    fireEvent.click(screen.getByText(t(lang, 'audioNature')));
    await waitFor(() => {
      expect(backgroundAudioMocks.start).toHaveBeenLastCalledWith({ trackId: 'nature', volume: 0.16 });
    });
    cleanup();

    backgroundAudioMocks.start.mockClear();
    openRequests();
    await waitFor(() => {
      expect(backgroundAudioMocks.start).toHaveBeenCalledWith({ trackId: 'nature', volume: 0.16 });
    });
  });

  it('records each prayer as prayed when the user advances past it', () => {
    const onPrayed = vi.fn();
    const onComplete = vi.fn();
    const two = [prayer, { ...prayer, id: 'p2', title: 'Pour un ami', prayer_points: [] }];
    render(<PrayerSession prayers={two} categories={[]} lang={lang} tr={tr} onClose={() => {}} onComplete={onComplete} onPrayed={onPrayed} />);
    fireEvent.click(screen.getByText(t(lang, 'continueBtn')));
    // Progress is kept even though the session isn't finished.
    expect(onPrayed).toHaveBeenCalledWith('p1');
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText(t(lang, 'amenBtn')));
    expect(onPrayed).toHaveBeenCalledWith('p2');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(readActivationProgress().signals).toContain('session_completed');
  });

  it('returns the scroll area to the title when advancing to another request', () => {
    const two = [prayer, { ...prayer, id: 'p2', title: 'Pour un ami', prayer_points: [] }];
    const { container } = render(
      <PrayerSession prayers={two} categories={[]} lang={lang} tr={tr} onClose={() => {}} onComplete={() => {}} />,
    );
    const scrollArea = container.querySelector('.constellation-session__request');
    scrollArea.scrollTop = 320;

    fireEvent.click(screen.getByText(t(lang, 'continueBtn')));

    expect(screen.getByText('Pour un ami')).toBeTruthy();
    expect(scrollArea.scrollTop).toBe(0);
  });

  it('contains session scrolling and restores the page after the session closes', () => {
    document.body.style.overflow = 'auto';
    document.body.style.overscrollBehavior = 'auto';
    document.documentElement.style.overflow = 'visible';
    document.documentElement.style.overscrollBehavior = 'auto';

    const { unmount } = render(
      <PrayerSession prayers={[prayer]} categories={[]} lang={lang} tr={tr} onClose={() => {}} onComplete={() => {}} />,
    );

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.overscrollBehavior).toBe('none');
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overscrollBehavior).toBe('none');

    unmount();

    expect(document.body.style.overflow).toBe('auto');
    expect(document.body.style.overscrollBehavior).toBe('auto');
    expect(document.documentElement.style.overflow).toBe('visible');
    expect(document.documentElement.style.overscrollBehavior).toBe('auto');
  });

  it('keeps the session fixed to the viewport instead of flowing into Today', () => {
    const css = readFileSync('src/index.css', 'utf8');
    const sessionRule = css.match(/\.constellation-session\s*\{([^}]*)\}/)?.[1] || '';

    expect(sessionRule).toMatch(/position:\s*fixed/);
    expect(sessionRule).toMatch(/inset:\s*0/);
    expect(sessionRule).toMatch(/height:\s*100dvh/);
    expect(sessionRule).toMatch(/overscroll-behavior:\s*none/);
  });
});

describe('PrayerSession — format change protects progress', () => {
  const two = [prayer, { ...prayer, id: 'p2', title: 'Pour un ami', prayer_points: [] }];
  const openTwo = (props = {}) =>
    render(<PrayerSession prayers={two} categories={[]} lang={lang} tr={tr} onClose={() => {}} onComplete={() => {}} {...props} />);
  const pickFormat = (modeKey) => {
    fireEvent.click(screen.getByTitle(t(lang, 'prayerFormat')));
    fireEvent.click(screen.getByText(t(lang, modeKey)));
  };

  it('before any progress, switching restarts freely', () => {
    openTwo();
    pickFormat('modeActs');
    expect(screen.getByText(t(lang, 'stageAdoration'))).toBeTruthy();
    pickFormat('modeRequests');
    expect(screen.getByText('Pour ma famille')).toBeTruthy(); // back at prayer 1
  });

  it('after advancing, the new format resumes the requests — completed prayers are not repeated', () => {
    const onPrayed = vi.fn();
    openTwo({ onPrayed });
    fireEvent.click(screen.getByText(t(lang, 'continueBtn'))); // past p1
    expect(onPrayed).toHaveBeenCalledWith('p1');

    pickFormat('modeGuided'); // guided = adoration → requests → thanksgiving
    expect(screen.getByText(t(lang, 'stageAdoration'))).toBeTruthy();
    fireEvent.click(screen.getByText(t(lang, 'continueBtn'))); // past adoration
    // The requests stage resumes at the SECOND prayer — p1 is never repeated.
    expect(screen.getByText('Pour un ami')).toBeTruthy();
    expect(screen.queryByText('Pour ma famille')).toBeNull();
    expect(onPrayed).toHaveBeenCalledTimes(1);
  });

  it('switching to requests-only when every request is prayed completes the session', () => {
    const onComplete = vi.fn();
    localStorage.setItem('pfm_prayer_mode', 'guided');
    openTwo({ onComplete });
    fireEvent.click(screen.getByText(t(lang, 'continueBtn'))); // past adoration
    fireEvent.click(screen.getByText(t(lang, 'continueBtn'))); // past p1
    fireEvent.click(screen.getByText(t(lang, 'continueBtn'))); // past p2 → thanksgiving
    expect(screen.getByText(t(lang, 'stageThanksgiving'))).toBeTruthy();

    pickFormat('modeRequests'); // nothing left to pray in a requests-only walk
    expect(screen.getByText(t(lang, 'sessionDoneTitle'))).toBeTruthy();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('a movements-first format skips an already-finished requests stage', () => {
    localStorage.setItem('pfm_prayer_mode', 'guided');
    openTwo();
    fireEvent.click(screen.getByText(t(lang, 'continueBtn'))); // past adoration
    fireEvent.click(screen.getByText(t(lang, 'continueBtn'))); // past p1
    fireEvent.click(screen.getByText(t(lang, 'continueBtn'))); // past p2 → thanksgiving

    pickFormat('modeActs'); // adoration → confession → thanksgiving → requests
    expect(screen.getByText(t(lang, 'stageAdoration'))).toBeTruthy();
    fireEvent.click(screen.getByText(t(lang, 'continueBtn'))); // confession
    fireEvent.click(screen.getByText(t(lang, 'continueBtn'))); // thanksgiving
    // The final requests stage has nothing left → advancing finishes, no repeats.
    fireEvent.click(screen.getByText(t(lang, 'continueBtn')));
    expect(screen.getByText(t(lang, 'sessionDoneTitle'))).toBeTruthy();
    expect(screen.queryByText('Pour ma famille')).toBeNull();
  });
});
