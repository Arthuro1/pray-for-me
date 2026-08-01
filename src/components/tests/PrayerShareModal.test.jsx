// @vitest-environment jsdom
//
// Extracted from PrayerDetail. Under default E2EE a shared prayer is written to
// the group ENCRYPTED under the group's key (not plaintext), so there is no
// "unencrypted copy" ack gate anymore — instead the modal always shows an
// honest note that group members will be able to read the request. French is
// the always-loaded locale, so assertions go through t().
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

// Analytics is a privacy choke point that ships to Vercel; stub it so we can
// assert the share event fired without a real provider.
const { trackSpy } = vi.hoisted(() => ({ trackSpy: vi.fn() }));
vi.mock('../../lib/analytics', () => ({
  track: trackSpy,
  EVENTS: { PRAYER_SHARED: 'prayer_shared' },
}));

import PrayerShareModal from '../PrayerShareModal';
import { t } from '../../i18n';
import { safetyText } from '../../lib/communitySafety';

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
  it('lists the user\'s groups and shows the honest "group members can read this" note', () => {
    renderModal();
    expect(screen.getByText('Family')).toBeTruthy();
    expect(screen.getByText('Church')).toBeTruthy();
    // Honest new-model copy is always present.
    expect(screen.getByText(t(lang, 'shareGroupInfo'))).toBeTruthy();
  });

  it('surfaces the anonymity note only when sharing anonymously', () => {
    renderModal();
    expect(screen.queryByText(t(lang, 'shareAnonNote'))).toBeNull();
    // The anonymous toggle is the checkbox after the group checkboxes.
    const boxes = screen.getAllByRole('checkbox');
    fireEvent.click(boxes[groups.length]); // the "anonymous" toggle
    expect(screen.getByText(t(lang, 'shareAnonNote'))).toBeTruthy();
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

  it('shares an encrypted (vault) prayer to a new group without any ack gate', async () => {
    // The community copy is encrypted under the group key, so sharing needs no
    // "I understand this is unencrypted" acknowledgement — Save works directly.
    const { setPrayerShares, onClose } = renderModal({ prayer: vaultPrayer });
    // The honest note is shown; there is no acknowledgement checkbox to gate Save.
    expect(screen.getByText(t(lang, 'shareGroupInfo'))).toBeTruthy();

    fireEvent.click(screen.getAllByRole('checkbox')[0]); // select Family
    const saveBtn = screen.getByText(t(lang, 'save')).closest('button');
    expect(saveBtn.disabled).toBe(false);

    fireEvent.click(saveBtn);
    expect(setPrayerShares).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('requires an explicit review when a new share contains contact details', async () => {
    const prayer = { id: 'p3', title: 'Please call +49 151 234 5678' };
    const { setPrayerShares } = renderModal({ prayer });
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(screen.getByText(safetyText(lang, 'sensitive'))).toBeTruthy();
    const save = screen.getByText(t(lang, 'save')).closest('button');
    expect(save.disabled).toBe(true);
    fireEvent.click(screen.getByText(safetyText(lang, 'acknowledge')));
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    expect(setPrayerShares).toHaveBeenCalledTimes(1);
  });

  it('closes without sharing when Cancel is clicked', () => {
    const { setPrayerShares, onClose } = renderModal();
    fireEvent.click(screen.getByText(t(lang, 'cancel')));
    expect(onClose).toHaveBeenCalled();
    expect(setPrayerShares).not.toHaveBeenCalled();
  });
});
