import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import ContextualNudgeCard from './shared/ContextualNudgeCard';
import { useContextualNudgeSlot } from './shared/contextualNudge';
import OriginMigrationGuide from './OriginMigrationGuide';
import { isOriginalAppOrigin, migrationPromptSnoozed, snoozeMigrationPrompt } from '../lib/originMigration';
import { originMigrationCopy } from '../lib/originMigrationCopy';

export default function OriginMigrationBanner({ lang }) {
  const { user } = useAuthStore();
  const [hidden, setHidden] = useState(() => migrationPromptSnoozed(user?.id));
  const [open, setOpen] = useState(false);
  const { copy, lang: copyLang } = originMigrationCopy(lang);
  const eligible = !!user?.id && !hidden && isOriginalAppOrigin();
  const { visible, complete } = useContextualNudgeSlot('origin-migration', eligible, 11);
  const snooze = () => {
    snoozeMigrationPrompt(user.id);
    complete();
    setHidden(true);
  };

  return (
    <>
      {visible && (
        <div className="phase-page__shell pt-4" lang={copyLang} dir="ltr">
          <ContextualNudgeCard icon={ArrowUpRight} titleId="origin-migration-title" title={copy.title} body={<p className="m-0">{copy.nudge}</p>} actionLabel={copy.open} onAction={() => setOpen(true)} dismissLabel={copy.later} onDismiss={snooze} />
        </div>
      )}
      {open && <OriginMigrationGuide lang={lang} onClose={() => setOpen(false)} />}
    </>
  );
}
