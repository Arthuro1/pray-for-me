// The call link of an online prayer meeting: only a real web address is kept,
// and the service it belongs to is named from its host so members recognise
// it at a glance ("Zoom", "Google Meet"…). The link itself is an access
// credential: it lives only inside the meeting's encrypted payload and is never
// logged, tracked or sent anywhere but the member's own browser tab.

// Host suffix → the service's own name (a proper noun, the same in every language).
const PLATFORMS = Object.freeze([
  ['zoom.us', 'Zoom'],
  ['zoom.com', 'Zoom'],
  ['meet.google.com', 'Google Meet'],
  ['teams.microsoft.com', 'Microsoft Teams'],
  ['teams.live.com', 'Microsoft Teams'],
  ['chat.whatsapp.com', 'WhatsApp'],
  ['call.whatsapp.com', 'WhatsApp'],
  ['wa.me', 'WhatsApp'],
  ['whatsapp.com', 'WhatsApp'],
  ['slack.com', 'Slack'],
  ['discord.gg', 'Discord'],
  ['discord.com', 'Discord'],
  ['signal.group', 'Signal'],
  ['signal.me', 'Signal'],
  ['t.me', 'Telegram'],
  ['telegram.me', 'Telegram'],
  ['webex.com', 'Webex'],
  ['meet.jit.si', 'Jitsi Meet'],
  ['skype.com', 'Skype'],
  ['facetime.apple.com', 'FaceTime'],
  ['youtube.com', 'YouTube'],
  ['youtu.be', 'YouTube'],
]);

export const MEETING_LINK_MAX = 500;

// The address as an absolute https/http URL, or null. A bare host
// ("zoom.us/j/123") is read as https; any other scheme (javascript:, data:,
// file:…) is refused.
export function safeMeetingUrl(text) {
  const raw = String(text || '').trim();
  if (!raw || raw.length > MEETING_LINK_MAX || /\s/.test(raw)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  let url;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (!url.hostname.includes('.') || url.username || url.password) return null;
  return url.href;
}

// The service's name for a meeting link, or null for any other site.
export function meetingPlatform(text) {
  const href = safeMeetingUrl(text);
  if (!href) return null;
  const host = new URL(href).hostname.toLowerCase().replace(/^www\./, '');
  const match = PLATFORMS.find(([suffix]) => host === suffix || host.endsWith(`.${suffix}`));
  return match ? match[1] : null;
}
