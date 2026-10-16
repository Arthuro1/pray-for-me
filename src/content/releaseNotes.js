// What each release brought, shown on the "What's new" page (/whats-new) and
// announced once to existing members (the 'app_news' notification, queued by
// queue_app_news() — see 20261016180000_app_news_announcements.sql).
//
// Newest first. Text lives in the 16 locale files; an item's `id` picks its
// icon on the page. The push line for each release is in
// supabase/functions/_shared/appNews.ts, and releaseNotes.test.js keeps the
// two in step.
export const RELEASES = [
  {
    version: '1.0.6',
    date: '2026-10-16',
    summaryKey: 'whatsNew106Summary',
    items: [
      { id: 'spirit', titleKey: 'whatsNew106SpiritTitle', bodyKey: 'whatsNew106SpiritBody' },
      { id: 'meetings', titleKey: 'whatsNew106MeetingsTitle', bodyKey: 'whatsNew106MeetingsBody' },
      { id: 'church', titleKey: 'whatsNew106ChurchTitle', bodyKey: 'whatsNew106ChurchBody' },
      { id: 'circles', titleKey: 'whatsNew106CirclesTitle', bodyKey: 'whatsNew106CirclesBody' },
    ],
  },
];

export const LATEST_RELEASE = RELEASES[0];

export function releaseFor(version) {
  return RELEASES.find((r) => r.version === version) || null;
}

// The member's unread announcement of a release this build knows, newest
// first (the inbox order), or null.
export function unreadAppNews(notifications = []) {
  return notifications.find((n) => n.type === 'app_news' && !n.read_at && releaseFor(n.metadata?.version)) || null;
}
