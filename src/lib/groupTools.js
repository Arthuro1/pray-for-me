// Progressive disclosure for a group's request-list tools: a three-person group
// with two requests needs neither a search field nor three status filters. The
// controls appear only when the data makes them useful, and callers must treat
// a hidden control's state as inert (no invisible filtering).

// Below this many requests, scanning beats searching.
export const SEARCH_MIN_REQUESTS = 6;

// Which list controls this group's wall has earned:
//   search       — enough requests that scrolling stops being enough
//   statusFilter — both Active and Answered exist, so filtering means something
export function groupListControls(prayers) {
  const list = prayers || [];
  const hasAnswered = list.some((p) => p.is_answered);
  const hasActive = list.some((p) => !p.is_answered);
  return {
    search: list.length >= SEARCH_MIN_REQUESTS,
    statusFilter: hasAnswered && hasActive,
  };
}
