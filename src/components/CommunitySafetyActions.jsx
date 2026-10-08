import { useState } from 'react';
import { Flag, UserX } from 'lucide-react';
import useCommunityStore from '../store/communityStore';
import { safetyText } from '../lib/communitySafety';
import { toast } from '../store/toastStore';
import { t } from '../i18n';
import OverflowMenu from './shared/OverflowMenu';
import ConfirmDialog from './shared/ConfirmDialog';

// Use the actual row's type/id/author, not its parent prayer's author: an update
// or testimony can be written by a different group member.
export default function CommunitySafetyActions({ contentType, contentId, authorId, userId, lang }) {
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const report = useCommunityStore((state) => state.reportCommunityContent);
  const block = useCommunityStore((state) => state.setUserBlocked);
  if (!userId || !authorId || authorId === userId) return null;

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = action === 'block'
        ? await block(authorId, true, userId)
        : await report(contentType, contentId, action === 'reportAuthor' ? 'harassment' : 'other');
      if (result?.error) {
        toast.error(t(lang, 'errorGeneric'));
        return;
      }
      toast.success(safetyText(lang, action === 'block' ? 'blocked' : 'reported'));
      setAction(null);
    } catch {
      toast.error(t(lang, 'errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <OverflowMenu lang={lang} items={[
        { key: 'report', icon: Flag, label: safetyText(lang, 'report'), onClick: () => setAction('report') },
        { key: 'reportAuthor', icon: Flag, label: safetyText(lang, 'reportAuthor'), onClick: () => setAction('reportAuthor') },
        { key: 'block', icon: UserX, label: safetyText(lang, 'block'), danger: true, onClick: () => setAction('block') },
      ]} />
      {action && <ConfirmDialog
        title={safetyText(lang, action === 'block' ? 'block' : action === 'reportAuthor' ? 'reportAuthor' : 'report')}
        message={safetyText(lang, action === 'block' ? 'blockConfirm' : 'reportConfirm')}
        confirmLabel={safetyText(lang, action === 'block' ? 'block' : 'report')}
        cancelLabel={t(lang, 'cancel')}
        onConfirm={handleConfirm}
        onCancel={() => setAction(null)}
        loading={busy}
        danger={action === 'block'}
      />}
    </>
  );
}
