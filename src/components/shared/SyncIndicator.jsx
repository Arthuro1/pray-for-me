import { useState, useEffect } from 'react';
import { Loader2, CloudOff } from 'lucide-react';
import usePrayerStore from '../../store/prayerStore';
import { subscribeQueue, pendingCount } from '../../lib/mutationQueue';
import { t } from '../../i18n';

// Small status pill: shows queued offline writes ("n waiting") and, once back
// online, that they're syncing. Hidden when the queue is empty.
export default function SyncIndicator() {
  const lang = usePrayerStore((s) => s.settings.language) || 'fr';
  const [count, setCount] = useState(pendingCount());
  const [online, setOnline] = useState(typeof navigator === 'undefined' || navigator.onLine);

  useEffect(() => subscribeQueue(setCount), []);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (count === 0) return null;

  return (
    <div
      className="fixed z-[105] flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)', right: 16, background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-2)' }}
    >
      {online
        ? <><Loader2 size={12} className="animate-spin" style={{ color: 'var(--accent)' }} /> {t(lang, 'syncing')}</>
        : <><CloudOff size={12} style={{ color: 'var(--text-3)' }} /> {t(lang, 'pendingChanges', { n: count })}</>}
    </div>
  );
}
