// Notifications are on by default: every device that could receive them is
// asked once, from a card on Today, until the person answers. Answering means
// the system prompt (allowed or blocked) or hiding the card; either way this
// device is never asked again. The browser decides what "asked" means for the
// system prompt; hiding the card is remembered here, per device.
import { pushAvailable } from '../push';

export const NOTIFICATION_ASK_DISMISSED_KEY = 'pfm_notification_ask_dismissed';

export function notificationAskDismissed() {
  try { return localStorage.getItem(NOTIFICATION_ASK_DISMISSED_KEY) === '1'; }
  catch { return false; }
}

export function dismissNotificationAsk() {
  try { localStorage.setItem(NOTIFICATION_ASK_DISMISSED_KEY, '1'); }
  catch { /* private mode: the card still hides for this visit */ }
}

// Push works here and nobody has answered for this device yet.
export function canAskForNotifications() {
  return pushAvailable() && Notification.permission === 'default' && !notificationAskDismissed();
}
