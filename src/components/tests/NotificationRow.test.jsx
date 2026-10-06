// @vitest-environment jsdom
//
// The inbox row stays privacy-safe: its label is a fixed generic string per
// type, and the only identity it may add is the GROUP the recipient already
// belongs to — never an actor, a name, or any content.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import NotificationRow from '../NotificationRow';
import { t } from '../../i18n';

const lang = 'fr';
const notification = (extra = {}) => ({
  id: 'n1', type: 'community_update', entity_type: 'community_prayer',
  created_at: '2026-08-20T10:00:00Z', read_at: null, group_id: null, ...extra,
});

afterEach(cleanup);

describe('NotificationRow group context', () => {
  it('shows the generic type icon when the notification has no group', () => {
    render(<NotificationRow notification={notification()} lang={lang} onActivate={() => {}} />);
    expect(document.querySelector('.avatar')).toBeNull();
    expect(screen.getByRole('button').textContent).toContain(t(lang, 'notifCommunityUpdate'));
  });

  it('leads with the group tile, honouring the group’s chosen preset', () => {
    const group = { id: 'g1', name: 'Famille', avatar_type: 'icon', avatar_value: 'church', avatar_color: '#1f7d76' };
    render(<NotificationRow notification={notification({ group_id: 'g1' })} lang={lang} onActivate={() => {}} group={group} />);
    const tile = document.querySelector('.avatar');
    expect(tile).not.toBeNull();
    expect(tile.style.background).toBe('rgb(31, 125, 118)');
    // The type stays glanceable as a badge beside the group tile.
    expect(document.querySelectorAll('svg').length).toBeGreaterThan(1);
  });

  it('renders a group that has no avatar columns yet', () => {
    render(<NotificationRow notification={notification({ group_id: 'g1' })} lang={lang} onActivate={() => {}}
      group={{ id: 'g1', name: 'Ancien groupe' }} />);
    expect(document.querySelector('.avatar')).not.toBeNull();
  });

  it('keeps the label generic — the group name is never spoken or printed', () => {
    const group = { id: 'g1', name: 'Famille', avatar_type: 'icon', avatar_value: 'church', avatar_color: '#1f7d76' };
    render(<NotificationRow notification={notification({ group_id: 'g1' })} lang={lang} onActivate={() => {}} group={group} />);
    const row = screen.getByRole('button');
    expect(row.getAttribute('aria-label')).toBe(t(lang, 'notifCommunityUpdate'));
    expect(row.textContent).not.toContain('Famille');
    // The tile is decorative: it adds recognition for sighted readers without
    // putting a second, redundant identity into the row's accessible name.
    expect(document.querySelector('.avatar').closest('[aria-hidden="true"]')).not.toBeNull();
  });
});
