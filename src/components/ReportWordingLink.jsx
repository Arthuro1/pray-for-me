import { lazy, Suspense, useState } from 'react';
import { Flag } from 'lucide-react';
import { t } from '../i18n';
import useAuthStore from '../store/authStore';

const WordingReportModal = lazy(() => import('./WordingReportModal'));

// A quiet link under authored prose (plan days, teaching, guides) that opens
// the wording report already filtered to this screen. Reports are stored per
// account, so guests and anonymous sessions see nothing.
export default function ReportWordingLink({ lang, surface }) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  if (!user?.id || user.is_anonymous) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pressable flex min-h-11 items-center gap-1.5 text-xs"
        style={{ color: 'var(--text-3)' }}
      >
        <Flag size={12} aria-hidden="true" /> {t(lang, 'wordingReport')}
      </button>
      {open && (
        <Suspense fallback={null}>
          <WordingReportModal lang={lang} initialSurface={surface} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
