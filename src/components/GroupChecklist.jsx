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
    <section className="group-checklist" aria-labelledby={`group-checklist-${group.id}`}>
      <div className="group-checklist__head">
        <h3 id={`group-checklist-${group.id}`} className="group-checklist__title">{t(lang, 'checklistTitle')}</h3>
        <button
          type="button"
          onClick={() => { dismissChecklist(group.id); complete(); setVersion((v) => v + 1); }}
          aria-label={t(lang, 'checklistDismiss')}
          title={t(lang, 'checklistDismiss')}
          className="icon-button pressable -me-2 shrink-0"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <ul className="group-checklist__steps">
        {steps.map((step) => {
          const { icon: Icon, labelKey } = STEP_META[step.id];
          // A blocked step names the action that IS available right now.
          const label = t(lang, step.blocked ? 'checklistAddRequestFirst' : labelKey);
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={step.done ? undefined : actions[step.id]}
                disabled={step.done}
                className="group-checklist__step pressable"
              >
                {step.done ? <Check size={16} aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}
                <span className="flex-1">{label}</span>
                {!step.done && <ChevronRight size={16} className="rtl-mirror shrink-0" style={{ color: 'var(--q-text-tertiary)' }} aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
