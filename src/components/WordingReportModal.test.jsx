// @vitest-environment jsdom
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { loadLocale } from '../i18n';
import WordingReportModal from './WordingReportModal';
import { loadCatalogue } from '../content-quality/catalogue';
import { submitWordingReport } from '../lib/wordingReports';
vi.mock('../content-quality/catalogue', () => ({ loadCatalogue: vi.fn() }));
vi.mock('../lib/wordingReports', async (original) => ({ ...(await original()), submitWordingReport: vi.fn() }));
const entries = [{ id: 'ui:save', locale: 'en', surface: 'ui', key: 'save', text: 'Save a prayer' }];
beforeEach(async () => {
  await loadLocale('en');
  vi.clearAllMocks();
  loadCatalogue.mockResolvedValue(entries);
  submitWordingReport.mockResolvedValue(undefined);
});
afterEach(cleanup);
it('submits selected published wording and the explicit correction', async () => {
  render(<WordingReportModal lang="en" onClose={() => {}} />);
  await screen.findByRole('option', { name: /Save a prayer/ });
  fireEvent.change(screen.getByLabelText('Choose wording'), { target: { value: 'ui:save' } });
  fireEvent.change(screen.getByLabelText('Suggested wording (optional)'), { target: { value: 'Save prayer' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  await screen.findByText('Thank you for your feedback!');
  expect(submitWordingReport).toHaveBeenCalledWith({ locale: 'en', translation_key: 'ui:save', screen: 'ui', current_string: 'Save a prayer', issue_type: 'unnatural', suggested_wording: 'Save prayer' });
});
it('retains the correction after a submission failure so the user can retry', async () => {
  submitWordingReport.mockRejectedValueOnce(new Error('Offline'));
  render(<WordingReportModal lang="en" onClose={() => {}} />);
  await screen.findByRole('option', { name: /Save a prayer/ });
  fireEvent.change(screen.getByLabelText('Choose wording'), { target: { value: 'ui:save' } });
  fireEvent.change(screen.getByLabelText('Suggested wording (optional)'), { target: { value: 'Keep prayer' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  await screen.findByRole('alert');
  expect(screen.getByLabelText('Suggested wording (optional)').value).toBe('Keep prayer');
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  await waitFor(() => expect(submitWordingReport).toHaveBeenCalledTimes(2));
});
it('shows a recoverable catalogue-load failure', async () => {
  loadCatalogue.mockRejectedValueOnce(new Error('Chunk unavailable'));
  render(<WordingReportModal lang="en" onClose={() => {}} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
  await screen.findByRole('option', { name: /Save a prayer/ });
});
it('opens on the screen it was reported from, or the app text when that screen has none', async () => {
  const guide = { id: 'guides/acts:intro', locale: 'en', surface: 'guides/acts', key: 'intro', text: 'Adore God for who He is', surfaceLabel: 'ACTS' };
  loadCatalogue.mockResolvedValue([...entries, guide]);
  render(<WordingReportModal lang="en" initialSurface="guides/acts" onClose={() => {}} />);
  await screen.findByRole('option', { name: /Adore God/ });
  expect(screen.getByLabelText('Section').value).toBe('guides/acts');
  cleanup();
  render(<WordingReportModal lang="en" initialSurface="plans/unpublished" onClose={() => {}} />);
  await screen.findByRole('option', { name: /Save a prayer/ });
  expect(screen.getByLabelText('Section').value).toBe('ui');
});
