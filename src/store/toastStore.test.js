import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useToastStore, { toast } from './toastStore.js';

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('toastStore', () => {
  it('pushes a toast with message and type', () => {
    toast.error('boom');
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ message: 'boom', type: 'error' });
  });

  it('assigns unique ids', () => {
    toast.success('a');
    toast.success('b');
    const ids = useToastStore.getState().toasts.map((t) => t.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('auto-dismisses after the ttl', () => {
    toast.info('temp');
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(4000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('dismiss removes only the targeted toast', () => {
    const id = useToastStore.getState().push('keep', 'info', 0); // ttl 0 = no auto-dismiss
    useToastStore.getState().push('drop', 'error', 0);
    useToastStore.getState().dismiss(id);
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('drop');
  });
});
