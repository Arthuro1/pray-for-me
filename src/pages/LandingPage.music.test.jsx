// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import LandingPage from './LandingPage';
import en from './landing/locales/landing-en';
import { CIRCLE_UI } from '../content/intercessionCircles';

const PRIMARY_VIDEO = 'Z5YubX-PfNQ';
const SECOND_VIDEO = 't3R9KRZlWGA';
const renderLanding = (props = {}) => render(<LandingPage onBeginPrayer={vi.fn()} onSignIn={vi.fn()} {...props} />);
const watchLabel = (copy = en) => copy.music.play.replace('{title}', copy.music.title);
const watchButton = (copy = en) => screen.getByRole('button', { name: watchLabel(copy) });
const musicSection = (copy = en) => screen.getByRole('region', { name: copy.music.heading });
const player = () => document.querySelector('iframe');
const beginButtons = () => screen.getAllByRole('button', { name: en.beginLabel });
const externalLink = (copy = en) => within(musicSection(copy)).getByRole('link', {
  name: (name) => name.includes(copy.music.external) && name.includes(copy.music.externalNotice),
});
const openPlayer = (copy = en) => {
  fireEvent.click(watchButton(copy));
  expect(document.querySelectorAll('iframe')).toHaveLength(1);
  return player();
};

let connectionDescriptor;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('pfm_language', 'en');
  connectionDescriptor = Object.getOwnPropertyDescriptor(navigator, 'connection');
  Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: false } });
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (connectionDescriptor) Object.defineProperty(navigator, 'connection', connectionDescriptor);
  else delete navigator.connection;
  document.documentElement.removeAttribute('lang');
  document.documentElement.removeAttribute('dir');
  document.documentElement.removeAttribute('data-theme');
});

