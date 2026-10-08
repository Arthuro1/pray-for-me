// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AiOutputReport from '../AiOutputReport';
import { supabase } from '../../lib/supabase';
import { t } from '../../i18n';

vi.mock('../../lib/supabase', () => ({ supabase: { from: vi.fn() } }));
vi.mock('../../store/authStore', () => ({ default: () => ({ user: { id: 'private-user', email: 'private@example.com', user_metadata: { full_name: 'Private Name' } } }) }));
vi.mock('../../store/prayerStore', () => ({ default: (selector) => selector({ settings: { language: 'en' }, prayers: [{ title: 'Private prayer never attached' }] }) }));

const insert = vi.fn();
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  insert.mockResolvedValue({ error: null });
  supabase.from.mockReturnValue({ insert });
});

describe('AI output reporting', () => {
  it('requires reader input and retains deletion ownership without attaching name, email or prayer content', async () => {
    render(<AiOutputReport lang="en" />);
    fireEvent.click(screen.getByRole('button', { name: 'Report AI output' }));
    const submit = screen.getByRole('button', { name: t('en', 'feedbackSubmit') });
    expect(submit.disabled).toBe(true);
    expect(insert).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'This suggestion contained offensive language.' } });
    fireEvent.click(submit);
    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
    expect(supabase.from).toHaveBeenCalledWith('feedback');
    expect(insert.mock.calls[0][0]).toEqual([{
      type: 'bug', message: '[AI output report]\nThis suggestion contained offensive language.',
      user_id: 'private-user', name: null, email: null, lang: 'en',
    }]);
    expect(JSON.stringify(insert.mock.calls)).not.toContain('Private prayer');
  });

  it('keeps the report available after a failed submission', async () => {
    insert.mockResolvedValue({ error: { message: 'offline' } });
    render(<AiOutputReport lang="en" />);
    fireEvent.click(screen.getByRole('button', { name: 'Report AI output' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'An incorrect generated response.' } });
    fireEvent.click(screen.getByRole('button', { name: t('en', 'feedbackSubmit') }));
    await screen.findByRole('alert');
    expect(screen.getByRole('textbox').value).toBe('An incorrect generated response.');
  });
});
