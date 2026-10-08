// Progressive disclosure for a group's request-list tools: a three-person group
// with two requests needs no search field. The control appears only when the
// data makes it useful, and callers must treat a hidden control's state as
// inert (no invisible filtering). Active / Answered / Testimonies is the wall's
// one switch and is always there.

// Below this many requests, scanning beats searching.
export const SEARCH_MIN_REQUESTS = 6;

// Which list controls this group's wall has earned:
//   search — enough requests that scrolling stops being enough
export function groupListControls(prayers) {
  return { search: (prayers || []).length >= SEARCH_MIN_REQUESTS };
}
