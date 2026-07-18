import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import usePrayerStore from '../../store/prayerStore';
import { t } from '../../i18n';

export default function OfflineBanner() {
  const lang = usePrayerStore(s => s.settings.language) || 'fr';
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!offline) return null;

  // Announced politely: losing connection is worth knowing, not worth
  // interrupting a prayer for. The icon + text (never colour alone) say it
  // visually; the live region says it to a screen reader.
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[110] flex items-center justify-center gap-2 py-1.5 text-xs font-medium text-white"
      style={{ background: '#475569' }}
    >
      <WifiOff size={13} aria-hidden="true" /> {t(lang, 'offline')}
    </div>
  );
}
