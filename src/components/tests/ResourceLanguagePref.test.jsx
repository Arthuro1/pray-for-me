// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ResourceLanguagePref from '../ResourceLanguagePref';

describe('ResourceLanguagePref', () => {
  beforeEach(() => {
    localStorage.clear();
  });

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

    expect(JSON.parse(localStorage.getItem('pfm_resource_langs'))).toEqual(['en', 'de']);
    expect(screen.getByRole('checkbox', { name: 'Deutsch' }).getAttribute('aria-checked')).toBe('true');
  });
});