describe('LandingPage optional YouTube invitation', () => {
  it('follows the hero and its primary prayer CTA, immediately before Zechariah’s story', () => {
    renderLanding();
    const hero = screen.getByRole('heading', { level: 1, name: en.hero.title }).closest('section');
    const encouragement = musicSection();
    const story = screen.getByRole('heading', { name: en.come.title }).closest('.landing__story');

    expect(within(hero).getByRole('button', { name: en.beginLabel })).toBeTruthy();
    expect(hero.nextElementSibling).toBe(encouragement);
    expect(encouragement.nextElementSibling).toBe(story);
    expect(within(encouragement).getByText(en.music.invitation)).toBeTruthy();
    expect(within(encouragement).getByRole('button', { name: en.beginLabel })).toBeTruthy();
  });

  it.each([
    ['ordinary browsing', false, false],
    ['low-data preference', true, false],
    ['browser data saving', false, true],
    ['both data-saving preferences', true, true],
  ])('starts silent without YouTube resource requests in %s', (_, lowDataMode, saveData) => {
    localStorage.setItem('pfm_settings', JSON.stringify({ lowDataMode }));
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData } });
    renderLanding();

    expect(watchButton().getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('iframe, audio, video')).toBeNull();
    const thirdPartyResources = [...document.querySelectorAll('img[src], source[src], script[src], link[href]')]
      .filter((node) => /youtube|ytimg|googlevideo/i.test(node.getAttribute('src') || node.getAttribute('href')));
    expect(thirdPartyResources).toHaveLength(0);
    expect(within(musicSection()).queryByRole('img')).toBeNull();
    expect(externalLink().href).toBe(`https://www.youtube.com/watch?v=${PRIMARY_VIDEO}`);
  });

  it('loads the primary recording only after a choice and exposes the native visible player', () => {
    renderLanding();
    const button = watchButton();
    const frame = openPlayer();
    const url = new URL(frame.src);

    expect(url.origin).toBe('https://www.youtube-nocookie.com');
    expect(url.pathname).toBe(`/embed/${PRIMARY_VIDEO}`);
    expect(url.searchParams.get('autoplay')).toBe('0');
    expect(url.searchParams.get('controls')).toBe('1');
    expect(url.searchParams.get('playsinline')).toBe('1');
    expect(url.searchParams.get('hl')).toBe('en');
    expect(url.searchParams.has('list')).toBe(false);
    expect(url.searchParams.has('start_radio')).toBe(false);
    expect(url.searchParams.get('disablekb')).not.toBe('1');
    expect(frame.title).toContain(en.music.title);
    expect(frame.title).toContain('Chords of Light Music');
    expect(frame.title).toContain('YouTube');
    expect(frame.hasAttribute('allowfullscreen')).toBe(true);
    expect(frame.getAttribute('allow')).toContain('fullscreen');
    expect(frame.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
    expect(frame.closest('[hidden], [aria-hidden="true"]')).toBeNull();
    expect(document.getElementById(button.getAttribute('aria-controls')).contains(frame)).toBe(true);
    expect(document.getElementById(button.getAttribute('aria-describedby')).textContent).toBe(en.music.privacy);
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('keeps a native keyboard-accessible button and its focus when opening and closing', () => {
    renderLanding();
    const button = watchButton();
    expect(button.tagName).toBe('BUTTON');
    expect(button.disabled).toBe(false);
    expect(button.tabIndex).toBe(0);
    button.focus();
    fireEvent.click(button);

    expect(document.activeElement).toBe(button);
    expect(screen.getByRole('button', { name: en.music.close })).toBe(button);
    fireEvent.click(button);
    expect(player()).toBeNull();
    expect(watchButton()).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('removes the previous recording before switching and waits for another watch action', () => {
    renderLanding();
    const first = openPlayer();
    const select = screen.getByRole('combobox', { name: en.music.recording });
    expect(within(select).getAllByRole('option').map((option) => option.value)).toEqual([PRIMARY_VIDEO, SECOND_VIDEO]);

    fireEvent.change(select, { target: { value: SECOND_VIDEO } });
    expect(first.isConnected).toBe(false);
    expect(player()).toBeNull();
    expect(watchButton().getAttribute('aria-expanded')).toBe('false');
    expect(externalLink().href).toBe(`https://www.youtube.com/watch?v=${SECOND_VIDEO}`);
    const second = openPlayer();
    expect(new URL(second.src).pathname).toBe(`/embed/${SECOND_VIDEO}`);
    expect(second.title).toContain('Adi Eze of Africa');
    expect(second).not.toBe(first);

    fireEvent.change(select, { target: { value: PRIMARY_VIDEO } });
    expect(second.isConnected).toBe(false);
    expect(player()).toBeNull();
    expect(new URL(openPlayer().src).pathname).toBe(`/embed/${PRIMARY_VIDEO}`);
  });

  it('keeps an external fallback usable before loading and while the iframe is unavailable', () => {
    renderLanding();
    const link = externalLink();
    expect(link.target).toBe('_blank');
    expect(link.rel.split(' ')).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
    expect(within(musicSection()).getByText(en.music.fallback)).toBeTruthy();
    expect(within(musicSection()).getByText(en.music.privacy)).toBeTruthy();
    const frame = openPlayer();
    // No load event is dispatched: blocked cross-origin frames cannot be
    // reliably detected from iframe events, so fallback and close stay usable.
    expect(externalLink()).toBe(link);
    expect(screen.getByRole('button', { name: en.music.close }).disabled).toBe(false);
    fireEvent.click(link);
    expect(frame.isConnected).toBe(false);
    expect(player()).toBeNull();
    expect(watchButton().disabled).toBe(false);
    expect(openPlayer()).not.toBe(frame);
  });
});

describe('LandingPage YouTube prayer handoff', () => {
  it('opens every silent prayer invitation synchronously', () => {
    const onBeginPrayer = vi.fn();
    renderLanding({ onBeginPrayer });
    const buttons = [...beginButtons(), screen.getByRole('button', { name: en.prayNowLabel })];
    expect(buttons).toHaveLength(5);
    buttons.forEach((button, index) => {
      fireEvent.click(button);
      expect(onBeginPrayer).toHaveBeenCalledTimes(index + 1);
      expect(player()).toBeNull();
    });
  });

  it.each([
    ['hero', () => beginButtons()[0]],
    ['listening invitation', () => beginButtons()[1]],
    ['Bring', () => beginButtons()[2]],
    ['closing invitation', () => beginButtons()[3]],
    ['product preview', () => screen.getByRole('button', { name: en.prayNowLabel })],
  ])('removes the iframe before immediately opening prayer from the %s', (_, getButton) => {
    const onBeginPrayer = vi.fn(() => {
      expect(player()).toBeNull();
      expect(screen.getByRole('heading', { level: 1, name: en.hero.title })).toBeTruthy();
    });
    renderLanding({ onBeginPrayer });
    const frame = openPlayer();

    fireEvent.click(getButton());
    expect(onBeginPrayer).toHaveBeenCalledExactlyOnceWith();
    expect(frame.isConnected).toBe(false);
    expect(watchButton().getAttribute('aria-expanded')).toBe('false');
  });

  it.each([0, 1, 2])('removes the iframe before sign-in entry %s without waiting for player readiness', (index) => {
    const onSignIn = vi.fn(() => expect(player()).toBeNull());
    renderLanding({ onSignIn });
    const frame = openPlayer();

    fireEvent.click(screen.getAllByRole('button', { name: /^Sign in/ })[index]);
    expect(onSignIn).toHaveBeenCalledExactlyOnceWith();
    expect(frame.isConnected).toBe(false);
  });

  it('preserves the selected circle and prayer prompt while removing the iframe', async () => {
    const onBeginPrayer = vi.fn(() => expect(player()).toBeNull());
    renderLanding({ onBeginPrayer });
    const frame = openPlayer();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${en.circles.items[0].name}`) }));
    const teaching = within(document.getElementById('landing-circle-panel'));
    fireEvent.click(teaching.getByRole('button', { name: CIRCLE_UI.explore.en }));
    // Deep teaching is imported on demand; allow that chunk to resolve even
    // when the full suite shares CPU with the build and browser checks.
    fireEvent.click(await teaching.findByRole('button', { name: /Seven foundations/ }, { timeout: 5000 }));
    fireEvent.click(teaching.getByRole('button', { name: 'Communion with God' }));
    fireEvent.click(teaching.getAllByRole('button', { name: CIRCLE_UI.prayThis.en })[0]);

    expect(onBeginPrayer).toHaveBeenCalledExactlyOnceWith({
      circle: 'self', prompt: 'Teach me to seek You before I seek answers.',
    });
    expect(frame.isConnected).toBe(false);
  }, 10000);

  it('preserves remembered prayer-session music and low-data preferences throughout listening and handoff', () => {
    const settings = JSON.stringify({ lowDataMode: true, language: 'en' });
    localStorage.setItem('pfm_prayer_audio_track', 'soft-piano');
    localStorage.setItem('pfm_settings', settings);
    const onBeginPrayer = vi.fn();
    const view = renderLanding({ onBeginPrayer });
    openPlayer();
    fireEvent.change(screen.getByRole('combobox', { name: en.music.recording }), { target: { value: SECOND_VIDEO } });
    openPlayer();
    fireEvent.click(beginButtons()[0]);
    view.unmount();

    expect(onBeginPrayer).toHaveBeenCalledExactlyOnceWith();
    expect(localStorage.getItem('pfm_prayer_audio_track')).toBe('soft-piano');
    expect(localStorage.getItem('pfm_settings')).toBe(settings);
  });
});

describe('LandingPage YouTube lifecycle and localization', () => {
  it('closes when hidden and remains silent after the visitor returns', () => {
    renderLanding();
    const frame = openPlayer();
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));

    expect(frame.isConnected).toBe(false);
    expect(player()).toBeNull();
    hidden.mockReturnValue(false);
    fireEvent(document, new Event('visibilitychange'));
    expect(player()).toBeNull();
    expect(watchButton().getAttribute('aria-expanded')).toBe('false');
    expect(openPlayer()).not.toBe(frame);
  });

  it('removes the player on pagehide and does not resume on pageshow', () => {
    renderLanding();
    const frame = openPlayer();
    fireEvent(window, new Event('pagehide'));
    expect(frame.isConnected).toBe(false);
    fireEvent(window, new Event('pageshow'));
    expect(player()).toBeNull();
    expect(watchButton().getAttribute('aria-expanded')).toBe('false');
  });

  it('removes the iframe when the landing page unmounts', () => {
    const view = renderLanding();
    const frame = openPlayer();
    view.unmount();
    expect(frame.isConnected).toBe(false);
    expect(player()).toBeNull();
    fireEvent(window, new Event('pagehide'));
    fireEvent(document, new Event('visibilitychange'));
    expect(player()).toBeNull();
  });

  it('localizes the invitation and accessible controls in Arabic and keeps RTL around the native player', async () => {
    const ar = (await import('./landing/locales/landing-ar')).default;
    localStorage.setItem('pfm_language', 'ar');
    renderLanding();
    await waitFor(() => expect(document.documentElement.lang).toBe('ar'));

    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.queryByRole('button', { name: watchLabel(en) })).toBeNull();
    expect(within(musicSection(ar)).getByText(ar.music.invitation)).toBeTruthy();
    expect(screen.getByRole('combobox', { name: ar.music.recording })).toBeTruthy();
    expect(externalLink(ar)).toBeTruthy();
    const frame = openPlayer(ar);
    expect(frame.title).toContain(ar.music.title);
    expect(new URL(frame.src).searchParams.get('hl')).toBe('ar');
    expect(screen.getByRole('button', { name: ar.music.close })).toBeTruthy();
    expect(document.documentElement.dir).toBe('rtl');
  });
});