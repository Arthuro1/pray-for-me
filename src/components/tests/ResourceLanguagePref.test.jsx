// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ResourceLanguagePref from '../ResourceLanguagePref';

describe('ResourceLanguagePref', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // The harness has no global auto-cleanup: without this each render stacks up
  // in the document and by-role queries match every previous copy too.
  afterEach(cleanup);

  it('offers only languages backed by approved, renderable catalogue editions', () => {
    const { container } = render(<ResourceLanguagePref lang="fr" />);
    fireEvent.click(container.querySelector('[aria-controls="resource-languages-panel"]'));

    // These languages have at least one displayable resource somewhere in the
    // bundled catalogue (Hindi currently comes from the freedom-plan domain).
    expect(screen.getByRole('checkbox', { name: 'English' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Deutsch' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'हिन्दी' })).toBeTruthy();

    // Draft or needs-review editions do not make a language selectable.
    for (const label of ['Kiswahili', 'አማርኛ', 'Tagalog', 'فارسی']) {
      expect(screen.queryByRole('checkbox', { name: label }), label).toBeNull();
    }
  });

  it('does not summarize a stale stored language that no longer has coverage', () => {
    localStorage.setItem('pfm_resource_langs', JSON.stringify(['en', 'sw']));
    const { container } = render(<ResourceLanguagePref lang="fr" />);

    expect(container.textContent).toContain('English');
    expect(container.textContent).not.toContain('Kiswahili');
  });

  it('persists a supported additional language when it is checked', () => {
    const { container } = render(<ResourceLanguagePref lang="fr" />);
    fireEvent.click(container.querySelector('[aria-controls="resource-languages-panel"]'));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Deutsch' }));

    expect(JSON.parse(localStorage.getItem('pfm_resource_langs'))).toEqual(['de', 'en']);
    expect(screen.getByRole('checkbox', { name: 'Deutsch' }).getAttribute('aria-checked')).toBe('true');
  });

  // The stored list is a PRIORITY order and a work is offered in the first
  // enabled language that has a verified edition. Appending a newly ticked
  // language put it behind the preselected English, and since nearly every
  // catalogue work has an English edition, ticking a language changed nothing
  // the reader could see. A deliberate choice must outrank the default one.
  it('ranks a newly checked language ahead of the preselected English', () => {
    const { container } = render(<ResourceLanguagePref lang="fr" />);
    fireEvent.click(container.querySelector('[aria-controls="resource-languages-panel"]'));
    fireEvent.click(screen.getByRole('checkbox', { name: '日本語' }));

    const stored = JSON.parse(localStorage.getItem('pfm_resource_langs'));
    expect(stored.indexOf('ja')).toBeLessThan(stored.indexOf('en'));
  });

  it('re-checking a language moves it back to the front of the order', () => {
    localStorage.setItem('pfm_resource_langs', JSON.stringify(['de', 'en']));
    const { container } = render(<ResourceLanguagePref lang="fr" />);
    fireEvent.click(container.querySelector('[aria-controls="resource-languages-panel"]'));
    const english = screen.getByRole('checkbox', { name: 'English' });
    fireEvent.click(english); // off
    fireEvent.click(english); // on again — now the strongest preference

    expect(JSON.parse(localStorage.getItem('pfm_resource_langs'))).toEqual(['en', 'de']);
  });

  // The numbered chain is what makes the order legible without a sentence of
  // copy to translate sixteen times, so it is part of the contract.
  it('shows the resolved priority order, app language first', () => {
    localStorage.setItem('pfm_resource_langs', JSON.stringify(['de', 'en']));
    const { container } = render(<ResourceLanguagePref lang="fr" />);

    expect(container.textContent).toContain('1. Français');
    expect(container.textContent).toContain('2. Deutsch');
    expect(container.textContent).toContain('3. English');
  });
});
