import { useState, useEffect } from 'react';
import { X, Check, UserPlus, Plus, HandHeart, ChevronRight } from 'lucide-react';
import useCommunityStore from '../store/communityStore';
import { t } from '../i18n';
import { checklistFlags, checklistSteps, checklistVisible, dismissChecklist } from '../lib/groupChecklist';

const STEP_META = {
  invite: { icon: UserPlus, labelKey: 'checklistInvite' },
  request: { icon: Plus, labelKey: 'checklistRequest' },
  pray: { icon: HandHeart, labelKey: 'checklistPray' },
};

// Lightweight contextual checklist for a group's leader: invite → first
// request → pray. Never a blocking wizard — each row is just a shortcut to the
// group's existing actions, the whole card can be dismissed, and completed
// steps tick themselves off from live data until the card retires itself.
export default function GroupChecklist({ lang, group, requestCount, hasPrayed, onInvite, onAddRequest, onPray }) {
  const fetchGroupMembers = useCommunityStore((s) => s.fetchGroupMembers);
  const [memberCount, setMemberCount] = useState(null); // null = unknown yet
  const [, setVersion] = useState(0); // re-render after a dismissal/flag write
  const flags = checklistFlags(group.id);

  useEffect(() => {
    let cancelled = false;
    fetchGroupMembers(group.id).then((r) => {
      if (!cancelled) setMemberCount((r.members || []).length || 1);
    });
    return () => { cancelled = true; };
  }, [group.id]);

  if (memberCount === null) return null; // don't flash a wrong state while loading

  const steps = checklistSteps({ memberCount, requestCount, hasPrayed, flags });
  if (!checklistVisible(group.id, steps)) return null;

  // Valid sequencing: with no request yet there is nothing to pray over, so
  // "Begin praying" routes to adding the first request instead of pretending.
  const actions = {
    invite: onInvite,
    request: onAddRequest,
    pray: requestCount > 0 ? onPray : onAddRequest,
  };

  return (
    <div className="rounded-2xl p-4 mb-5" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'checklistTitle')}</h3>
        <button
          onClick={() => { dismissChecklist(group.id); setVersion((v) => v + 1); }}
          aria-label={t(lang, 'checklistDismiss')}
          title={t(lang, 'checklistDismiss')}
          className="w-11 h-11 -m-2 flex items-center justify-center rounded-full shrink-0"
          style={{ color: 'var(--text-3)' }}
        >
          <X size={15} />
        </button>
      </div>
      <div className="space-y-1">
        {steps.map((step) => {
          const { icon: Icon, labelKey } = STEP_META[step.id];
          return (
            <button
              key={step.id}
              onClick={step.done ? undefined : actions[step.id]}
              disabled={step.done}
              className="w-full min-h-[44px] flex items-center gap-2.5 px-2 py-2 rounded-xl text-left text-sm"
              style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-1)', opacity: step.done ? 0.65 : 1 }}
            >
              {step.done
                ? <Check size={15} className="shrink-0" style={{ color: 'var(--success)' }} aria-hidden="true" />
                : <Icon size={15} className="shrink-0" style={{ color: 'var(--accent)' }} aria-hidden="true" />}
              <span className="flex-1" style={{ textDecoration: step.done ? 'line-through' : 'none' }}>
                {t(lang, labelKey)}
              </span>
              {!step.done && <ChevronRight size={14} className="shrink-0 opacity-50" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
