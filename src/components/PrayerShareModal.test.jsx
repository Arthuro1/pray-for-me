// @vitest-environment jsdom
//
// Extracted from PrayerDetail. The critical behaviour to lock in is the vault
// safety gate: sharing an E2E-encrypted prayer to a NEW group publishes a
// plaintext copy, so the Save button must stay disabled until the user ticks the
// acknowledgement. French is the always-loaded locale, so assertions go through t().
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

// Analytics is a privacy choke point that ships to Vercel; stub it so we can
// assert the share event fired without a real provider.
const { trackSpy } = vi.hoisted(() => ({ trackSpy: vi.fn() }));
vi.mock('../lib/analytics', () => ({
  track: trackSpy,
  EVENTS: { PRAYER_SHARED: 'prayer_shared' },
}));

import PrayerShareModal from './PrayerShareModal';
import { t } from '../i18n';

const lang = 'fr';
const groups = [{ id: 'g1', name: 'Family' }, { id: 'g2', name: 'Church' }];
const plainPrayer = { id: 'p1', title: 'Peace for my family' };
const vaultPrayer = { id: 'p2', title: 'Secret', encrypted_payload: { v: 1, iv: 'aa', ct: 'bb' } };

afterEach(() => { cleanup(); trackSpy.mockClear(); });

function renderModal(props = {}) {
  const setPrayerShares = vi.fn(async () => ({}));
  const onClose = vi.fn();
  render(
    <PrayerShareModal
      prayer={plainPrayer}
      groups={groups}
      sharedGroups={[]}
      authorName="Paul"
      userId="u1"
      setPrayerShares={setPrayerShares}
      lang={lang}
      onClose={onClose}
      {...props}
    />
  );
  return { setPrayerShares, onClose };
}

describe('PrayerShareModal', () => {
  it('lists the user\'s groups and shows no vault warning for a plain prayer', () => {
    renderModal();
    expect(screen.getByText('Family')).toBeTruthy();
    expect(screen.getByText('Church')).toBeTruthy();
    expect(screen.queryByText(t(lang, 'shareEncryptedWarning'))).toBeNull();
  });

  it('shares the selected group and fires a content-free share event', async () => {
    const { setPrayerShares, onClose } = renderModal();
    // Group checkboxes come first, then the "anonymous" toggle.
    fireEvent.click(screen.getAllByRole('checkbox')[0]); // select Family
    fireEvent.click(screen.getByText(t(lang, 'save')));

    expect(setPrayerShares).toHaveBeenCalledTimes(1);
    expect(setPrayerShares.mock.calls[0][0]).toEqual(
      expect.objectContaining({ groupIds: ['g1'], isAnonymous: false, userId: 'u1', authorName: 'Paul' })
    );
    // track + onClose run after the awaited save resolves.
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(trackSpy).toHaveBeenCalledWith('prayer_shared', { channel: 'group' });
  });

  it('warns and blocks Save until the vault acknowledgement is ticked', () => {
    const { setPrayerShares } = renderModal({ prayer: vaultPrayer });
    expect(screen.getByText(t(lang, 'shareEncryptedWarning'))).toBeTruthy();

    // Adding a NEW group surfaces the acknowledgement and gates Save.
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    const saveBtn = screen.getByText(t(lang, 'save')).closest('button');
    expect(saveBtn.disabled).toBe(true);

    // Tick the acknowledgement (last checkbox) → Save unlocks.
    const boxes = screen.getAllByRole('checkbox');
    fireEvent.click(boxes[boxes.length - 1]);
    expect(saveBtn.disabled).toBe(false);

    fireEvent.click(saveBtn);
    expect(setPrayerShares).toHaveBeenCalledTimes(1);
  });

  it('closes without sharing when Cancel is clicked', () => {
    const { setPrayerShares, onClose } = renderModal();
    fireEvent.click(screen.getByText(t(lang, 'cancel')));
    expect(onClose).toHaveBeenCalled();
    expect(setPrayerShares).not.toHaveBeenCalled();
  });
});
