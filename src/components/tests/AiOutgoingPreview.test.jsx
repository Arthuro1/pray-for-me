// @vitest-environment jsdom
//
// Before the first AI request for a prayer, the user sees the EXACT outgoing
// text. The default is minimum-data (title only; description opt-in), sensitive
// tokens are redacted in the preview, and names are only hidden on request.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../lib/supabase', () => {
  const chain = {
    upsert: () => Promise.resolve({ data: null, error: null }),
    select: () => chain,
    eq: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };
  return { supabase: { auth: { getUser: async () => ({ data: { user: null } }) }, from: () => chain } };
});

import AiOutgoingPreview from '../AiOutgoingPreview';
import usePrayerStore from '../../store/prayerStore';
import { t } from '../../i18n';

const lang = 'en';
afterEach(cleanup);
beforeEach(() => {
  usePrayerStore.setState({ settings: { language: lang, aiSendDescription: false, aiHideNames: false }, userId: null });
});

describe('AiOutgoingPreview', () => {
  it('shows the title and redacts sensitive tokens; hides the description by default', () => {
    render(
      <AiOutgoingPreview
        lang={lang}
        title="Email me at test@example.com about mom"
        description="Her number is +1 415 555 2671"
        onSend={() => {}}
        onCancel={() => {}}
      />,
    );
    // Email in the title is redacted in the preview.
    expect(screen.getByText(/\[EMAIL_1\] about mom/)).toBeTruthy();
    expect(screen.queryByText(/test@example\.com/)).toBeNull();
    // Description is excluded by default (minimum-data), so its content is absent.
    expect(screen.queryByText(/555 2671/)).toBeNull();
    expect(screen.queryByText(/\[PHONE_1\]/)).toBeNull();
  });

  it('reveals the (redacted) description when the user opts in', () => {
    render(
      <AiOutgoingPreview lang={lang} title="Pray for mom" description="Her number is +1 415 555 2671" onSend={() => {}} onCancel={() => {}} />,
    );
    fireEvent.click(screen.getByRole('switch', { name: t(lang, 'aiPreviewIncludeDescription') }));
    // Now the description shows, with the phone redacted.
    expect(screen.getByText(/\[PHONE_1\]/)).toBeTruthy();
    expect(screen.queryByText(/555 2671/)).toBeNull();
    expect(usePrayerStore.getState().settings.aiSendDescription).toBe(true);
  });

  it('reveals the latest update as its own opt-in field, separate from the description', () => {
    render(
      <AiOutgoingPreview
        lang={lang}
        title="Pray for mom"
        description="Some background"
        update="She had surgery today"
        onSend={() => {}}
        onCancel={() => {}}
      />,
    );
    // Both are hidden by default (minimum-data).
    expect(screen.queryByText('She had surgery today')).toBeNull();
    expect(screen.queryByText('Some background')).toBeNull();
    // Opting into the update reveals ONLY the update, not the description.
    fireEvent.click(screen.getByRole('switch', { name: t(lang, 'aiPreviewIncludeUpdate') }));
    expect(screen.getByText('She had surgery today')).toBeTruthy();
    expect(screen.queryByText('Some background')).toBeNull();
    expect(usePrayerStore.getState().settings.aiSendUpdate).toBe(true);
  });

  it('calls onSend and onCancel', () => {
    const onSend = vi.fn();
    const onCancel = vi.fn();
    render(<AiOutgoingPreview lang={lang} title="Pray for mom" description="" onSend={onSend} onCancel={onCancel} />);
    fireEvent.click(screen.getByText(t(lang, 'aiPreviewSend')));
    expect(onSend).toHaveBeenCalled();
    fireEvent.click(screen.getByText(t(lang, 'cancel')));
    expect(onCancel).toHaveBeenCalled();
  });
});
