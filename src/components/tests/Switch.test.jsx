// @vitest-environment jsdom
//
// The shared Switch: real switch semantics (role, aria-checked, accessible
// name), native-button keyboard activation, visible focus, and a ≥44px hit
// area — used by Settings toggles and the group auto-add preference.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Switch from '../shared/Switch';

afterEach(cleanup);

describe('Switch', () => {
  it('exposes switch role, label and checked state', () => {
    render(<Switch checked={false} onChange={() => {}} label="Low data mode" />);
    const sw = screen.getByRole('switch', { name: 'Low data mode' });
    expect(sw.getAttribute('aria-checked')).toBe('false');
    cleanup();
    render(<Switch checked onChange={() => {}} label="Low data mode" />);
    expect(screen.getByRole('switch', { name: 'Low data mode' }).getAttribute('aria-checked')).toBe('true');
  });

  it('is a native button — keyboard activation comes for free — and reports the next value', () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Auto add" />);
    const sw = screen.getByRole('switch', { name: 'Auto add' });
    expect(sw.tagName).toBe('BUTTON');
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('meets the ~44px minimum target size via its padded hit area', () => {
    render(<Switch checked={false} onChange={() => {}} label="Auto add" />);
    const cls = screen.getByRole('switch', { name: 'Auto add' }).className;
    expect(cls).toContain('q-switch');
    const css = readFileSync('src/styles/components.css', 'utf8');
    expect(css).toMatch(/\.q-switch \{[^}]*min-width: 44px;[^}]*min-height: 44px;/);
    expect(css).toMatch(/\.q-switch:focus-visible \{[^}]*outline: 2px solid/);
  });

  it('does not fire when disabled', () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Auto add" disabled />);
    fireEvent.click(screen.getByRole('switch', { name: 'Auto add' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
