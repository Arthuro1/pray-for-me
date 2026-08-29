import { useState, useEffect, useCallback } from 'react';
import { X, Check, UserPlus, Plus, HandHeart, ChevronRight } from 'lucide-react';
import useCommunityStore from '../store/communityStore';
import { t } from '../i18n';
import { checklistFlags, checklistSteps, checklistVisible, dismissChecklist } from '../lib/groupChecklist';
import { useContextualNudgeSlot } from './shared/contextualNudge';

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
  const inviteDone = memberCount !== null && (memberCount >= 2 || !!flags.invited);

  const refreshMembers = useCallback(() => {
    let cancelled = false;
    fetchGroupMembers(group.id).then((r) => {
      if (!cancelled) setMemberCount((r.members || []).length || 1);
    });
    return () => { cancelled = true; };
  }, [group.id, fetchGroupMembers]);

  useEffect(refreshMembers, [refreshMembers]);

  // A member joining is a SERVER event with no client trigger, so the Invite
  // step would otherwise stay open until the leader left and re-entered the
  // group. Re-check when the app is brought back to the foreground — the moment
  // a leader returns after sharing a link. Event-driven, not polling: no timer,
  // one cheap request, and only while the step is still open (so a completed
  // checklist and Low data mode cost nothing at all).
  useEffect(() => {
    if (inviteDone) return undefined;
    const onFocus = () => { if (!document.hidden) refreshMembers(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [inviteDone, refreshMembers]);

  const steps = memberCount === null
    ? []
    : checklistSteps({ memberCount, requestCount, hasPrayed, flags });
  const eligible = memberCount !== null && checklistVisible(group.id, steps);
  const { visible, complete } = useContextualNudgeSlot(`group-checklist-${group.id}`, eligible, 40);
  if (!visible) return null; // includes the member-count loading state

  // Valid sequencing: with no request yet there is nothing to pray over, so the
  // row SAYS "Add a request first" and goes there — never an apparently
  // available "Begin praying" that can't be honoured.
  const actions = {
    invite: () => { complete(); onInvite?.(); },
    request: () => { complete(); onAddRequest?.(); },
    pray: () => { complete(); (requestCount > 0 ? onPray : onAddRequest)?.(); },
  };

  return (
    <div className="rounded-2xl p-4 mb-5" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'checklistTitle')}</h3>
        <button
          onClick={() => { dismissChecklist(group.id); complete(); setVersion((v) => v + 1); }}
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
          // A blocked step names the action that IS available right now.
          const label = t(lang, step.blocked ? 'checklistAddRequestFirst' : labelKey);
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
                {label}
              </span>
              {!step.done && <ChevronRight size={14} className="shrink-0 opacity-50" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
