import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import { isEventPushEnabled } from '../lib/notificationPrefs';
import { canAskForNotifications, dismissNotificationAsk } from '../lib/notificationAsk';
import { ACTIVATION_STEPS, markActivationStepHandled, markEducationHandledForVisit } from '../lib/activationProgress';
import useTurnOnReminders from './useTurnOnReminders';

// Today's notifications card (lib/notificationAsk.js). It shows only on a
// device that has never answered, and never to someone who switched push off
// in Settings. Any answer also settles the reminder nudge and ends teaching
// for this visit, so no other card takes its place in the same breath.
export default function useNotificationAsk() {
  const userId = useAuthStore((s) => s.user?.id);
  const turnOnReminders = useTurnOnReminders();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId || !canAskForNotifications()) return undefined;
    let live = true;
    isEventPushEnabled(userId)
      .then((pushOn) => { if (live) setVisible(pushOn); })
      .catch(() => { /* offline: ask on a later visit */ });
    return () => { live = false; };
  }, [userId]);

  const settle = () => {
    markActivationStepHandled(ACTIVATION_STEPS.REMINDER);
    markEducationHandledForVisit();
    setVisible(false);
  };

  const turnOn = async () => {
    setBusy(true);
    await turnOnReminders();
    setBusy(false);
    settle();
  };

  const dismiss = () => {
    dismissNotificationAsk();
    settle();
  };

  return { visible, busy, turnOn, dismiss };
}
