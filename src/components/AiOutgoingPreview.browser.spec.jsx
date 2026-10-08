// Regression for long requests pushing the preview's heading and Send action
// beyond the screen. These fixtures make no auth or network requests.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { cleanup, render, screen } from '@testing-library/react';
import '../index.css';

vi.mock('../store/prayerStore', async () => {
  const { create } = await import('zustand');
  const store = create((set) => ({
    settings: {},
    updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
  }));
  return { default: store };
});
import usePrayerStore from '../store/prayerStore';
import AiOutgoingPreview from './AiOutgoingPreview';
import { loadLocale, t } from '../i18n';

beforeEach(() => usePrayerStore.setState({ settings: { aiSendDescription: true, aiSendUpdate: true } }));
afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.removeProperty('font-size');
});

function renderPreview(lang, onCancel = vi.fn()) {
  return render(<AiOutgoingPreview lang={lang} title="Kraft und Hoffnung für die kommende Woche" description={'Bitte bete für Weisheit, Kraft und liebevolle Unterstützung.\n\n'.repeat(120)} update={'Ein neues Update zu dieser Bitte.\n'.repeat(100)} onSend={() => {}} onCancel={onCancel} />);
}

describe('AI outgoing preview layout', () => {
  it.each([
    ['de', 1440, 900, 'light', '100%'],
    ['de', 1794, 849, 'dark', '100%'],
    ['de', 390, 640, 'light', '100%'],
    ['de', 320, 568, 'dark', '100%'],
    ['de', 640, 360, 'dark', '100%'],
    ['de', 390, 640, 'light', '150%'],
    ['ar', 360, 640, 'dark', '100%'],
  ])('keeps the heading and actions visible at %s %ix%i (%s, text %s)', async (lang, width, height, theme, fontSize) => {
    await page.viewport(width, height);
    await loadLocale(lang);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.fontSize = fontSize;
    renderPreview(lang);
    await document.fonts.ready;

    const dialog = screen.getByRole('dialog', { name: t(lang, 'aiPreviewTitle') });
    const header = screen.getByRole('heading', { name: t(lang, 'aiPreviewTitle') });
    const send = screen.getByRole('button', { name: t(lang, 'aiPreviewSend') });
    const cancel = screen.getByRole('button', { name: t(lang, 'cancel') });
    const body = screen.getByRole('region', { name: t(lang, 'aiPreviewTitle') });
    for (const node of [dialog, header, send, cancel]) {
      const bounds = node.getBoundingClientRect();
      expect(bounds.top).toBeGreaterThanOrEqual(0);
      expect(bounds.bottom).toBeLessThanOrEqual(window.innerHeight);
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(window.innerWidth);
    }
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    expect(body.clientHeight).toBeGreaterThan(40);
    const sendTop = send.getBoundingClientRect().top;
    body.scrollTop = body.scrollHeight;
    expect(send.getBoundingClientRect().top).toBe(sendTop);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);

    if (lang === 'de' && fontSize === '100%' && (width === 1440 || width === 390)) {
      body.scrollTop = 0;
      await page.screenshot({ path: `../../design-qa/ai-preview-${width === 1440 ? 'desktop' : 'mobile'}.png`, element: dialog.parentElement });
    }
  });

  it('keeps keyboard focus inside the preview and supports Escape', async () => {
    await page.viewport(390, 640);
    await loadLocale('fr');
    const onCancel = vi.fn();
    renderPreview('fr', onCancel);
    const close = screen.getByRole('button', { name: t('fr', 'close') });
    const send = screen.getByRole('button', { name: t('fr', 'aiPreviewSend') });
    expect(document.activeElement).toBe(close);
    send.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(close);
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(send);
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
