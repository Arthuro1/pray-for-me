// @vitest-environment jsdom
//
// "Carry this prayer" is one deliberate gesture, not a like: the Rise Mark
// lifts once when someone starts carrying, the label settles on "Carrying",
// and laying the prayer down again never plays the lift.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import CarryButton from '../shared/CarryButton';
import { circleReach } from '../shared/circleGeometry';
import { CIRCLES } from '../../lib/circles';
import { t } from '../../i18n';

const lang = 'fr';
afterEach(cleanup);

describe('CarryButton', () => {
  it('lifts the Rise Mark once when the reader starts carrying', () => {
    const onToggle = vi.fn();
    const { container, rerender } = render(<CarryButton carrying={false} onToggle={onToggle} lang={lang} />);
    const button = screen.getByRole('button', { name: t(lang, 'carryThisPrayer') });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelector('.carry-button__lift')).toBeNull();

    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
    rerender(<CarryButton carrying onToggle={onToggle} lang={lang} />);
    expect(screen.getByRole('button', { name: t(lang, 'carryingLabel') }).getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelectorAll('.carry-button__lift')).toHaveLength(1);
  });

  it('does not lift when the reader lays the prayer down', () => {
    const { container } = render(<CarryButton carrying onToggle={() => {}} lang={lang} />);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'carryingLabel') }));
    expect(container.querySelector('.carry-button__lift')).toBeNull();
  });

  it('ignores presses while the change is being saved', () => {
    const onToggle = vi.fn();
    render(<CarryButton carrying={false} busy onToggle={onToggle} lang={lang} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).not.toHaveBeenCalled();
  });
});

describe('CircleGlyph', () => {
  it('widens from the heart outward, one step per circle', () => {
    const radii = CIRCLES.map(circleReach);
    radii.slice(1).forEach((r, i) => expect(r).toBeGreaterThan(radii[i]));
    expect(radii[radii.length - 1]).toBeLessThanOrEqual(12 - 0.75);
  });
});
