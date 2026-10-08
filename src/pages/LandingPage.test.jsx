// @vitest-environment jsdom
//
// The landing page tells Zechariah's story (Luke 1:5–25) beside the app that
// serves each step: the Hebrew name and "Let your prayers rise", then Come,
// Bring, Carry, Together, Return · Listen, Remember · Respond, the author's
// letter, the facts and the questions. Landing copy is loaded from one locale
// chunk at a time, so assertions wait for that boundary.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

import LandingPage from './LandingPage';

afterEach(cleanup);
afterEach(() => vi.unstubAllEnvs());
beforeEach(() => {
  localStorage.setItem('pfm_language', 'en');
  localStorage.removeItem('pfm_theme');
  document.documentElement.removeAttribute('data-theme');
});

const renderLanding = (props = {}) => render(<LandingPage onBeginPrayer={() => {}} onSignIn={() => {}} {...props} />);
const sectionOf = async (name) => (await screen.findByRole('heading', { name })).closest('section');
const refButton = (scope, ref) => within(scope).getByRole('button', { name: new RegExp(ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) });

describe('LandingPage — Qetoret hero', () => {
  it('opens with the Hebrew name and "Let your prayers rise."', async () => {
    renderLanding();
    expect(await screen.findByRole('heading', { level: 1, name: 'Let your prayers rise.' })).toBeTruthy();
    const hebrew = screen.getByText('קְטֹרֶת');
    expect(hebrew.getAttribute('lang')).toBe('he');
    expect(hebrew.getAttribute('dir')).toBe('rtl');
    expect(screen.getByText('Hebrew for “incense”')).toBeTruthy();
    expect(screen.getByText(/^Build a life of prayer before God/)).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Qetoret' })).toBeTruthy();
  });

  it('never names the old brand outside the author\'s own letter', async () => {
    renderLanding();
    const letter = await sectionOf('Your prayer is not in vain.');
    const outside = document.body.textContent.replace(letter.textContent, '');
    expect(outside).not.toMatch(/Praystead/);
  });

  it('shows no example statistics at all', async () => {
    renderLanding();
    await screen.findAllByText('Begin with a prayer');
    expect(screen.queryByText(/illustrative data/i)).toBeNull();
    expect(screen.queryByText('Active prayers')).toBeNull();
  });
});

