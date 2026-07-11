import { describe, it, expect, vi, beforeEach } from 'vitest';

// Realtime callbacks are captured so we can simulate Supabase inserts/updates.
const captured = {};

vi.mock('../lib/logger', () => ({ devError: vi.fn() }));
vi.mock('../lib/supabase', () => {
  // A thenable chain: every builder method returns the chain, and awaiting it
  // resolves to an empty result (the store's write paths just need it not to
  // throw). Reads are driven directly via setState in the tests below.
  const chain = {
    select: () => chain,
    eq: () => chain,
    is: () => chain,
    lt: () => chain,
    order: () => chain,
    limit: () => chain,
    update: () => chain,
    maybeSingle: () => chain,
    then: (resolve) => resolve({ data: [], error: null, count: 0 }),
  };
  const channel = {
    on: (_event, opts, cb) => { captured[opts.event] = cb; return channel; },
    subscribe: () => channel,
  };
  return {
    supabase: {
      from: () => chain,
      channel: () => channel,
      removeChannel: () => {},
    },
  };
});

import useNotificationStore from './notificationStore';

const notif = (id, extra = {}) => ({
  id, recipient_id: 'u1', type: 'friend_request', metadata: {},
  created_at: new Date().toISOString(), read_at: null, seen_at: null, ...extra,
});

beforeEach(() => {
  useNotificationStore.getState().reset();
  for (const k of Object.keys(captured)) delete captured[k];
  vi.clearAllMocks();
});

describe('notificationStore realtime', () => {
  it('increments the unread count on a realtime insert', () => {
    const s = useNotificationStore.getState();
    useNotificationStore.setState({ userId: 'u1', notifications: [], unreadCount: 0 });
    s.subscribeNotifications('u1');
    captured.INSERT({ new: notif('n1') });
    const st = useNotificationStore.getState();
    expect(st.notifications).toHaveLength(1);
    expect(st.unreadCount).toBe(1);
  });

  it('ignores duplicate realtime inserts', () => {
    const s = useNotificationStore.getState();
    useNotificationStore.setState({ userId: 'u1', notifications: [], unreadCount: 0 });
    s.subscribeNotifications('u1');
    captured.INSERT({ new: notif('n1') });
    captured.INSERT({ new: notif('n1') }); // same id
    const st = useNotificationStore.getState();
    expect(st.notifications).toHaveLength(1);
    expect(st.unreadCount).toBe(1);
  });

  it('recomputes unread when a row is marked read on another device', () => {
    const s = useNotificationStore.getState();
    useNotificationStore.setState({ userId: 'u1', notifications: [notif('n1')], unreadCount: 1 });
    s.subscribeNotifications('u1');
    captured.UPDATE({ new: notif('n1', { read_at: new Date().toISOString() }) });
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });
});

describe('notificationStore read state', () => {
  it('markRead flips a single notification and decrements unread', async () => {
    useNotificationStore.setState({ userId: 'u1', notifications: [notif('n1'), notif('n2')], unreadCount: 2 });
    await useNotificationStore.getState().markRead('n1');
    const st = useNotificationStore.getState();
    expect(st.notifications.find((n) => n.id === 'n1').read_at).toBeTruthy();
    expect(st.unreadCount).toBe(1);
  });

  it('markRead is a no-op on an already-read notification', async () => {
    useNotificationStore.setState({ userId: 'u1', notifications: [notif('n1', { read_at: '2020-01-01' })], unreadCount: 0 });
    await useNotificationStore.getState().markRead('n1');
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('markAllRead clears the unread count', async () => {
    useNotificationStore.setState({ userId: 'u1', notifications: [notif('n1'), notif('n2')], unreadCount: 2 });
    await useNotificationStore.getState().markAllRead();
    const st = useNotificationStore.getState();
    expect(st.unreadCount).toBe(0);
    expect(st.notifications.every((n) => n.read_at)).toBe(true);
  });
});

describe('notificationStore lifecycle', () => {
  it('reset clears state when the user changes / logs out', () => {
    useNotificationStore.setState({ userId: 'u1', notifications: [notif('n1')], unreadCount: 1, error: 'load' });
    useNotificationStore.getState().reset();
    const st = useNotificationStore.getState();
    expect(st.notifications).toHaveLength(0);
    expect(st.unreadCount).toBe(0);
    expect(st.userId).toBeNull();
    expect(st.error).toBeNull();
  });
});