describe('LandingPage — the story', () => {
  it('follows Zechariah\'s story in order: Come, Bring, Carry, Together, Return · Listen, Remember · Respond', async () => {
    renderLanding();
    await screen.findByRole('heading', { name: 'Come before God through Christ' });
    const steps = [...document.querySelectorAll('.landing-beat__label')].map((label) => label.textContent);
    expect(steps.slice(0, 6)).toEqual(['Come', 'Bring', 'Carry', 'Together', 'Return · Listen', 'Remember · Respond']);
    // The seven movements close the page.
    expect(screen.getByText('Come · Bring · Carry · Return · Listen · Respond · Remember')).toBeTruthy();
  });

  it('comes before God through Christ: the name and the access, by reference only', async () => {
    renderLanding();
    const come = await sectionOf('Come before God through Christ');
    for (const ref of ['Exodus 30:7-8', 'Psalm 141:2', 'Revelation 5:8', 'Revelation 8:3-4', 'Hebrews 4:14-16', '1 Peter 2:9']) {
      expect(refButton(come, ref)).toBeTruthy();
    }
    // The app is a tool, never a mediator.
    expect(within(come).getByText(/never a go-between/)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Pray without ceasing/);
  });

  it('shows the seven Intercession Circles as a widening list, not levels', async () => {
    renderLanding();
    const section = await sectionOf('From your heart to the nations');
    const names = within(section).getAllByRole('listitem').map((li) => li.textContent);
    expect(names).toHaveLength(7);
    expect(names[0]).toMatch(/^My heart/);
    expect(names[6]).toMatch(/^Kingdom & Mission/);
  });

  it('lets a visitor carry a group request with the real Carry gesture', async () => {
    renderLanding();
    const together = await sectionOf('Carry one another in prayer');
    const carry = within(together).getByRole('button', { name: 'Carry this prayer' });
    expect(carry.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(carry);
    expect(within(together).getByRole('button', { name: 'Carrying' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(together).getByText('Answered')).toBeTruthy();
  });

  it('remembers a long-carried prayer and asks for a faithful next step', async () => {
    renderLanding();
    const remember = await sectionOf('Remember what God has done');
    expect(within(remember).getByText('Carried since March 2025')).toBeTruthy();
    expect(within(remember).getByText('You marked this prayer as answered.')).toBeTruthy();
    expect(within(remember).getByText('Is there a faithful next step?')).toBeTruthy();
  });

  it('no longer headlines AI Scripture suggestions; the FAQ says plainly that AI never speaks for God', async () => {
    renderLanding();
    await screen.findAllByText('Begin with a prayer');
    expect(screen.queryByRole('heading', { name: 'Pray with Scripture' })).toBeNull();
    const faq = await sectionOf('Questions');
    fireEvent.click(within(faq).getByRole('button', { name: 'Does AI speak for God?' }));
    expect(within(faq).getByText(/never prophesies, never declares a prayer answered/)).toBeTruthy();
    for (const q of ['Is Qetoret a social network?', 'Which churches is Qetoret for?']) {
      expect(within(faq).getByRole('button', { name: q })).toBeTruthy();
    }
    expect(within(faq).getByText('What you may want to know before you begin.')).toBeTruthy();
    // Every question wears a mark of its own.
    for (const question of within(faq).getAllByRole('button')) expect(question.querySelector('.icon-tile')).toBeTruthy();
  });

  it('keeps the practical facts in one visible strip instead of a folded feature grid', async () => {
    renderLanding();
    const facts = await sectionOf('Private, simple and free');
    expect(within(facts).getAllByRole('listitem')).toHaveLength(6);
    for (const fact of ['Private by default', 'Works offline', 'Navigation in 16 languages', 'Free and open source']) {
      expect(within(facts).getByRole('heading', { name: fact })).toBeTruthy();
    }
    expect(screen.queryByText('Explore all features')).toBeNull();
  });

  it.each([
    ['anthropic', 'Claude (Anthropic)'],
    ['ollama', 'Qetoret'],
  ])('discloses the configured %s recipient and optional prayer fields publicly', async (provider, label) => {
    vi.stubEnv('VITE_AI_PROVIDER', provider);
    renderLanding();
    const faq = await sectionOf('Questions');
    fireEvent.click(within(faq).getByRole('button', { name: 'How do Scripture suggestions work?' }));
    const answer = within(faq).getByText(/With your consent, the prayer title/).textContent;
    expect(answer).toContain(`through Qetoret's server to ${label}`);
    expect(answer).toContain('Details and the latest update are sent only if you include them.');
    expect(answer).toContain('before each prayer request');
    expect(answer).toContain('Text you choose to translate');
    expect(answer).toContain('Your language and the guidance option you select, when applicable');
    expect(answer).toContain('at any time in Settings to stop future requests');
    expect(answer).toContain('cannot recall text already sent');
    expect(answer).not.toContain('{provider}');
  });

  it('explains the Christian welcome and the limits of language coverage', async () => {
    renderLanding();
    const faq = await sectionOf('Questions');
    fireEvent.click(within(faq).getByRole('button', { name: 'Which churches is Qetoret for?' }));
    expect(within(faq).getByText(/Rooted in Scripture and shaped by a living faith in Jesus Christ/).textContent)
      .toContain('It never replaces your local church, its pastors or its fellowship.');
    fireEvent.click(within(faq).getByRole('button', { name: 'What languages are supported?' }));
    const answer = within(faq).getByText(/Navigation is available in 16 languages/).textContent;
    expect(answer).toContain('Devotional coverage varies');
    expect(answer).toContain('English or French');
    expect(answer).toContain('linguistically reviewed');
    expect(answer).toContain('partial landing translations');
  });
});

describe('LandingPage — the author\'s letter', () => {
  it('shows the first paragraph and unfolds the rest, with its passages, prayer and signature', async () => {
    renderLanding();
    const letter = await sectionOf('Your prayer is not in vain.');
    expect(within(letter).getByText(/^Some time ago, I made a commitment/)).toBeTruthy();
    expect(within(letter).queryByText(/^Perhaps you, too/)).toBeNull();
    expect(within(letter).queryByText('Father, help us to remain faithful in prayer.')).toBeNull();

    const toggle = within(letter).getByRole('button', { name: 'Read the whole letter' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(within(letter).getByText(/^Perhaps you, too/)).toBeTruthy();
    expect(within(letter).getByText('Father, help us to remain faithful in prayer.')).toBeTruthy();
    expect(refButton(letter, 'James 5:16')).toBeTruthy();
    expect(within(letter).getAllByText('Paul')).toHaveLength(2);

    fireEvent.click(within(letter).getByRole('button', { name: 'Show less' }));
    expect(within(letter).queryByText(/^Perhaps you, too/)).toBeNull();
  });
});

describe('LandingPage — pray first', () => {
  it('leads with a "Begin with a prayer" CTA (pray first, sign up only to save)', async () => {
    const onBeginPrayer = vi.fn();
    const onSignIn = vi.fn();
    renderLanding({ onBeginPrayer, onSignIn });
    // The primary hero CTA invites a prayer moment, not a signup.
    const [begin] = await screen.findAllByText('Begin with a prayer');
    fireEvent.click(begin);
    expect(onBeginPrayer).toHaveBeenCalled();
    expect(onSignIn).not.toHaveBeenCalled();
    // Existing users keep a direct "Sign in" path — in the nav, as the hero's
    // secondary action, and in the footer.
    expect(screen.getAllByText(/Sign in/).length).toBeGreaterThanOrEqual(3);
    fireEvent.click(screen.getAllByText('Sign in')[0]);
    expect(onSignIn).toHaveBeenCalled();
    // One invitation, worded the same everywhere: the hero, Bring, and the close.
    expect(screen.getAllByText('Begin with a prayer')).toHaveLength(3);
  });

  it('starts the guest prayer flow from the product-preview Pray now button', async () => {
    const onBeginPrayer = vi.fn();
    renderLanding({ onBeginPrayer });

    const prayNow = await screen.findByRole('button', { name: 'Pray now' });
    expect(prayNow.getAttribute('tabindex')).toBeNull();

    fireEvent.click(prayNow);

    expect(onBeginPrayer).toHaveBeenCalledTimes(1);
  });

  it('localizes every Bible reference (no English books inside French)', async () => {
    localStorage.setItem('pfm_language', 'fr');
    renderLanding();
    const together = await sectionOf('Portez-vous les uns les autres dans la prière');
    expect(refButton(together, 'Galates 6:2')).toBeTruthy();
    expect(screen.queryByText(/Galatians|Hebrews|Revelation|Exodus/)).toBeNull();
  });
});

describe('LandingPage legacy Night theme', () => {
  it('migrates Night to Dark and keeps the public toggle binary', async () => {
    localStorage.setItem('pfm_theme', 'night');
    renderLanding();

    await screen.findAllByText('Begin with a prayer');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('pfm_theme')).toBe('dark');

    fireEvent.click(screen.getByTitle('Light mode'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('pfm_theme')).toBe('light');
  });
});

describe('LandingPage language picker', () => {
  it('uses native names, explains partial translations, and closes on Escape', async () => {
    renderLanding();
    await screen.findAllByText('Begin with a prayer');

    const toggle = screen.getByRole('button', { name: 'Language: English' });
    fireEvent.click(toggle);

    expect(screen.getByRole('menu', { name: 'Language' })).toBeTruthy();
    expect(screen.getByRole('menuitemradio', { name: /Deutsch/ })).toBeTruthy();
    expect(screen.getByRole('menuitemradio', { name: /Русский.*Translation in progress/ })).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu', { name: 'Language' })).toBeNull();
    expect(document.activeElement).toBe(toggle);
  });
});
